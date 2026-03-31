import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
  date,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 255 }),
  title: varchar("title", { length: 512 }).notNull(),
  company: varchar("company", { length: 512 }).notNull(),
  location: text("location"),
  description: text("description"),
  descriptionHtml: text("descriptionHtml"),
  applyUrl: text("applyUrl"),
  source: varchar("source", { length: 128 }), // ATS system
  matchScore: float("matchScore").default(0),
  status: mysqlEnum("status", [
    "ingested",
    "matched",
    "to_apply",
    "applied",
    "rejected",
    "expired",
  ])
    .default("ingested")
    .notNull(),
  isDuplicate: boolean("isDuplicate").default(false).notNull(),
  hasEmail: boolean("hasEmail").default(false).notNull(),
  emailFound: varchar("emailFound", { length: 320 }),
  tags: json("tags").$type<string[]>(),
  rawJson: json("rawJson"),
  ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// ─── Skills Profile ───────────────────────────────────────────────────────────

export const skillsProfile = mysqlTable("skills_profile", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SkillsProfile = typeof skillsProfile.$inferSelect;

// ─── Question Bank ────────────────────────────────────────────────────────────

export const questionBank = mysqlTable("question_bank", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  jobTitle: varchar("jobTitle", { length: 512 }),
  jobCompany: varchar("jobCompany", { length: 512 }),
  question: text("question").notNull(),
  answer: text("answer"),
  askedByName: varchar("askedByName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  answeredAt: timestamp("answeredAt"),
});

export type QuestionBankEntry = typeof questionBank.$inferSelect;
export type InsertQuestion = typeof questionBank.$inferInsert;

// ─── API Usage ────────────────────────────────────────────────────────────────

export const apiUsage = mysqlTable("api_usage", {
  id: int("id").autoincrement().primaryKey(),
  monthKey: varchar("monthKey", { length: 7 }).notNull().unique(), // "YYYY-MM"
  callCount: int("callCount").default(0).notNull(),
  // Quota fields from API response headers
  jobsLimit: int("jobsLimit"),
  jobsRemaining: int("jobsRemaining"),
  requestsLimit: int("requestsLimit"),
  requestsRemaining: int("requestsRemaining"),
  quotaResetSeconds: int("quotaResetSeconds"), // x-ratelimit-jobs-reset
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiUsage = typeof apiUsage.$inferSelect;

// ─── Fetch Schedules ──────────────────────────────────────────────────────────

export const fetchSchedules = mysqlTable("fetch_schedules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  endpoint: mysqlEnum("endpoint", ["active-ats-7d", "active-ats-24h"]).default("active-ats-7d").notNull(),
  filters: json("filters").notNull(), // full filter object
  // Schedule: interval type and time-of-day
  intervalType: mysqlEnum("intervalType", ["manual", "daily", "weekly"]).default("manual").notNull(),
  scheduleHour: int("scheduleHour").default(9), // 0-23 UTC
  scheduleMinute: int("scheduleMinute").default(0), // 0-59
  scheduleDayOfWeek: int("scheduleDayOfWeek"), // 0=Sun, 1=Mon... null for daily
  enabled: boolean("enabled").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FetchSchedule = typeof fetchSchedules.$inferSelect;
export type InsertFetchSchedule = typeof fetchSchedules.$inferInsert;

// ─── Fetch History ────────────────────────────────────────────────────────────

export const fetchHistory = mysqlTable("fetch_history", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId"), // null = ad-hoc manual run
  scheduleName: varchar("scheduleName", { length: 255 }),
  endpoint: varchar("endpoint", { length: 64 }).notNull(),
  filters: json("filters"), // snapshot of filters used
  jobsFetched: int("jobsFetched").default(0).notNull(),
  jobsIngested: int("jobsIngested").default(0).notNull(),
  jobsDuplicate: int("jobsDuplicate").default(0).notNull(),
  jobsRemaining: int("jobsRemaining"), // from API header
  requestsRemaining: int("requestsRemaining"), // from API header
  status: mysqlEnum("status", ["success", "error", "partial"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  durationMs: int("durationMs"), // how long the fetch took in milliseconds
  ranAt: timestamp("ranAt").defaultNow().notNull(),
});

export type FetchHistoryEntry = typeof fetchHistory.$inferSelect;
export type InsertFetchHistory = typeof fetchHistory.$inferInsert;

// ─── Applier Stats ────────────────────────────────────────────────────────────

export const applierStats = mysqlTable("applier_stats", {
  id: int("id").autoincrement().primaryKey(),
  dateKey: varchar("dateKey", { length: 10 }).notNull().unique(), // "YYYY-MM-DD"
  appliedCount: int("appliedCount").default(0).notNull(),
  targetCount: int("targetCount").default(10).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApplierStats = typeof applierStats.$inferSelect;

// ─── Applier Gamification ─────────────────────────────────────────────────────

export const applierGamification = mysqlTable("applier_gamification", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalXp: int("totalXp").default(0).notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }), // "YYYY-MM-DD"
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApplierGamification = typeof applierGamification.$inferSelect;
