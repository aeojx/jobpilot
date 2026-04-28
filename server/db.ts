import { and, count, desc, eq, gte, inArray, like, or, sql, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  Job,
  InsertJob,
  InsertQuestion,
  InsertFetchSchedule,
  InsertFetchHistory,
  apiUsage,
  applierGamification,
  applierStats,
  fetchHistory,
  fetchSchedules,
  jobs,
  questionBank,
  skillsProfile,
  swipeStats,
  systemConfig,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { apifyPostJson } from "./apify-fetch";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export async function getAllJobs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs).orderBy(desc(jobs.createdAt));
}

export async function getJobsByStatus(status: Job["status"]) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs).where(eq(jobs.status, status)).orderBy(desc(jobs.matchScore), desc(jobs.createdAt));
}

export async function getJobsBySource(source: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs).where(eq(jobs.source, source)).orderBy(desc(jobs.createdAt));
}

export async function updateJobDescription(id: number, description: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(jobs).set({ description }).where(eq(jobs.id, id));
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0];
}

export async function insertJob(job: InsertJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(jobs).values(job);
  return result;
}

export async function updateJobStatus(id: number, status: Job["status"], extra?: Partial<InsertJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updates: Partial<InsertJob> = { status, statusChangedAt: new Date(), ...extra };
  if (status === "applied") updates.appliedAt = new Date();
  // Clear blockedReason when moving out of blocked status
  if (status !== "blocked" && !("blockedReason" in (extra ?? {}))) updates.blockedReason = null;
  // Clear nextStepNote when moving out of nextsteps status
  if (status !== "nextsteps" && !("nextStepNote" in (extra ?? {}))) updates.nextStepNote = null;
  await db.update(jobs).set(updates).where(eq(jobs.id, id));
}

export async function updateJobMatchScore(
  id: number,
  matchScore: number,
  dimensions?: {
    scoreSkills?: number;
    scoreSeniority?: number;
    scoreLocation?: number;
    scoreIndustry?: number;
    scoreCompensation?: number;
    dealBreakerMatched?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(jobs).set({ matchScore, ...(dimensions ?? {}) }).where(eq(jobs.id, id));
}

export async function checkDuplicate(title: string, company: string, externalId?: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Primary check: externalId (the API's own job ID) — most reliable
  if (externalId) {
    const byId = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.externalId, externalId))
      .limit(1);
    if (byId.length > 0) return true;
  }
  // Fallback: title + company fuzzy match
  const result = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(like(jobs.title, `%${title}%`), like(jobs.company, `%${company}%`)))
    .limit(1);
  return result.length > 0;
}

// Active statuses shown on the Kanban board — excludes rejected/expired/ingested
const KANBAN_ACTIVE_STATUSES = ["matched", "to_apply", "blocked", "applied", "nextsteps"] as const;

export async function getKanbanJobs() {
  const db = await getDb();
  if (!db) return [];
  // Fix #2: filter to active statuses only (excludes 3,056 rejected rows)
  // Fix #3: select only columns needed by the Kanban UI (excludes description, descriptionHtml, rawJson blobs)
  return db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      location: jobs.location,
      applyUrl: jobs.applyUrl,
      source: jobs.source,
      status: jobs.status,
      matchScore: jobs.matchScore,
      scoreSkills: jobs.scoreSkills,
      scoreSeniority: jobs.scoreSeniority,
      scoreLocation: jobs.scoreLocation,
      scoreIndustry: jobs.scoreIndustry,
      scoreCompensation: jobs.scoreCompensation,
      dealBreakerMatched: jobs.dealBreakerMatched,
      isDuplicate: jobs.isDuplicate,
      hasEmail: jobs.hasEmail,
      emailFound: jobs.emailFound,
      tags: jobs.tags,
      ingestedAt: jobs.ingestedAt,
      appliedAt: jobs.appliedAt,
      statusChangedAt: jobs.statusChangedAt,
      autoRejected: jobs.autoRejected,
      blockedReason: jobs.blockedReason,
      nextStepNote: jobs.nextStepNote,
      manuallyAdded: jobs.manuallyAdded,
      addedBy: jobs.addedBy,
      resumeGeneratedPath: jobs.resumeGeneratedPath,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      // externalId kept for dedup checks on the frontend
      externalId: jobs.externalId,
    })
    .from(jobs)
    .where(inArray(jobs.status, [...KANBAN_ACTIVE_STATUSES]))
    .orderBy(desc(jobs.matchScore), desc(jobs.createdAt));
}

// Inferred type for Kanban board jobs (stripped of heavy blob columns)
export type KanbanJob = Awaited<ReturnType<typeof getKanbanJobs>>[number];

