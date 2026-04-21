/**
 * AutoApply Launcher: Orchestrates the job application loop.
 * Acquires jobs from the database, runs the agent on each, and records results.
 */

import { chromium, type Browser, type BrowserContext } from "playwright";
import { eq, sql, and, isNull, or, desc } from "drizzle-orm";
import { jobs, applicantProfile, autoApplyLog } from "../../drizzle/schema";
import type { Job, ApplicantProfile } from "../../drizzle/schema";
import { getDb } from "../db";
import { runAgent, downloadResume, type AgentResult } from "./agent";
import { isBlockedUrl } from "./blocked-sites";

// ─── State ──────────────────────────────────────────────────────────────────

let _isRunning = false;
let _shouldStop = false;
let _currentJob: { id: number; title: string; company: string } | null = null;
let _progress = { applied: 0, failed: 0, remaining: 0, total: 0 };
let _logs: string[] = [];
let _browser: Browser | null = null;

// ─── Public State Accessors ─────────────────────────────────────────────────

export function getAutoApplyStatus() {
  return {
    isRunning: _isRunning,
    currentJob: _currentJob
      ? `${_currentJob.title} @ ${_currentJob.company}`
      : null,
    progress: { ..._progress },
    log: _logs.slice(-50),
  };
}

export function isAutoApplyRunning() {
  return _isRunning;
}

// ─── Database Helpers ───────────────────────────────────────────────────────

/** Acquire the next job to apply to, atomically marking it as in_progress */
async function acquireJob(minScore: number): Promise<Job | null> {
  const db = await getDb();
  if (!db) return null;

  // Find eligible jobs: status = to_apply, not blocked, not too many attempts
  const candidates = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.status, "to_apply"),
        or(isNull(jobs.applyStatus), eq(jobs.applyStatus, "failed")),
        sql`${jobs.applyAttempts} < 3`,
        sql`${jobs.matchScore} >= ${minScore}`,
        sql`${jobs.applyUrl} IS NOT NULL AND ${jobs.applyUrl} != ''`
      )
    )
    .orderBy(desc(jobs.matchScore))
    .limit(1);

  if (candidates.length === 0) return null;

  const job = candidates[0]!;

  // Check if URL is blocked
  const blocked = isBlockedUrl(job.applyUrl || "");
  if (blocked.blocked) {
    // Mark as manual and skip
    await db
      .update(jobs)
      .set({
        applyStatus: "manual",
        applyError: blocked.reason || "Blocked site",
      })
      .where(eq(jobs.id, job.id));
    addLog(`SKIP: ${job.title} @ ${job.company} — ${blocked.reason}`);
    return acquireJob(minScore); // Recursively try next
  }

  // Atomically claim this job
  await db
    .update(jobs)
    .set({
      applyStatus: "in_progress",
      lastAttemptedAt: new Date(),
    })
    .where(eq(jobs.id, job.id));

  return { ...job, applyStatus: "in_progress" } as Job;
}

/** Record the result of an apply attempt */
async function markResult(
  jobId: number,
  result: AgentResult,
  agentId: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const job = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  const jobRow = job[0];

  // Update the job record
  const updates: Record<string, unknown> = {
    applyStatus: result.status,
    applyError: result.error || null,
    applyAttempts: sql`${jobs.applyAttempts} + 1`,
    applyDurationMs: result.durationMs,
    agentId,
    lastAttemptedAt: new Date(),
  };

  // If successfully applied, also update the main status
  if (result.status === "applied") {
    updates.status = "applied";
    updates.appliedAt = new Date();
    updates.statusChangedAt = new Date();
  }

  await db.update(jobs).set(updates).where(eq(jobs.id, jobId));

  // Insert into the log table
  await db.insert(autoApplyLog).values({
    jobId,
    jobTitle: jobRow?.title || null,
    jobCompany: jobRow?.company || null,
    status: result.status as any,
    errorMessage: result.error || null,
    durationMs: result.durationMs,
    agentId,
  });
}

/** Get the applicant profile */
async function getApplicantProfile(): Promise<ApplicantProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(applicantProfile).limit(1);
  return rows[0] ?? null;
}

/** Count remaining eligible jobs */
async function countRemainingJobs(minScore: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(
      and(
        eq(jobs.status, "to_apply"),
        or(isNull(jobs.applyStatus), eq(jobs.applyStatus, "failed")),
        sql`${jobs.applyAttempts} < 3`,
        sql`${jobs.matchScore} >= ${minScore}`,
        sql`${jobs.applyUrl} IS NOT NULL AND ${jobs.applyUrl} != ''`
      )
    );
  return result.length;
}

/** Get recent auto-apply history */
export async function getAutoApplyHistory(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(autoApplyLog)
    .orderBy(desc(autoApplyLog.attemptedAt))
    .limit(limit);
}

// ─── Logging ────────────────────────────────────────────────────────────────

function addLog(message: string) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const entry = `[${timestamp}] ${message}`;
  _logs.push(entry);
  if (_logs.length > 200) _logs = _logs.slice(-100);
  console.log(`[AutoApply] ${message}`);
}

// ─── Browser Management ─────────────────────────────────────────────────────

