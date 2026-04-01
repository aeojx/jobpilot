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

export async function checkDuplicate(title: string, company: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
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

// ─── Skills Profile ───────────────────────────────────────────────────────────

export async function getSkillsProfile() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(skillsProfile).limit(1);
  return result[0] ?? null;
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
  const existing = await getSkillsProfile();
  if (existing) {
    await db.update(skillsProfile).set(data).where(eq(skillsProfile.id, existing.id));
  } else {
    await db.insert(skillsProfile).values(data);
  }
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
  if (!db) return { matched: 0, toApply: 0, applied: 0, totalApplied: 0 };

  const [matchedRows, toApplyRows, appliedRows] = await Promise.all([
    db.select({ c: count() }).from(jobs).where(eq(jobs.status, "matched")),
    db.select({ c: count() }).from(jobs).where(eq(jobs.status, "to_apply")),
    db.select({ c: count() }).from(jobs).where(eq(jobs.status, "applied")),
  ]);

  const appliedCount = appliedRows[0]?.c ?? 0;

  return {
    matched: matchedRows[0]?.c ?? 0,
    toApply: toApplyRows[0]?.c ?? 0,
    applied: appliedCount,
    totalApplied: appliedCount,
  };
}

export async function getAppliedTodayCount(dateKey: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(applierStats).where(eq(applierStats.dateKey, dateKey)).limit(1);
  return result[0]?.appliedCount ?? 0;
}

/**
 * Returns jobs that were moved to 'applied' status today (based on statusChangedAt).
 * dateKey format: "YYYY-MM-DD" in GST (UTC+4).
 */
export async function getJobsAppliedToday(dateKey: string): Promise<Array<{ title: string; company: string; location: string | null }>> {
  const db = await getDb();
  if (!db) return [];
  // Convert dateKey to UTC range: GST is UTC+4, so "today" in GST = UTC day minus 4 hours
  const startUtc = new Date(dateKey + "T00:00:00.000Z");
  startUtc.setTime(startUtc.getTime() - 4 * 60 * 60 * 1000); // subtract 4h to get UTC start of GST day
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ title: jobs.title, company: jobs.company, location: jobs.location })
    .from(jobs)
    .where(
      and(
        eq(jobs.status, "applied"),
        gte(jobs.statusChangedAt, startUtc),
        lte(jobs.statusChangedAt, endUtc)
      )
    )
    .orderBy(desc(jobs.statusChangedAt));
  return rows;
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
  if (!db) return { id: 0, monthKey, callCount: 0, updatedAt: new Date() };
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
  return db.select().from(applierStats).orderBy(desc(applierStats.dateKey)).limit(days);
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