export async function getArchivedJobs(page = 1, pageSize = 50) {
  const db = await getDb();
  if (!db) return { jobs: [], total: 0 };
  const offset = (page - 1) * pageSize;
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: jobs.id,
        title: jobs.title,
        company: jobs.company,
        location: jobs.location,
        applyUrl: jobs.applyUrl,
        source: jobs.source,
        status: jobs.status,
        matchScore: jobs.matchScore,
        isDuplicate: jobs.isDuplicate,
        hasEmail: jobs.hasEmail,
        tags: jobs.tags,
        autoRejected: jobs.autoRejected,
        blockedReason: jobs.blockedReason,
        manuallyAdded: jobs.manuallyAdded,
        addedBy: jobs.addedBy,
        createdAt: jobs.createdAt,
        statusChangedAt: jobs.statusChangedAt,
      })
      .from(jobs)
      .where(inArray(jobs.status, ["rejected", "expired"]))
      .orderBy(desc(jobs.statusChangedAt), desc(jobs.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: count() })
      .from(jobs)
      .where(inArray(jobs.status, ["rejected", "expired"])),
  ]);
  return { jobs: rows, total: countResult[0]?.total ?? 0 };
}

export async function getArchivedJobsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ total: count() })
    .from(jobs)
    .where(inArray(jobs.status, ["rejected", "expired"]));
  return result[0]?.total ?? 0;
}

// ─── Skills Profile ─────────────────────────────────────────────────────

// 5-minute in-memory cache — avoids 100 DB reads per scoring batch
let _skillsProfileCache: { value: Awaited<ReturnType<typeof _fetchSkillsProfile>> | null; expiresAt: number } | null = null;
const SKILLS_CACHE_TTL_MS = 5 * 60 * 1000;

async function _fetchSkillsProfile() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(skillsProfile).limit(1);
  return result[0] ?? null;
}

export async function getSkillsProfile() {
  const now = Date.now();
  if (_skillsProfileCache && now < _skillsProfileCache.expiresAt) {
    return _skillsProfileCache.value;
  }
  const value = await _fetchSkillsProfile();
  _skillsProfileCache = { value, expiresAt: now + SKILLS_CACHE_TTL_MS };
  return value;
}

export function invalidateSkillsProfileCache() {
  _skillsProfileCache = null;
}

export type SkillsProfileInput = {
  content: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  dealbreakers?: string[];
  seniority?: string;
  salaryMin?: number;
  targetIndustries?: string[];
  remotePreference?: "remote" | "hybrid" | "onsite" | "any";
  weightSkills?: number;
  weightSeniority?: number;
  weightLocation?: number;
  weightIndustry?: number;
  weightCompensation?: number;
};

export async function upsertSkillsProfile(input: SkillsProfileInput | string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Accept legacy string or new structured input
  const data: SkillsProfileInput = typeof input === "string" ? { content: input } : input;
  const existing = await _fetchSkillsProfile(); // bypass cache for accurate upsert
  if (existing) {
    await db.update(skillsProfile).set(data).where(eq(skillsProfile.id, existing.id));
  } else {
    await db.insert(skillsProfile).values(data);
  }
  // Invalidate cache so next read reflects the new profile immediately
  invalidateSkillsProfileCache();
}

// ─── Question Bank ────────────────────────────────────────────────────────────

export async function getAllQuestions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questionBank).orderBy(desc(questionBank.createdAt));
}

export async function getUnansweredQuestions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questionBank).where(sql`${questionBank.answer} IS NULL`).orderBy(desc(questionBank.createdAt));
}

export async function insertQuestion(q: InsertQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(questionBank).values(q);
}

// ─── Pipeline Stats (for daily report) ──────────────────────────────────────

export async function getPipelineStats() {
  const db = await getDb();
  if (!db) return { matched: 0, toApply: 0, blocked: 0, applied: 0, totalApplied: 0 };

  const [matchedRows, toApplyRows, blockedRows, appliedRows] = await Promise.all([
    db.select({ c: count() }).from(jobs).where(eq(jobs.status, "matched")),
    db.select({ c: count() }).from(jobs).where(eq(jobs.status, "to_apply")),
    db.select({ c: count() }).from(jobs).where(eq(jobs.status, "blocked")),
    db.select({ c: count() }).from(jobs).where(eq(jobs.status, "applied")),
  ]);

  const appliedCount = appliedRows[0]?.c ?? 0;

  return {
    matched: matchedRows[0]?.c ?? 0,
    toApply: toApplyRows[0]?.c ?? 0,
    blocked: blockedRows[0]?.c ?? 0,
    applied: appliedCount,
    totalApplied: appliedCount,
  };
}

