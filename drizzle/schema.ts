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
  ])
    .default("ingested")
    .notNull(),
  isDuplicate: boolean("isDuplicate").default(false).notNull(),
  hasEmail: boolean("hasEmail").default(false).notNull(),
  emailFound: varchar("emailFound", { length: 320 }),
  tags: json("tags").$type<string[]>().default([]),
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiUsage = typeof apiUsage.$inferSelect;

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
