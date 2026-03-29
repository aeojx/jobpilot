import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  answerQuestion,
  checkDuplicate,
  deleteFetchSchedule,
  getAllFetchHistory,
  getAllFetchSchedules,
  getAllJobs,
  getAllQuestions,
  getApplierStatsRange,
  getFetchHistoryBySchedule,
  getFetchScheduleById,
  getJobById,
  getJobsByStatus,
  getKanbanJobs,
  getOrCreateApiUsage,
  getOrCreateApplierStats,
  getOrCreateGamification,
  getSkillsProfile,
  getUnansweredQuestions,
  incrementApiUsage,
  incrementApplierStats,
  insertFetchHistory,
  insertFetchSchedule,
  insertJob,
  insertQuestion,
  updateApiQuota,
  updateFetchSchedule,
  updateGamification,
  updateJobMatchScore,
  updateJobStatus,
  upsertSkillsProfile,
  getDueFetchSchedules,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentDateKey() {
  return new Date().toISOString().split("T")[0]!;
}

function extractEmailFromText(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function getRampUpTarget(startDateKey: string | null): number {
  if (!startDateKey) return 10;
  const start = new Date(startDateKey);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 5) return 10;
  if (diffDays < 12) return 20;
  if (diffDays < 19) return 40;
  return 80;
}

/** Compute next run timestamp for a schedule */
function computeNextRun(
  intervalType: "manual" | "daily" | "weekly",
  scheduleHour: number,
  scheduleMinute: number,
  scheduleDayOfWeek: number | null | undefined,
  fromNow = false
): Date | null {
  if (intervalType === "manual") return null;
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(scheduleHour, scheduleMinute, 0, 0);
  if (intervalType === "daily") {
    if (fromNow || next <= now) next.setDate(next.getDate() + 1);
    return next;
  }
  if (intervalType === "weekly") {
    const targetDay = scheduleDayOfWeek ?? 1;
    const diff = (targetDay - now.getDay() + 7) % 7;
    next.setDate(now.getDate() + (diff === 0 && !fromNow ? 7 : diff));
    return next;
  }
  return null;
}

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Owner access required" });
  return next({ ctx });
});

// ─── LLM Scoring ─────────────────────────────────────────────────────────────