export async function getAppliedTodayCount(dateKey: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Query jobs table directly using statusChangedAt (a datetime column) so manually added
  // jobs, swipe-approved jobs, and "Mark as Applied" jobs all count equally.
  const result = await db
    .select({ c: count() })
    .from(jobs)
    .where(
      sql`${jobs.status} = 'applied' AND DATE(CONVERT_TZ(${jobs.statusChangedAt}, '+00:00', '+04:00')) = ${dateKey}`
    );
  return result[0]?.c ?? 0;
}

export async function getQuestionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(questionBank).where(eq(questionBank.id, id)).limit(1);
  return result[0] ?? null;
}

export async function answerQuestion(id: number, answer: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(questionBank).set({ answer, answeredAt: new Date() }).where(eq(questionBank.id, id));
}

// ─── API Usage ────────────────────────────────────────────────────────────────

export async function getOrCreateApiUsage(monthKey: string) {
  const db = await getDb();
  if (!db) return { id: 0, monthKey, callCount: 0, jobsLimit: null as number | null, jobsRemaining: null as number | null, requestsLimit: null as number | null, requestsRemaining: null as number | null, quotaResetSeconds: null as number | null, updatedAt: new Date() };
  const result = await db.select().from(apiUsage).where(eq(apiUsage.monthKey, monthKey)).limit(1);
  if (result[0]) return result[0];
  await db.insert(apiUsage).values({ monthKey, callCount: 0 });
  const created = await db.select().from(apiUsage).where(eq(apiUsage.monthKey, monthKey)).limit(1);
  return created[0]!;
}

export async function incrementApiUsage(monthKey: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(apiUsage).values({ monthKey, callCount: 1 })
    .onDuplicateKeyUpdate({ set: { callCount: sql`${apiUsage.callCount} + 1` } });
}

export async function updateApiQuota(
  monthKey: string,
  quota: { jobsLimit?: number; jobsRemaining?: number; requestsLimit?: number; requestsRemaining?: number; quotaResetSeconds?: number }
) {
  const db = await getDb();
  if (!db) return;
  // Strip undefined values — Drizzle throws "No values to set" if the set object is empty
  const defined = Object.fromEntries(
    Object.entries(quota).filter(([, v]) => v !== undefined)
  ) as Partial<typeof quota>;
  if (Object.keys(defined).length === 0) return; // nothing to update
  await db.insert(apiUsage)
    .values({ monthKey, callCount: 0, ...defined })
    .onDuplicateKeyUpdate({ set: defined });
}

// ─── Fetch Schedules ──────────────────────────────────────────────────────────

export async function getAllFetchSchedules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fetchSchedules).orderBy(desc(fetchSchedules.createdAt));
}

export async function getFetchScheduleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(fetchSchedules).where(eq(fetchSchedules.id, id)).limit(1);
  return result[0];
}

export async function insertFetchSchedule(schedule: InsertFetchSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fetchSchedules).values(schedule);
  return result;
}

export async function updateFetchSchedule(id: number, updates: Partial<InsertFetchSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(fetchSchedules).set(updates).where(eq(fetchSchedules.id, id));
}

export async function deleteFetchSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(fetchSchedules).where(eq(fetchSchedules.id, id));
}

export async function getDueFetchSchedules() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(fetchSchedules).where(
    and(eq(fetchSchedules.enabled, true), lte(fetchSchedules.nextRunAt, now))
  );
}

// ─── Fetch History ────────────────────────────────────────────────────────────

export async function insertFetchHistory(entry: InsertFetchHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(fetchHistory).values(entry);
}

export async function getAllFetchHistory() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fetchHistory).orderBy(desc(fetchHistory.ranAt)).limit(100);
}

export async function getFetchHistoryBySchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fetchHistory).where(eq(fetchHistory.scheduleId, scheduleId)).orderBy(desc(fetchHistory.ranAt)).limit(50);
}

// ─── Applier Stats ────────────────────────────────────────────────────────────

export async function getOrCreateApplierStats(dateKey: string, targetCount: number) {
  const db = await getDb();
  if (!db) return { id: 0, dateKey, appliedCount: 0, targetCount, updatedAt: new Date() };
  const result = await db.select().from(applierStats).where(eq(applierStats.dateKey, dateKey)).limit(1);
  if (result[0]) return result[0];
  await db.insert(applierStats).values({ dateKey, appliedCount: 0, targetCount });
  const created = await db.select().from(applierStats).where(eq(applierStats.dateKey, dateKey)).limit(1);
  return created[0]!;
}

