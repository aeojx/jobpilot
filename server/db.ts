import { and, count, desc, eq, gte, like, or, sql, lte } from "drizzle-orm";
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

export async function getKanbanJobs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs).orderBy(desc(jobs.matchScore), desc(jobs.createdAt));
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
