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
  // Dimension scores (0-100 each)
  scoreSkills: float("scoreSkills"),
  scoreSeniority: float("scoreSeniority"),
  scoreLocation: float("scoreLocation"),
  scoreIndustry: float("scoreIndustry"),
  scoreCompensation: float("scoreCompensation"),
  // Pre-filter flag
  dealBreakerMatched: varchar("dealBreakerMatched", { length: 512 }),
  status: mysqlEnum("status", [
    "ingested",
    "matched",
    "to_apply",
    "blocked",
    "applied",
    "nextsteps",
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
  statusChangedAt: timestamp("statusChangedAt"),
  autoRejected: boolean("autoRejected").default(false).notNull(),
  blockedReason: varchar("blockedReason", { length: 512 }),
  nextStepNote: varchar("nextStepNote", { length: 512 }),
  manuallyAdded: boolean("manuallyAdded").default(false).notNull(),
  addedBy: varchar("addedBy", { length: 255 }),
  resumeGeneratedPath: varchar("resumeGeneratedPath", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),

  // ─── AutoApply Fields ────────────────────────────────────────────────────
  applyStatus: mysqlEnum("applyStatus", [
    "queued",
    "in_progress",
    "applied",
    "failed",
    "manual",
    "expired",
  ]),
  applyError: text("applyError"),
  applyAttempts: int("applyAttempts").default(0).notNull(),
  applyDurationMs: int("applyDurationMs"),
  agentId: varchar("agentId", { length: 128 }),
  lastAttemptedAt: timestamp("lastAttemptedAt"),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// ─── Skills Profile ───────────────────────────────────────────────────────────

export const skillsProfile = mysqlTable("skills_profile", {
  id: int("id").autoincrement().primaryKey(),
  // Legacy free-text field (kept for backward compat)
  content: text("content").notNull(),
  // Structured fields
  mustHaveSkills: json("mustHaveSkills").$type<string[]>(),
  niceToHaveSkills: json("niceToHaveSkills").$type<string[]>(),
  dealbreakers: json("dealbreakers").$type<string[]>(),
  seniority: varchar("seniority", { length: 64 }),        // e.g. "Senior", "Lead", "Staff"
  salaryMin: int("salaryMin"),                              // annual USD
  targetIndustries: json("targetIndustries").$type<string[]>(),
  remotePreference: mysqlEnum("remotePreference", ["remote", "hybrid", "onsite", "any"]).default("any"),
  // Dimension weights (must sum to 100)
  weightSkills: int("weightSkills").default(40),
  weightSeniority: int("weightSeniority").default(20),
  weightLocation: int("weightLocation").default(20),
  weightIndustry: int("weightIndustry").default(10),
  weightCompensation: int("weightCompensation").default(10),
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
  monthKey: varchar("monthKey", { length: 16 }).notNull().unique(), // "YYYY-MM" or "li-YYYY-MM"
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
  endpoint: mysqlEnum("endpoint", ["active-ats-7d", "active-ats-24h", "active-jb-7d", "active-jb-24h"]).default("active-ats-7d").notNull(),
  filters: json("filters").notNull(), // full filter object
  // Schedule: interval type and time-of-day
  intervalType: mysqlEnum("intervalType", ["manual", "daily", "weekly"]).default("manual").notNull(),
  scheduleHour: int("scheduleHour").default(9), // 0-23 UTC
  scheduleMinute: int("scheduleMinute").default(0), // 0-59
  scheduleDayOfWeek: int("scheduleDayOfWeek"), // 0=Sun, 1=Mon... null for daily
  weekdaysOnly: boolean("weekdaysOnly").default(false).notNull(),
  queryRotation: json("queryRotation"), // array of filter objects to rotate through
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
  errorDetail: text("errorDetail"), // JSON: { httpStatus, contentType, rawSnippet, url, errorType }
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

// ─── Swipe Stats ─────────────────────────────────────────────────────────────

export const swipeStats = mysqlTable("swipe_stats", {
  id: int("id").autoincrement().primaryKey(),
  dateKey: varchar("dateKey", { length: 10 }).notNull().unique(), // "YYYY-MM-DD"
  approved: int("approved").default(0).notNull(),
  rejected: int("rejected").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SwipeStats = typeof swipeStats.$inferSelect;

// Key-value store for system configuration (e.g., last report sent dates)
export const systemConfig = mysqlTable("system_config", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;

// ─── Resume Generation Log ──────────────────────────────────────────────────

export const resumeGenerationLog = mysqlTable("resume_generation_log", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  jobTitle: varchar("jobTitle", { length: 512 }),
  jobCompany: varchar("jobCompany", { length: 512 }),
  requestedBy: varchar("requestedBy", { length: 255 }).notNull(),
  requestedByUserId: int("requestedByUserId"),
  status: mysqlEnum("status", ["pending", "generating", "completed", "failed"]).default("pending").notNull(),
  filePath: varchar("filePath", { length: 512 }),
  fileUrl: text("fileUrl"),
  errorMessage: text("errorMessage"),
  durationMs: int("durationMs"),
  promptTokens: int("promptTokens"),
  completionTokens: int("completionTokens"),
  totalTokens: int("totalTokens"),
  creditCost: float("creditCost"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ResumeGenerationLogEntry = typeof resumeGenerationLog.$inferSelect;

// ─── Resume Config (Document Vault) ─────────────────────────────────────────

export const resumeConfig = mysqlTable("resume_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 64 }).notNull().unique(),
  configValue: text("configValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResumeConfig = typeof resumeConfig.$inferSelect;

// ─── Applicant Profile (AutoApply) ──────────────────────────────────────────

export type ApplicantPersonal = {
  fullName: string;
  preferredName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
};

export type ApplicantWorkAuth = {
  legallyAuthorized: string;
  requireSponsorship: string;
  workPermitType: string;
};

export type ApplicantCompensation = {
  salaryExpectation: string;
  salaryCurrency: string;
  salaryRangeMin: string;
  salaryRangeMax: string;
};

export type ApplicantExperience = {
  yearsTotal: string;
  educationLevel: string;
  currentTitle: string;
  targetRole: string;
};

export type ApplicantEEO = {
  gender: string;
  raceEthnicity: string;
  veteranStatus: string;
  disabilityStatus: string;
};

export type ApplicantAvailability = {
  earliestStart: string;
  fullTime: string;
  contract: string;
};

export type ApplicantSkillsBoundary = {
  languages: string[];
  frameworks: string[];
  devops: string[];
  databases: string[];
  tools: string[];
};

export const applicantProfile = mysqlTable("applicant_profile", {
  id: int("id").autoincrement().primaryKey(),
  personal: json("personal").$type<ApplicantPersonal>(),
  workAuth: json("workAuth").$type<ApplicantWorkAuth>(),
  compensation: json("compensation").$type<ApplicantCompensation>(),
  experience: json("experience").$type<ApplicantExperience>(),
  eeo: json("eeo").$type<ApplicantEEO>(),
  availability: json("availability").$type<ApplicantAvailability>(),
  skillsBoundary: json("skillsBoundary").$type<ApplicantSkillsBoundary>(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApplicantProfile = typeof applicantProfile.$inferSelect;
export type InsertApplicantProfile = typeof applicantProfile.$inferInsert;

// ─── AutoApply Log ──────────────────────────────────────────────────────────

export const autoApplyLog = mysqlTable("auto_apply_log", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  jobTitle: varchar("jobTitle", { length: 512 }),
  jobCompany: varchar("jobCompany", { length: 512 }),
  status: mysqlEnum("status", ["applied", "failed", "expired", "manual", "captcha", "login_issue"]).notNull(),
  errorMessage: text("errorMessage"),
  durationMs: int("durationMs"),
  agentId: varchar("agentId", { length: 128 }),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
});

export type AutoApplyLogEntry = typeof autoApplyLog.$inferSelect;
export type InsertAutoApplyLog = typeof autoApplyLog.$inferInsert;