export async function incrementApplierStats(dateKey: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(applierStats).set({ appliedCount: sql`${applierStats.appliedCount} + 1` }).where(eq(applierStats.dateKey, dateKey));
}

export async function getApplierStatsRange(days: number) {
  const db = await getDb();
  if (!db) return [];
  // Build last N date keys in GST (UTC+4) — server-generated, safe to inline
  const dateKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(new Date().getTime() + 4 * 60 * 60 * 1000 - i * 86400000);
    dateKeys.push(d.toISOString().slice(0, 10));
  }
  // Inline the date list (safe: server-generated YYYY-MM-DD strings)
  const inClause = dateKeys.map(k => `'${k}'`).join(', ');
  const rawQuery = `SELECT DATE(CONVERT_TZ(statusChangedAt, '+00:00', '+04:00')) AS dateKey, COUNT(*) AS appliedCount FROM jobs WHERE status = 'applied' AND DATE(CONVERT_TZ(statusChangedAt, '+00:00', '+04:00')) IN (${inClause}) GROUP BY dateKey`;
  const rows = await db.execute(sql.raw(rawQuery)) as unknown as { dateKey: string; appliedCount: number }[][];
  const resultRows = Array.isArray(rows[0]) ? rows[0] as { dateKey: string; appliedCount: number }[] : rows as unknown as { dateKey: string; appliedCount: number }[];
  // Normalize dateKey: TiDB may return a Date object or full datetime string — extract YYYY-MM-DD
  const normalizeKey = (k: string | Date) => {
    if (k instanceof Date) return k.toISOString().slice(0, 10);
    return String(k).slice(0, 10);
  };
  const rowMap = new Map(resultRows.map((r: { dateKey: string | Date; appliedCount: number }) => [normalizeKey(r.dateKey), Number(r.appliedCount)]));
  return dateKeys.map(dateKey => ({ dateKey, appliedCount: rowMap.get(dateKey) ?? 0, targetCount: 0, id: 0, updatedAt: new Date() }));
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export async function getOrCreateGamification(userId: number) {
  const db = await getDb();
  if (!db) return { id: 0, userId, totalXp: 0, currentStreak: 0, longestStreak: 0, lastActiveDate: null, updatedAt: new Date() };
  const result = await db.select().from(applierGamification).where(eq(applierGamification.userId, userId)).limit(1);
  if (result[0]) return result[0];
  await db.insert(applierGamification).values({ userId, totalXp: 0, currentStreak: 0, longestStreak: 0 });
  const created = await db.select().from(applierGamification).where(eq(applierGamification.userId, userId)).limit(1);
  return created[0]!;
}

// ─── Swipe Stats ─────────────────────────────────────────────────────────────

export async function recordSwipe(dateKey: string, direction: "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(swipeStats).where(eq(swipeStats.dateKey, dateKey)).limit(1);
  if (existing[0]) {
    if (direction === "approved") {
      await db.update(swipeStats).set({ approved: sql`${swipeStats.approved} + 1` }).where(eq(swipeStats.dateKey, dateKey));
    } else {
      await db.update(swipeStats).set({ rejected: sql`${swipeStats.rejected} + 1` }).where(eq(swipeStats.dateKey, dateKey));
    }
  } else {
    await db.insert(swipeStats).values({
      dateKey,
      approved: direction === "approved" ? 1 : 0,
      rejected: direction === "rejected" ? 1 : 0,
    });
  }
}

export async function reverseSwipe(dateKey: string, direction: "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(swipeStats).where(eq(swipeStats.dateKey, dateKey)).limit(1);
  if (!existing[0]) return; // nothing to reverse
  if (direction === "approved") {
    await db.update(swipeStats)
      .set({ approved: sql`GREATEST(0, ${swipeStats.approved} - 1)` })
      .where(eq(swipeStats.dateKey, dateKey));
  } else {
    await db.update(swipeStats)
      .set({ rejected: sql`GREATEST(0, ${swipeStats.rejected} - 1)` })
      .where(eq(swipeStats.dateKey, dateKey));
  }
}

export async function getSwipeStatsRange(days: number) {
  const db = await getDb();
  if (!db) return [];
  // Get last N days of swipe stats
  const dateKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateKeys.push(d.toISOString().split("T")[0]!);
  }
  return db.select().from(swipeStats).where(sql`${swipeStats.dateKey} IN (${sql.join(dateKeys.map(k => sql`${k}`), sql`, `)})`);
}

