import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  answerQuestion,
  checkDuplicate,
  getAllJobs,
  getAllQuestions,
  getJobsByStatus,
  getApplierStatsRange,
  getJobById,
  getKanbanJobs,
  getOrCreateApiUsage,
  getOrCreateApplierStats,
  getOrCreateGamification,
  getSkillsProfile,
  getUnansweredQuestions,
  incrementApiUsage,
  incrementApplierStats,
  insertJob,
  insertQuestion,
  updateGamification,
  updateJobMatchScore,
  updateJobStatus,
  upsertSkillsProfile,
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
      // Applier only sees jobs in 'to_apply' status
      if (ctx.user.role !== 'admin') {
        return getJobsByStatus('to_apply');
      }
      return getKanbanJobs();
    }),

    all: adminProcedure.query(async () => {
      return getAllJobs();
    }),

    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getJobById(input.id);
    }),

    moveStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["ingested", "matched", "to_apply", "applied", "rejected"]) }))
      .mutation(async ({ input, ctx }) => {
        // Applier can only move to "applied"
        if (ctx.user.role !== "admin" && input.status !== "applied") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateJobStatus(input.id, input.status);
        return { success: true };
      }),

    markApplied: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await updateJobStatus(input.id, "applied");
        // Update applier stats
        const dateKey = getCurrentDateKey();
        const target = getRampUpTarget(null); // simplified; could track start date
        await getOrCreateApplierStats(dateKey, target);
        await incrementApplierStats(dateKey);
        // Update gamification
        await updateGamification(ctx.user.id, dateKey);
        // Check if target met
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
      .input(
        z.object({
          title: z.string(),
          company: z.string(),
          location: z.string().optional(),
          description: z.string().optional(),
          descriptionHtml: z.string().optional(),
          applyUrl: z.string().optional(),
          source: z.string().optional(),
          externalId: z.string().optional(),
          rawJson: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Deduplication check
        const isDuplicate = await checkDuplicate(input.title, input.company);
        // Email extraction
        const descText = input.description ?? "";
        const emailFound = extractEmailFromText(descText);
        const hasEmail = !!emailFound;
        // Skills-based scoring
        const skills = await getSkillsProfile();
        let matchScore = 0;
        let status: "ingested" | "matched" = "ingested";
        if (skills && descText) {
          matchScore = await scoreJobWithLLM(descText, skills.content);
          if (matchScore > 0) status = "matched";
        }
        await insertJob({
          ...input,
          isDuplicate,
          hasEmail,
          emailFound: emailFound ?? undefined,
          matchScore,
          status,
          tags: [],
        });
        return { success: true, isDuplicate, matchScore };
      }),

    batchIngest: adminProcedure
      .input(z.object({ jobs: z.array(z.any()) }))
      .mutation(async ({ input }) => {
        const results = [];
        for (const job of input.jobs) {
          const isDuplicate = await checkDuplicate(job.title ?? "", job.company_name ?? "");
          const descText = job.description ?? job.description_text ?? "";
          const emailFound = extractEmailFromText(descText);
          const hasEmail = !!emailFound;
          const skills = await getSkillsProfile();
          let matchScore = 0;
          let status: "ingested" | "matched" = "ingested";
          if (skills && descText) {
            matchScore = await scoreJobWithLLM(descText, skills.content);
            if (matchScore > 0) status = "matched";
          }
          await insertJob({
            externalId: job.id ?? job.job_id,
            title: job.title ?? "Untitled",
            company: job.company_name ?? job.company ?? "Unknown",
            location: job.location ?? job.location_text,
            description: descText,
            descriptionHtml: job.description_html ?? job.description,
            applyUrl: job.apply_url ?? job.url,
            source: job.source ?? job.ats_source,
            isDuplicate,
            hasEmail,
            emailFound: emailFound ?? undefined,
            matchScore,
            status,
            tags: [],
            rawJson: job,
          });
          results.push({ title: job.title, isDuplicate, matchScore });
        }
        return { success: true, count: results.length, results };
      }),
  }),

  // ─── API Ingestion (Fantastic Jobs) ────────────────────────────────────────

  ingestion: router({
    fetchJobs: adminProcedure
      .input(
        z.object({
          jobTitle: z.string().optional(),
          location: z.string().optional(),
          industry: z.string().optional(),
          workArrangement: z.string().optional(),
          experienceLevel: z.string().optional(),
          atsSource: z.string().optional(),
          excludeAgency: z.boolean().optional(),
          visaSponsorship: z.boolean().optional(),
          excludeLinkedIn: z.boolean().optional(),
          apiKey: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const monthKey = getCurrentMonthKey();
        await incrementApiUsage(monthKey);
        const resolvedKey = input.apiKey || ENV.rapidApiKey;
        if (!resolvedKey) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No RapidAPI key configured. Please set RAPIDAPI_KEY in secrets." });
        }
        const params: Record<string, string> = {
          limit: "100",
          include_ai: "true",
        };
        if (input.jobTitle) params["advanced_title_filter"] = input.jobTitle;
        if (input.location) params["location_filter"] = input.location;
        if (input.industry) params["ai_taxonomies_a_filter"] = input.industry;
        if (input.workArrangement) params["ai_work_arrangement_filter"] = input.workArrangement;
        if (input.experienceLevel) params["ai_experience_level_filter"] = input.experienceLevel;
        if (input.atsSource) params["source"] = input.atsSource;
        if (input.excludeAgency) params["agency"] = "false";
        if (input.visaSponsorship) params["ai_visa_sponsorship_filter"] = "true";
        if (input.excludeLinkedIn) params["exclude_source"] = "linkedin";
        params["description_type"] = "text";
        const queryString = new URLSearchParams(params).toString();
        const url = `https://fantastic-jobs.p.rapidapi.com/jobs?${queryString}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "x-rapidapi-host": "fantastic-jobs.p.rapidapi.com",
            "x-rapidapi-key": resolvedKey,
          },
        });
        if (!response.ok) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `API error: ${response.status} ${response.statusText}` });
        }
        const data = await response.json();
        return data;
      }),

    getUsage: adminProcedure.query(async () => {
      const monthKey = getCurrentMonthKey();
      return getOrCreateApiUsage(monthKey);
    }),
  }),

  // ─── Skills Profile ─────────────────────────────────────────────────────────

  skills: router({
    get: protectedProcedure.query(async () => {
      return getSkillsProfile();
    }),

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
          if (score > 0 && job.status === "ingested") {
            await updateJobStatus(job.id, "matched");
          }
          updated++;
        }
      }
      return { success: true, updated };
    }),
  }),

  // ─── Question Bank ──────────────────────────────────────────────────────────

  questions: router({
    all: protectedProcedure.query(async ({ ctx }) => {
      // Owner sees all questions; Applier sees only their own
      if (ctx.user.role === 'admin') return getAllQuestions();
      return getAllQuestions(); // Applier sees all for now (filtered by UI)
    }),

    unanswered: adminProcedure.query(async () => {
      return getUnansweredQuestions();
    }),

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

    recent: protectedProcedure.query(async () => {
      return getApplierStatsRange(30);
    }),

    gamification: protectedProcedure.query(async ({ ctx }) => {
      return getOrCreateGamification(ctx.user.id);
    }),

    getRampTarget: protectedProcedure
      .input(z.object({ startDate: z.string().optional() }))
      .query(({ input }) => {
        return { target: getRampUpTarget(input.startDate ?? null) };
      }),
  }),
});

export type AppRouter = typeof appRouter;