async function launchBrowser(): Promise<Browser> {
  addLog("Launching Chromium browser...");
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-notifications",
      "--deny-permission-prompts",
      "--no-first-run",
      "--disable-extensions",
    ],
  });
  addLog("Browser launched successfully");
  return browser;
}

async function closeBrowser(browser: Browser) {
  try {
    await browser.close();
    addLog("Browser closed");
  } catch (e) {
    console.error("[AutoApply] Failed to close browser:", e);
  }
}

// ─── Main Loop ──────────────────────────────────────────────────────────────

export interface AutoApplyOptions {
  minScore: number;
  maxJobs: number;
}

export async function startAutoApply(
  options: AutoApplyOptions
): Promise<{ started: boolean; error?: string; jobsQueued: number }> {
  if (_isRunning) {
    return { started: false, error: "AutoApply is already running", jobsQueued: 0 };
  }

  // Validate profile exists
  const profile = await getApplicantProfile();
  if (!profile || !profile.personal) {
    return {
      started: false,
      error: "Applicant profile not configured. Please fill in your profile first.",
      jobsQueued: 0,
    };
  }

  // Count available jobs
  const remaining = await countRemainingJobs(options.minScore);
  if (remaining === 0) {
    return {
      started: false,
      error: "No eligible jobs found matching the criteria.",
      jobsQueued: 0,
    };
  }

  const jobsToProcess = Math.min(options.maxJobs, remaining);

  // Reset state
  _isRunning = true;
  _shouldStop = false;
  _currentJob = null;
  _progress = { applied: 0, failed: 0, remaining: jobsToProcess, total: jobsToProcess };
  _logs = [];

  addLog(`Starting AutoApply: minScore=${options.minScore}, maxJobs=${jobsToProcess}`);

  // Run the loop in the background
  setImmediate(() => runLoop(options, profile));

  return { started: true, jobsQueued: jobsToProcess };
}

export function stopAutoApply(): { stopped: boolean } {
  if (!_isRunning) return { stopped: false };
  _shouldStop = true;
  addLog("Stop requested — will finish current job and halt");
  return { stopped: true };
}

async function runLoop(options: AutoApplyOptions, profile: ApplicantProfile) {
  let browser: Browser | null = null;
  const agentId = `worker-${Date.now()}`;

  try {
    browser = await launchBrowser();
    _browser = browser;
    let processed = 0;

    while (!_shouldStop && processed < options.maxJobs) {
      // Acquire next job
      const job = await acquireJob(options.minScore);
      if (!job) {
        addLog("No more eligible jobs — stopping");
        break;
      }

      _currentJob = { id: job.id, title: job.title, company: job.company };
      addLog(`Processing: ${job.title} @ ${job.company} (score: ${job.matchScore})`);

      // Create a new browser context for isolation
      let context: BrowserContext | null = null;
      try {
        context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          locale: "en-US",
        });
        const page = await context.newPage();

        // Download resume if available
        let resumePath: string | null = null;
        if (job.resumeGeneratedPath) {
          resumePath = await downloadResume(job.resumeGeneratedPath);
          if (resumePath) {
            addLog(`Resume downloaded to ${resumePath}`);
          }
        }

        // Build context for the agent
        const applyContext = {
          job: {
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            applyUrl: job.applyUrl,
          },
          profile,
          resumeText: job.description?.slice(0, 2000) || "", // Use job desc as context
        };

        // Run the agent
        const result = await runAgent(page, applyContext, resumePath, (log) => {
          addLog(`  [${log.action}] ${log.detail.slice(0, 100)}`);
        });

        // Record result
        await markResult(job.id, result, agentId);

        if (result.status === "applied") {
          _progress.applied++;
          addLog(`SUCCESS: ${job.title} @ ${job.company} — Applied in ${Math.round(result.durationMs / 1000)}s`);
        } else {
          _progress.failed++;
          addLog(`FAILED: ${job.title} @ ${job.company} — ${result.status}: ${result.error}`);
        }

        // Clean up temp resume
        if (resumePath) {
          try {
            const fs = await import("fs/promises");
            await fs.unlink(resumePath);
          } catch {}
        }
      } catch (jobErr) {
        _progress.failed++;
        const errMsg = jobErr instanceof Error ? jobErr.message : String(jobErr);
        addLog(`ERROR: ${job.title} @ ${job.company} — ${errMsg}`);
        await markResult(
          job.id,
          {
            status: "failed",
            error: errMsg,
            durationMs: 0,
            steps: 0,
          },
          agentId
        );
      } finally {
        if (context) {
          await context.close().catch(() => {});
        }
      }

      processed++;
      _progress.remaining = Math.max(0, _progress.total - processed);
      _currentJob = null;

      // Brief pause between jobs
      if (!_shouldStop && processed < options.maxJobs) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  } catch (loopErr) {
    addLog(`FATAL: ${loopErr instanceof Error ? loopErr.message : String(loopErr)}`);
  } finally {
    // Always clean up
    if (browser) {
      await closeBrowser(browser);
    }
    _browser = null;
    _isRunning = false;
    _shouldStop = false;
    _currentJob = null;
    addLog(
      `AutoApply complete: ${_progress.applied} applied, ${_progress.failed} failed`
    );
  }
}