export async function getSwipeStatsForDate(dateKey: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(swipeStats).where(eq(swipeStats.dateKey, dateKey)).limit(1);
  return result[0] ?? null;
}

export async function updateGamification(userId: number, dateKey: string) {
  const db = await getDb();
  if (!db) return;
  const gami = await getOrCreateGamification(userId);
  const today = dateKey;
  const yesterday = new Date(new Date(dateKey).getTime() - 86400000).toISOString().split("T")[0];
  let newStreak = gami.currentStreak;
  if (gami.lastActiveDate === yesterday) {
    newStreak = gami.currentStreak + 1;
  } else if (gami.lastActiveDate !== today) {
    newStreak = 1;
  }
  const newLongest = Math.max(gami.longestStreak, newStreak);
  const xpGain = 10; // 10 XP per application
  await db.update(applierGamification).set({
    totalXp: sql`${applierGamification.totalXp} + ${xpGain}`,
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
  }).where(eq(applierGamification.userId, userId));
}

// ─── Auto-Reject ──────────────────────────────────────────────────────────────

/** Count how many matched jobs would be auto-rejected at the given threshold */
export async function countAutoRejectPreview(threshold: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(
      sql`${jobs.status} = 'matched' AND (${jobs.matchScore} IS NULL OR ${jobs.matchScore} < ${threshold})`
    );
  return result.length;
}

/** Bulk-reject all matched jobs below the threshold, marking them autoRejected=true */
export async function bulkAutoReject(threshold: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Count first for reliable return value
  const count = await countAutoRejectPreview(threshold);
  if (count === 0) return 0;
  const now = new Date();
  await db
    .update(jobs)
    .set({ status: "rejected", autoRejected: true, statusChangedAt: now })
    .where(
      sql`${jobs.status} = 'matched' AND (${jobs.matchScore} IS NULL OR ${jobs.matchScore} < ${threshold})`
    );
  return count;
}

// ─── Source Breakdown ───────────────────────────────────────────────────────
/** Returns count of applied jobs grouped by source category: linkedin, external, manual */
export async function getAppliedBySource(): Promise<{ linkedin: number; external: number; manual: number; total: number }> {
  const db = await getDb();
  if (!db) return { linkedin: 0, external: 0, manual: 0, total: 0 };
  const rows = await db
    .select({ source: jobs.source, manuallyAdded: jobs.manuallyAdded })
    .from(jobs)
    .where(eq(jobs.status, "applied"));
  let linkedin = 0, external = 0, manual = 0;
  for (const row of rows) {
    if (row.manuallyAdded) { manual++; continue; }
    if (row.source && row.source.toLowerCase().includes("linkedin")) { linkedin++; continue; }
    external++;
  }
  return { linkedin, external, manual, total: rows.length };
}

// ─── System Config (persistent key-value store) ──────────────────────────────

/** Get a system config value by key. Returns null if not found. */
export async function getSystemConfig(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ value: systemConfig.value })
    .from(systemConfig)
    .where(eq(systemConfig.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

/** Upsert a system config value by key. */
export async function setSystemConfig(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(systemConfig)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

// ─── Pending Scoring Count ──────────────────────────────────────────────────
/** Count jobs with matchScore=0 in 'matched' status (awaiting background LLM scoring). */
export async function getPendingScoringCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ c: count() })
    .from(jobs)
    .where(sql`${jobs.matchScore} = 0 AND ${jobs.status} = 'matched'`);
  return result[0]?.c ?? 0;
}

// ─── Resume Generation ──────────────────────────────────────────────────────

import { resumeGenerationLog, resumeConfig } from "../drizzle/schema";