async function scoreJobWithLLM(jobDescription: string, skillsContent: string): Promise<number> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a job-matching expert. Analyze the job description against the candidate's skills profile and return a JSON object with a single field "score" (integer 0-100) representing how well the candidate matches the job. Consider semantic similarity, not just keyword overlap. Be precise and realistic.`,
        },
        {
          role: "user",
          content: `SKILLS PROFILE:\n${skillsContent}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 3000)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "match_score",
          strict: true,
          schema: {
            type: "object",
            properties: { score: { type: "integer", description: "Match score 0-100" } },
            required: ["score"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      return Math.max(0, Math.min(100, parsed.score ?? 0));
    }
  } catch (e) {
    console.error("[LLM Scoring] Error:", e);
  }
  return 0;
}

// ─── Core Fetch Logic (shared by manual + scheduled runs) ─────────────────────

const FetchFiltersSchema = z.object({
  endpoint: z.enum(["active-ats-7d", "active-ats-24h"]).default("active-ats-7d"),
  titleFilter: z.string().optional(),
  advancedTitleFilter: z.string().optional(),
  locationFilter: z.string().optional(),
  descriptionFilter: z.string().optional(),
  advancedDescriptionFilter: z.string().optional(),
  organizationFilter: z.string().optional(),
  organizationExclusionFilter: z.string().optional(),
  advancedOrganizationFilter: z.string().optional(),
  source: z.string().optional(),
  sourceExclusion: z.string().optional(),
  aiWorkArrangementFilter: z.string().optional(),
  aiExperienceLevelFilter: z.string().optional(),
  aiEmploymentTypeFilter: z.string().optional(),
  aiTaxonomiesAFilter: z.string().optional(),
  aiTaxonomiesAPrimaryFilter: z.string().optional(),
  aiTaxonomiesAExclusionFilter: z.string().optional(),
  aiVisaSponsorshipFilter: z.boolean().optional(),
  aiHasSalary: z.boolean().optional(),
  remote: z.boolean().optional(),
  agency: z.boolean().optional(),
  includeLi: z.boolean().optional(),
  liOrganizationSlugFilter: z.string().optional(),
  liOrganizationSlugExclusionFilter: z.string().optional(),
  liIndustryFilter: z.string().optional(),
  liOrganizationEmployeesLte: z.string().optional(),
  liOrganizationEmployeesGte: z.string().optional(),
  dateFilter: z.string().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
  descriptionType: z.enum(["text", "html"]).optional(),
});

type FetchFilters = z.infer<typeof FetchFiltersSchema>;

async function executeFetch(
  input: FetchFilters,
  scheduleId?: number,
  scheduleName?: string
): Promise<{ jobsFetched: number; jobsIngested: number; jobsDuplicate: number; jobsRemaining?: number; requestsRemaining?: number }> {
  const resolvedKey = ENV.rapidApiKey;
  if (!resolvedKey) throw new Error("No RapidAPI key configured.");

  const params: Record<string, string> = {};
  params["description_type"] = input.descriptionType ?? "text";
  params["include_ai"] = "true";
  params["limit"] = String(input.limit ?? 100);
  if (input.offset !== undefined) params["offset"] = String(input.offset);
  if (input.advancedTitleFilter) params["advanced_title_filter"] = input.advancedTitleFilter;
  else if (input.titleFilter) params["title_filter"] = input.titleFilter;
  if (input.locationFilter) params["location_filter"] = input.locationFilter;
  if (input.advancedDescriptionFilter) params["advanced_description_filter"] = input.advancedDescriptionFilter;
  else if (input.descriptionFilter) params["description_filter"] = input.descriptionFilter;
  if (input.advancedOrganizationFilter) params["advanced_organization_filter"] = input.advancedOrganizationFilter;
  else if (input.organizationFilter) params["organization_filter"] = input.organizationFilter;
  if (input.organizationExclusionFilter) params["organization_exclusion_filter"] = input.organizationExclusionFilter;
  if (input.source) params["source"] = input.source;
  if (input.sourceExclusion) params["source_exclusion"] = input.sourceExclusion;
  if (input.aiWorkArrangementFilter) params["ai_work_arrangement_filter"] = input.aiWorkArrangementFilter;
  if (input.aiExperienceLevelFilter) params["ai_experience_level_filter"] = input.aiExperienceLevelFilter;
  if (input.aiEmploymentTypeFilter) params["ai_employment_type_filter"] = input.aiEmploymentTypeFilter;
  if (input.aiTaxonomiesAFilter) params["ai_taxonomies_a_filter"] = input.aiTaxonomiesAFilter;
  if (input.aiTaxonomiesAPrimaryFilter) params["ai_taxonomies_a_primary_filter"] = input.aiTaxonomiesAPrimaryFilter;
  if (input.aiTaxonomiesAExclusionFilter) params["ai_taxonomies_a_exclusion_filter"] = input.aiTaxonomiesAExclusionFilter;
  if (input.aiVisaSponsorshipFilter) params["ai_visa_sponsorship_filter"] = "true";
  if (input.aiHasSalary) params["ai_has_salary"] = "true";
  if (input.remote !== undefined) params["remote"] = String(input.remote);
  if (input.agency !== undefined) params["agency"] = String(input.agency);
  if (input.includeLi !== undefined) params["include_li"] = String(input.includeLi);
  if (input.liOrganizationSlugFilter) params["li_organization_slug_filter"] = input.liOrganizationSlugFilter;
  if (input.liOrganizationSlugExclusionFilter) params["li_organization_slug_exclusion_filter"] = input.liOrganizationSlugExclusionFilter;
  if (input.liIndustryFilter) params["li_industry_filter"] = input.liIndustryFilter;
  if (input.liOrganizationEmployeesLte) params["li_organization_employees_lte"] = input.liOrganizationEmployeesLte;
  if (input.liOrganizationEmployeesGte) params["li_organization_employees_gte"] = input.liOrganizationEmployeesGte;
  if (input.dateFilter) params["date_filter"] = input.dateFilter;

  const endpoint = input.endpoint ?? "active-ats-7d";
  const queryString = new URLSearchParams(params).toString();
  const url = `https://active-jobs-db.p.rapidapi.com/${endpoint}?${queryString}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-host": "active-jobs-db.p.rapidapi.com",
      "x-rapidapi-key": resolvedKey,
    },
  });

  // Extract quota headers
  const jobsRemaining = parseInt(response.headers.get("x-ratelimit-jobs-remaining") ?? "0") || undefined;
  const jobsLimit = parseInt(response.headers.get("x-ratelimit-jobs-limit") ?? "0") || undefined;
  const requestsRemaining = parseInt(response.headers.get("x-ratelimit-requests-remaining") ?? "0") || undefined;
  const requestsLimit = parseInt(response.headers.get("x-ratelimit-requests-limit") ?? "0") || undefined;
  const quotaResetSeconds = parseInt(response.headers.get("x-ratelimit-jobs-reset") ?? "0") || undefined;

  // Update quota in DB
  const monthKey = getCurrentMonthKey();
  await incrementApiUsage(monthKey);
  await updateApiQuota(monthKey, { jobsLimit, jobsRemaining, requestsLimit, requestsRemaining, quotaResetSeconds });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    await insertFetchHistory({
      scheduleId: scheduleId ?? null,
      scheduleName: scheduleName ?? null,
      endpoint,
      filters: input as Record<string, unknown>,
      jobsFetched: 0,
      jobsIngested: 0,
      jobsDuplicate: 0,
      jobsRemaining: jobsRemaining ?? null,
      requestsRemaining: requestsRemaining ?? null,
      status: "error",
      errorMessage: `API error ${response.status}: ${errText}`,
    });
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawJobs: unknown[] = Array.isArray(data) ? data : (data?.jobs ?? data?.data ?? []);

  let jobsIngested = 0;
  let jobsDuplicate = 0;

  const skills = await getSkillsProfile();

  for (const job of rawJobs as Record<string, unknown>[]) {
    const title = (job.title as string) ?? "Untitled";
    const company = (job.organization as string) ?? (job.company as string) ?? "Unknown";
    const isDuplicate = await checkDuplicate(title, company);
    if (isDuplicate) { jobsDuplicate++; }
    const descText = (job.description_text as string) ?? (job.description as string) ?? "";
    const emailFound = extractEmailFromText(descText) ?? (job.ai_hiring_manager_email_address as string) ?? null;
    const hasEmail = !!emailFound;
    let matchScore = 0;
    let status: "ingested" | "matched" = "ingested";
    if (skills && descText) {
      matchScore = await scoreJobWithLLM(descText, skills.content);
      if (matchScore > 0) status = "matched";
    }
    const locRaw = job.locations_derived as { city?: string; admin?: string; country?: string }[] | undefined;
    const locationStr = locRaw?.[0] ? [locRaw[0].city, locRaw[0].admin, locRaw[0].country].filter(Boolean).join(", ") : (job.location as string) ?? "";
    await insertJob({
      externalId: (job.id as string) ?? undefined,
      title,
      company,
      location: locationStr,
      description: descText,
      descriptionHtml: (job.description_html as string) ?? undefined,
      applyUrl: (job.url as string) ?? undefined,
      source: (job.source as string) ?? undefined,
      isDuplicate,
      hasEmail,
      emailFound: emailFound ?? undefined,
      matchScore,
      status,
      tags: (job.ai_taxonomies_a as string[]) ?? [],
      rawJson: job,
    });
    jobsIngested++;
  }

  await insertFetchHistory({
    scheduleId: scheduleId ?? null,
    scheduleName: scheduleName ?? null,
    endpoint,
    filters: input as Record<string, unknown>,
    jobsFetched: rawJobs.length,
    jobsIngested,
    jobsDuplicate,
    jobsRemaining: jobsRemaining ?? null,
    requestsRemaining: requestsRemaining ?? null,
    status: "success",
    errorMessage: null,
  });

  return { jobsFetched: rawJobs.length, jobsIngested, jobsDuplicate, jobsRemaining, requestsRemaining };
}