/** Insert a new resume generation log entry and return its ID */
export async function insertResumeLog(entry: {
  jobId: number;
  jobTitle: string | null;
  jobCompany: string | null;
  requestedBy: string;
  requestedByUserId: number | null;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(resumeGenerationLog).values({
    jobId: entry.jobId,
    jobTitle: entry.jobTitle,
    jobCompany: entry.jobCompany,
    requestedBy: entry.requestedBy,
    requestedByUserId: entry.requestedByUserId,
    status: "pending",
  });
  return (result as any)[0]?.insertId ?? 0;
}

/** Update a resume generation log entry */
export async function updateResumeLog(
  logId: number,
  update: {
    status?: "pending" | "generating" | "completed" | "failed";
    filePath?: string | null;
    fileUrl?: string | null;
    errorMessage?: string | null;
    durationMs?: number | null;
    promptTokens?: number | null;
    completionTokens?: number | null;
    totalTokens?: number | null;
    creditCost?: number | null;
    completedAt?: Date | null;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const setObj: Record<string, unknown> = {};
  if (update.status !== undefined) setObj.status = update.status;
  if (update.filePath !== undefined) setObj.filePath = update.filePath;
  if (update.fileUrl !== undefined) setObj.fileUrl = update.fileUrl;
  if (update.errorMessage !== undefined) setObj.errorMessage = update.errorMessage;
  if (update.durationMs !== undefined) setObj.durationMs = update.durationMs;
  if (update.promptTokens !== undefined) setObj.promptTokens = update.promptTokens;
  if (update.completionTokens !== undefined) setObj.completionTokens = update.completionTokens;
  if (update.totalTokens !== undefined) setObj.totalTokens = update.totalTokens;
  if (update.creditCost !== undefined) setObj.creditCost = update.creditCost;
  if (update.completedAt !== undefined) setObj.completedAt = update.completedAt;
  if (Object.keys(setObj).length === 0) return;
  await db.update(resumeGenerationLog).set(setObj).where(eq(resumeGenerationLog.id, logId));
}

/** Get all resume generation log entries, newest first */
export async function getAllResumeLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resumeGenerationLog).orderBy(desc(resumeGenerationLog.requestedAt));
}

/** Logs for the given job IDs, newest first — ordering matches per-job slices of the global log list */
export async function getResumeLogsForJobIds(jobIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  const unique = [...new Set(jobIds)];
  if (unique.length === 0) return [];
  return db
    .select()
    .from(resumeGenerationLog)
    .where(inArray(resumeGenerationLog.jobId, unique))
    .orderBy(desc(resumeGenerationLog.requestedAt));
}

/** Job id + resume path for batch resume status (avoids loading full job rows) */
export async function getJobsResumeFieldsByIds(jobIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  const unique = [...new Set(jobIds)];
  if (unique.length === 0) return [];
  return db
    .select({ id: jobs.id, resumeGeneratedPath: jobs.resumeGeneratedPath })
    .from(jobs)
    .where(inArray(jobs.id, unique));
}

/** Get resume log entry by ID */
export async function getResumeLogById(logId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(resumeGenerationLog).where(eq(resumeGenerationLog.id, logId)).limit(1);
  return rows[0] ?? null;
}

/** Get a resume config value by key */
export async function getResumeConfig(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ configValue: resumeConfig.configValue }).from(resumeConfig).where(eq(resumeConfig.configKey, key)).limit(1);
  return rows[0]?.configValue ?? null;
}

/** Upsert a resume config value */
export async function upsertResumeConfig(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(resumeConfig).values({ configKey: key, configValue: value }).onDuplicateKeyUpdate({ set: { configValue: value } });
}

/** Get all resume config entries */
export async function getAllResumeConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resumeConfig);
}

/** Update job's resumeGeneratedPath */
export async function updateJobResumePath(jobId: number, path: string | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set({ resumeGeneratedPath: path }).where(eq(jobs.id, jobId));
}

/** Delete a resume generation log entry by ID */
export async function deleteResumeLog(logId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(resumeGenerationLog).where(eq(resumeGenerationLog.id, logId));
}


// ─── WellFound Jobs Scraper (Apify) ────────────────────────────────────────────

/**
 * Scrape jobs from WellFound (AngelList) using Apify API
 * Returns raw job data from the Apify scraper
 */
export async function scrapeWellFoundJobs(input: {
  jobTitle: string;
  jobLocation: string;
  keyword?: string;
  customJobTitle?: string;
  customJobLocation?: string;
  includeCompanyProfile?: boolean;
  includeCompanyPeople?: boolean;
  includeCompanyFunding?: boolean;
  includeJobPage?: boolean;
  fullyRemote?: boolean;
  maxResults?: number;
}) {
  const APIFY_TOKEN = process.env.APIFY;
  if (!APIFY_TOKEN) {
    throw new Error("APIFY token is not configured in environment variables");
  }

  const APIFY_ENDPOINT = "https://api.apify.com/v2/acts/radeance~wellfound-job-listings-scraper/run-sync-get-dataset-items";

  // Normalize to slug format (e.g., "Machine Learning Engineer" → "machine-learning-engineer")
  const toSlug = (s: string) => s.trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "");
  const jobTitleSlug = toSlug(input.customJobTitle || input.jobTitle);
  const jobLocationSlug = toSlug(input.customJobLocation || input.jobLocation);

  const payload: Record<string, unknown> = {
    job_title: jobTitleSlug,
    job_location: jobLocationSlug,
    include_company_profile: input.includeCompanyProfile !== false,
    include_company_people: input.includeCompanyPeople || false,
    include_company_funding: input.includeCompanyFunding || false,
    include_job_page: input.includeJobPage !== false,
    fully_remote: input.fullyRemote || false,
    us_date_format: true,
    // Required parameters for the scraper to actually fetch results
    last_x_days: 365,
    max_pages: 3,
    page_offset: 1,
    max_items: input.maxResults || 100,
    min_salary: 0,
    max_salary: 0,
    job_type: "all",
    job_experience: "all",
    sorting: "newest",
    only_unique_jobs: true,
    stream_output: true,
    include_no_experience: true,
    include_no_salary: true,
    monitoring_mode: false,
    only_company: false,
    reset_monitoring: false,
  };

  // Only include keyword if provided (undefined values cause issues)
  if (input.keyword) {
    payload.keyword = input.keyword;
  }

  try {
    console.log("[WellFound] Calling Apify scraper with payload:", JSON.stringify(payload, null, 2));

    const data = await apifyPostJson<
      Array<{
        job_id?: string;
        job_title?: string;
        job_url?: string;
        job_application_url?: string;
        job_description?: string;
        job_location?: string;
        job_compensation?: string;
        job_remote?: boolean | string;
        job_type?: string;
        job_min_salary?: number;
        job_max_salary?: number;
        job_salary_currency?: string;
        job_equity?: string;
        job_min_equity?: string;
        job_max_equity?: string;
        job_experience?: string;
        job_listing_posted?: string;
        job_published?: string;
        visa_sponsorship?: boolean | string;
        skills?: string[];
        direct_application?: boolean;
        company?: {
          name?: string;
          slug?: string;
          location?: string;
          size?: string;
          category?: string[];
          type?: string;
          profile_url?: string;
          url?: string;
          logo_url?: string;
          [key: string]: unknown;
        } | string;
        id?: string;
        title?: string;
        location?: string;
        description?: string;
        link?: string;
        applicationUrl?: string;
        salary?: string;
        remote?: boolean;
        [key: string]: unknown;
      }>
    >(`${APIFY_ENDPOINT}?token=${APIFY_TOKEN}`, payload, { timeoutMs: 600_000, maxRetries: 5 });

    console.log(`[WellFound] Scraper returned ${Array.isArray(data) ? data.length : 0} items`);

    // data is an array of job listings from Apify
    // Actual field names from the radeance~wellfound-job-listings-scraper:
    // job_title, job_id, job_url, job_application_url, job_description,
    // job_location, job_compensation, job_remote, job_type, company (object), skills, etc.
    return data as Array<{
      job_id?: string;
      job_title?: string;
      job_url?: string;
      job_application_url?: string;
      job_description?: string;
      job_location?: string;
      job_compensation?: string;
      job_remote?: boolean | string;
      job_type?: string;
      job_min_salary?: number;
      job_max_salary?: number;
      job_salary_currency?: string;
      job_equity?: string;
      job_min_equity?: string;
      job_max_equity?: string;
      job_experience?: string;
      job_listing_posted?: string;
      job_published?: string;
      visa_sponsorship?: boolean | string;
      skills?: string[];
      direct_application?: boolean;
      company?: {
        name?: string;
        slug?: string;
        location?: string;
        size?: string;
        category?: string[];
        type?: string;
        profile_url?: string;
        url?: string;
        logo_url?: string;
        [key: string]: unknown;
      } | string;
      // Legacy fields (in case older scraper versions return these)
      id?: string;
      title?: string;
      location?: string;
      description?: string;
      link?: string;
      applicationUrl?: string;
      salary?: string;
      remote?: boolean;
      [key: string]: unknown;
    }>;
  } catch (error) {
    console.error("[WellFound] Scraper error:", error);
    throw error;
  }
}

/**
 * Build a synthetic description from WellFound job fields when description is empty
 */
function buildWellFoundSyntheticDescription(
  job: Record<string, any>,
  companyName: string
): string {
  const parts: string[] = [];
  const title = job.job_title || job.title || "Unknown Position";
  parts.push(`Job Title: ${title}`);
  parts.push(`Company: ${companyName}`);
  const location = job.job_location || job.location;
  if (location) parts.push(`Location: ${location}`);
  if (job.job_remote || job.remote) parts.push(`Remote: ${job.job_remote || "Yes"}`);
  const compensation = job.job_compensation || job.salary;
  if (compensation) parts.push(`Compensation: ${compensation}`);
  const equity = job.job_equity || job.equity;
  if (equity) parts.push(`Equity: ${equity}`);
  if (job.job_type) parts.push(`Type: ${job.job_type}`);
  if (job.job_experience) parts.push(`Experience: ${job.job_experience}`);
  if (job.skills && Array.isArray(job.skills)) parts.push(`Skills: ${job.skills.join(", ")}`);
  if (job.visa_sponsorship) parts.push(`Visa Sponsorship: ${job.visa_sponsorship}`);
  const companyObj = typeof job.company === "object" ? job.company : null;
  if (companyObj?.category) parts.push(`Industry: ${Array.isArray(companyObj.category) ? companyObj.category.join(", ") : companyObj.category}`);
  if (companyObj?.size) parts.push(`Company Size: ${companyObj.size}`);
  return parts.join("\n");
}