// ─── Scheduled Fetch Runner (called on server startup and periodically) ───────

let _cronInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduledFetchRunner() {
  if (_cronInterval) return;
  // Check every 5 minutes if any schedules are due
  _cronInterval = setInterval(async () => {
    try {
      const due = await getDueFetchSchedules();
      for (const schedule of due) {
        console.log(`[Scheduler] Running scheduled fetch: ${schedule.name}`);
        try {
          const filters = schedule.filters as FetchFilters;
          await executeFetch({ ...filters, endpoint: schedule.endpoint }, schedule.id, schedule.name);
          const nextRun = computeNextRun(
            schedule.intervalType,
            schedule.scheduleHour ?? 9,
            schedule.scheduleMinute ?? 0,
            schedule.scheduleDayOfWeek,
            true
          );
          await updateFetchSchedule(schedule.id, { lastRunAt: new Date(), nextRunAt: nextRun ?? undefined });
        } catch (e) {
          console.error(`[Scheduler] Error running schedule ${schedule.id}:`, e);
        }
      }
    } catch (e) {
      console.error("[Scheduler] Error checking due schedules:", e);
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Jobs ──────────────────────────────────────────────────────────────────

  jobs: router({
    kanban: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") return getJobsByStatus("to_apply");
      return getKanbanJobs();
    }),

    all: adminProcedure.query(async () => getAllJobs()),

    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => getJobById(input.id)),

    moveStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["ingested", "matched", "to_apply", "applied", "rejected"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && input.status !== "applied") throw new TRPCError({ code: "FORBIDDEN" });
        await updateJobStatus(input.id, input.status);
        return { success: true };
      }),

    markApplied: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await updateJobStatus(input.id, "applied");
        const dateKey = getCurrentDateKey();
        const target = getRampUpTarget(null);
        await getOrCreateApplierStats(dateKey, target);
        await incrementApplierStats(dateKey);
        await updateGamification(ctx.user.id, dateKey);
        const stats = await getOrCreateApplierStats(dateKey, target);
        if (stats.appliedCount >= target) {
          await notifyOwner({
            title: "🎯 Daily Target Met!",
            content: `The Applier has reached today's target of ${target} applications on ${dateKey}.`,
          });
        }
        return { success: true };
      }),

    ingest: adminProcedure
      .input(z.object({
        title: z.string(), company: z.string(), location: z.string().optional(),
        description: z.string().optional(), descriptionHtml: z.string().optional(),
        applyUrl: z.string().optional(), source: z.string().optional(),
        externalId: z.string().optional(), rawJson: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const isDuplicate = await checkDuplicate(input.title, input.company);
        const descText = input.description ?? "";
        const emailFound = extractEmailFromText(descText);
        const hasEmail = !!emailFound;
        const skills = await getSkillsProfile();
        let matchScore = 0;
        let status: "ingested" | "matched" = "ingested";
        if (skills && descText) {
          matchScore = await scoreJobWithLLM(descText, skills.content);
          if (matchScore > 0) status = "matched";
        }
        await insertJob({ ...input, isDuplicate, hasEmail, emailFound: emailFound ?? undefined, matchScore, status, tags: [] });
        return { success: true, isDuplicate, matchScore };
      }),
  }),

  // ─── API Ingestion (Active Jobs DB) ──────────────────────────────────────────

  ingestion: router({
    // Manual fetch (ad-hoc)
    fetchJobs: adminProcedure
      .input(FetchFiltersSchema)
      .mutation(async ({ input }) => {
        try {
          return await executeFetch(input);
        } catch (e: unknown) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message });
        }
      }),

    getUsage: adminProcedure.query(async () => {
      const monthKey = getCurrentMonthKey();
      return getOrCreateApiUsage(monthKey);
    }),

    // Fetch Schedules CRUD
    listSchedules: adminProcedure.query(async () => getAllFetchSchedules()),

    createSchedule: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        endpoint: z.enum(["active-ats-7d", "active-ats-24h"]).default("active-ats-7d"),
        filters: FetchFiltersSchema,
        intervalType: z.enum(["manual", "daily", "weekly"]).default("manual"),
        scheduleHour: z.number().min(0).max(23).default(9),
        scheduleMinute: z.number().min(0).max(59).default(0),
        scheduleDayOfWeek: z.number().min(0).max(6).optional(),
      }))
      .mutation(async ({ input }) => {
        const nextRun = computeNextRun(input.intervalType, input.scheduleHour, input.scheduleMinute, input.scheduleDayOfWeek);
        await insertFetchSchedule({
          name: input.name,
          endpoint: input.endpoint,
          filters: input.filters as Record<string, unknown>,
          intervalType: input.intervalType,
          scheduleHour: input.scheduleHour,
          scheduleMinute: input.scheduleMinute,
          scheduleDayOfWeek: input.scheduleDayOfWeek ?? null,
          enabled: true,
          nextRunAt: nextRun ?? undefined,
        });
        return { success: true };
      }),

    toggleSchedule: adminProcedure
      .input(z.object({ id: z.number(), enabled: z.boolean() }))
      .mutation(async ({ input }) => {
        await updateFetchSchedule(input.id, { enabled: input.enabled });
        return { success: true };
      }),

    deleteSchedule: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFetchSchedule(input.id);
        return { success: true };
      }),

    runScheduleNow: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const schedule = await getFetchScheduleById(input.id);
        if (!schedule) throw new TRPCError({ code: "NOT_FOUND", message: "Schedule not found" });
        try {
          const filters = schedule.filters as FetchFilters;
          const result = await executeFetch({ ...filters, endpoint: schedule.endpoint }, schedule.id, schedule.name);
          const nextRun = computeNextRun(schedule.intervalType, schedule.scheduleHour ?? 9, schedule.scheduleMinute ?? 0, schedule.scheduleDayOfWeek, true);
          await updateFetchSchedule(schedule.id, { lastRunAt: new Date(), nextRunAt: nextRun ?? undefined });
          return { success: true, ...result };
        } catch (e: unknown) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message });
        }
      }),

    // Fetch History
    listHistory: adminProcedure.query(async () => getAllFetchHistory()),

    historyBySchedule: adminProcedure
      .input(z.object({ scheduleId: z.number() }))
      .query(async ({ input }) => getFetchHistoryBySchedule(input.scheduleId)),
  }),

  // ─── Skills Profile ─────────────────────────────────────────────────────────

  skills: router({
    get: protectedProcedure.query(async () => getSkillsProfile()),

    upsert: adminProcedure
      .input(z.object({ content: z.string().min(1) }))
      .mutation(async ({ input }) => {
        await upsertSkillsProfile(input.content);
        return { success: true };
      }),

    rescoreAll: adminProcedure.mutation(async () => {
      const skills = await getSkillsProfile();
      if (!skills) throw new TRPCError({ code: "BAD_REQUEST", message: "No skills profile found" });
      const allJobs = await getAllJobs();
      let updated = 0;
      for (const job of allJobs) {
        if (job.description) {
          const score = await scoreJobWithLLM(job.description, skills.content);
          await updateJobMatchScore(job.id, score);
          if (score > 0 && job.status === "ingested") await updateJobStatus(job.id, "matched");
          updated++;
        }
      }
      return { success: true, updated };
    }),
  }),

  // ─── Question Bank ──────────────────────────────────────────────────────────

  questions: router({
    all: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") return getAllQuestions();
      return getAllQuestions();
    }),

    unanswered: adminProcedure.query(async () => getUnansweredQuestions()),

    ask: protectedProcedure
      .input(z.object({ jobId: z.number(), jobTitle: z.string().optional(), jobCompany: z.string().optional(), question: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        await insertQuestion({
          jobId: input.jobId,
          jobTitle: input.jobTitle,
          jobCompany: input.jobCompany,
          question: input.question,
          askedByName: ctx.user.name ?? "Applier",
        });
        await notifyOwner({
          title: "❓ New Question from Applier",
          content: `Job: ${input.jobTitle ?? "Unknown"} at ${input.jobCompany ?? "Unknown"}\n\nQuestion: ${input.question}`,
        });
        return { success: true };
      }),

    answer: adminProcedure
      .input(z.object({ id: z.number(), answer: z.string().min(1) }))
      .mutation(async ({ input }) => {
        await answerQuestion(input.id, input.answer);
        return { success: true };
      }),
  }),

  // ─── Performance Stats ──────────────────────────────────────────────────────

  stats: router({
    today: protectedProcedure.query(async () => {
      const dateKey = getCurrentDateKey();
      const target = getRampUpTarget(null);
      return getOrCreateApplierStats(dateKey, target);
    }),

    recent: protectedProcedure.query(async () => getApplierStatsRange(30)),

    gamification: protectedProcedure.query(async ({ ctx }) => getOrCreateGamification(ctx.user.id)),

    getRampTarget: protectedProcedure
      .input(z.object({ startDate: z.string().optional() }))
      .query(({ input }) => ({ target: getRampUpTarget(input.startDate ?? null) })),
  }),
});

export type AppRouter = typeof appRouter;