/**
 * Transform WellFound job data to internal InsertJob format
 * Handles both new Apify field names (job_title, job_url, etc.) and legacy names (title, link, etc.)
 */
export function transformWellFoundJob(
  wellfoundJob: Awaited<ReturnType<typeof scrapeWellFoundJobs>>[number]
): InsertJob {
  // Handle company: can be a string or an object with a name property
  // New Apify format returns company as object: { name, slug, location, size, ... }
  let companyName = "Unknown Company";
  if (typeof wellfoundJob.company === "string") {
    companyName = wellfoundJob.company;
  } else if (wellfoundJob.company && typeof wellfoundJob.company === "object" && "name" in wellfoundJob.company) {
    companyName = (wellfoundJob.company as { name?: string }).name || "Unknown Company";
  }

  // Extract title: prefer job_title (new format), fallback to title (legacy)
  // If still empty, extract from job_url slug (e.g., ".../3826979-founding-saas-engineer" → "Founding Saas Engineer")
  let jobTitle = wellfoundJob.job_title || wellfoundJob.title || "";
  if (!jobTitle) {
    // Try extracting from job_url slug
    const jobUrl = wellfoundJob.job_url || wellfoundJob.link || "";
    const urlMatch = jobUrl.match(/\/jobs\/(\d+-[\w-]+)/);
    if (urlMatch) {
      const slug = urlMatch[1].replace(/^\d+-/, "");
      jobTitle = slug
        .split("-")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }
  if (!jobTitle && wellfoundJob.job_id) {
    // Last resort: use job_id if it contains a slug
    const idStr = String(wellfoundJob.job_id);
    if (idStr.includes("-")) {
      const slug = idStr.replace(/^\d+-/, "");
      jobTitle = slug
        .split("-")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }
  if (!jobTitle) jobTitle = "Unknown Position";

  // Extract application URL: prefer job_application_url (new), then job_url, then legacy fields
  let applyUrl = wellfoundJob.job_application_url || wellfoundJob.job_url || wellfoundJob.applicationUrl || wellfoundJob.link || "";
  if (!applyUrl && wellfoundJob.job_id) {
    applyUrl = `https://wellfound.com/jobs/${wellfoundJob.job_id}`;
  }

  // Extract location: prefer job_location (new), then company.location, then legacy location
  const companyObj = typeof wellfoundJob.company === "object" ? wellfoundJob.company : null;
  const jobLocation = wellfoundJob.job_location || wellfoundJob.location || (companyObj as any)?.location || "Remote";

  // Extract description: prefer job_description (new), then legacy description
  const description = wellfoundJob.job_description || wellfoundJob.description || "";

  // Extract external ID: prefer job_id (new), then legacy id
  const externalId = wellfoundJob.job_id ? String(wellfoundJob.job_id) : (wellfoundJob.id || `wellfound-${Date.now()}-${Math.random()}`);

  // Store essential fields in rawJson for debugging and re-processing
  const essentialData = {
    job_id: wellfoundJob.job_id,
    job_title: jobTitle,
    company: companyName,
    job_location: jobLocation,
    job_url: wellfoundJob.job_url,
    job_application_url: wellfoundJob.job_application_url,
    job_compensation: wellfoundJob.job_compensation || wellfoundJob.salary,
    job_remote: wellfoundJob.job_remote || wellfoundJob.remote,
    job_type: wellfoundJob.job_type,
    skills: wellfoundJob.skills,
    visa_sponsorship: wellfoundJob.visa_sponsorship,
    company_size: companyObj?.size,
    company_category: companyObj?.category,
  };

  return {
    title: jobTitle,
    company: companyName,
    location: jobLocation,
    applyUrl: applyUrl,
    description: description || buildWellFoundSyntheticDescription(wellfoundJob as any, companyName),
    source: "wellfound",
    externalId: externalId,
    status: "matched",
    ingestedAt: new Date(),
    rawJson: JSON.stringify(essentialData),
  };
}
