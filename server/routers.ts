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
  recordSwipe,
  reverseSwipe,
  getSwipeStatsRange,
  countAutoRejectPreview,
  bulkAutoReject,
  getQuestionById,
  getPipelineStats,
  getAppliedTodayCount,
  getAppliedBySource,
  getSystemConfig,
  setSystemConfig,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { sendEmail, buildQuestionAnsweredEmail, buildDailyReportEmail, APPLIER_EMAIL } from "./_core/email";
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

export type DimensionScores = {
  composite: number;
  scoreSkills: number;
  scoreSeniority: number;
  scoreLocation: number;
  scoreIndustry: number;
  scoreCompensation: number;
  dealBreakerMatched: string | null;
};

import type { SkillsProfile } from "../drizzle/schema";

/**
 * Check if a job description contains any dealbreaker keywords.
 * Returns the matched keyword string, or null if clean.
 */
function checkDealbreakers(text: string, dealbreakers: string[]): string | null {
  if (!dealbreakers || dealbreakers.length === 0) return null;
  const lower = text.toLowerCase();
  for (const kw of dealbreakers) {
    if (kw.trim() && lower.includes(kw.trim().toLowerCase())) {
      return kw.trim();
    }
  }
  return null;
}

/**
 * Score a job against the candidate's structured skills profile.
 * Returns 5 dimension scores plus a weighted composite.
 * Uses the FULL description (no character cap).
 * Passes title + company as explicit fields.
 */
/**
 * Normalise verbose location strings from API responses.
 * "Dubai, Dubai, United Arab Emirates" → "Dubai, UAE"
 * "Abu Dhabi, Abu Dhabi Emirate, United Arab Emirates" → "Abu Dhabi, UAE"
 * "New York, New York, United States" → "New York, US"
 */
export function normalizeLocation(raw: string): string {
  if (!raw) return raw;
  const countryAliases: Record<string, string> = {
    "United Arab Emirates": "UAE",
    "United States": "US",
    "United Kingdom": "UK",
    "United States of America": "US",
  };
  const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length === 1) return parts[0];
  const city = parts[0];
  const country = parts[parts.length - 1];
  const countryShort = countryAliases[country] ?? country;
  if (city.toLowerCase() === countryShort.toLowerCase()) return countryShort;
  return `${city}, ${countryShort}`;
}

export async function scoreJobWithLLM(
  jobDescription: string,
  skillsProfile: SkillsProfile,
  jobTitle?: string,
  jobCompany?: string,
  jobLocation?: string
): Promise<DimensionScores> {
  const empty: DimensionScores = {
    composite: 0, scoreSkills: 0, scoreSeniority: 0,
    scoreLocation: 0, scoreIndustry: 0, scoreCompensation: 0,
    dealBreakerMatched: null,
  };

  // ── Step 1: Negative keyword pre-filter ──────────────────────────────────────
  // JSON fields from TiDB may arrive as strings in some contexts — parse defensively
  function parseJsonArray(val: unknown): string[] {
    if (Array.isArray(val)) return val as string[];
    if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
    return [];
  }
  const dealbreakers = parseJsonArray(skillsProfile.dealbreakers);
  const fullText = `${jobTitle ?? ""} ${jobCompany ?? ""} ${jobDescription}`;
  const matched = checkDealbreakers(fullText, dealbreakers);
  if (matched) {
    console.log(`[LLM Scoring] Dealbreaker matched: "${matched}" — skipping LLM call`);
    return { ...empty, dealBreakerMatched: matched };
  }

  // ── Step 2: Build structured profile context ─────────────────────────────────
  const weights = {
    skills: skillsProfile.weightSkills ?? 40,
    seniority: skillsProfile.weightSeniority ?? 20,
    location: skillsProfile.weightLocation ?? 20,
    industry: skillsProfile.weightIndustry ?? 10,
    compensation: skillsProfile.weightCompensation ?? 10,
  };

  const profileContext = [
    skillsProfile.content ? `BACKGROUND:\n${skillsProfile.content}` : "",
    parseJsonArray(skillsProfile.mustHaveSkills).length ? `MUST-HAVE SKILLS: ${parseJsonArray(skillsProfile.mustHaveSkills).join(", ")}` : "",
    parseJsonArray(skillsProfile.niceToHaveSkills).length ? `NICE-TO-HAVE SKILLS: ${parseJsonArray(skillsProfile.niceToHaveSkills).join(", ")}` : "",
    skillsProfile.seniority ? `TARGET SENIORITY: ${skillsProfile.seniority}` : "",
    skillsProfile.salaryMin ? `MINIMUM SALARY: $${skillsProfile.salaryMin.toLocaleString()} USD/year` : "",
    parseJsonArray(skillsProfile.targetIndustries).length ? `TARGET INDUSTRIES: ${parseJsonArray(skillsProfile.targetIndustries).join(", ")}` : "",
    skillsProfile.remotePreference && skillsProfile.remotePreference !== "any"
      ? `REMOTE PREFERENCE: ${skillsProfile.remotePreference}` : "",
  ].filter(Boolean).join("\n");

  // ── Step 3: LLM multi-dimension scoring ──────────────────────────────────────
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a precise job-matching expert. Score the job against the candidate profile across 5 dimensions. Return integers 0-100 for each. Be realistic and discriminating — most jobs should score 30-70, not 90+.`,
        },
        {
          role: "user",
          content: [
            "=== CANDIDATE PROFILE ===",
            profileContext,
            "",
            "=== JOB TO SCORE ===",
            jobTitle ? `TITLE: ${jobTitle}` : "",
            jobCompany ? `COMPANY: ${jobCompany}` : "",
            jobLocation ? `LOCATION: ${normalizeLocation(jobLocation)}` : "LOCATION: Remote (no location specified — treat as remote-friendly)",
            `DESCRIPTION:\n${jobDescription}`,
            "",
            "=== SCORING DIMENSIONS ===",
            `scoreSkills (weight ${weights.skills}%): How well do the candidate's skills match the required and preferred skills in this job?`,
            `scoreSeniority (weight ${weights.seniority}%): Does the seniority level of this role match the candidate's target level?`,
            `scoreLocation (weight ${weights.location}%): Does the job's location/remote policy match the candidate's preference?`,
            `scoreIndustry (weight ${weights.industry}%): Does the company's industry match the candidate's target industries?`,
            `scoreCompensation (weight ${weights.compensation}%): Does the likely compensation match the candidate's minimum salary requirement?`,
          ].filter(Boolean).join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dimension_scores",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scoreSkills: { type: "integer", description: "Skills match 0-100" },
              scoreSeniority: { type: "integer", description: "Seniority fit 0-100" },
              scoreLocation: { type: "integer", description: "Location/remote fit 0-100" },
              scoreIndustry: { type: "integer", description: "Industry fit 0-100" },
              scoreCompensation: { type: "integer", description: "Compensation fit 0-100" },
            },
            required: ["scoreSkills", "scoreSeniority", "scoreLocation", "scoreIndustry", "scoreCompensation"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (content) {
      const d = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      const clamp = (v: unknown) => Math.max(0, Math.min(100, Number(v) || 0));
      const s = clamp(d.scoreSkills);
      const sn = clamp(d.scoreSeniority);
      const l = clamp(d.scoreLocation);
      const i = clamp(d.scoreIndustry);
      const c = clamp(d.scoreCompensation);
      const composite = Math.round(
        (s * weights.skills + sn * weights.seniority + l * weights.location + i * weights.industry + c * weights.compensation) / 100
      );
      return {
        composite,
        scoreSkills: s,
        scoreSeniority: sn,
        scoreLocation: l,
        scoreIndustry: i,
        scoreCompensation: c,
        dealBreakerMatched: null,
      };
    }
  } catch (e) {
    console.error("[LLM Scoring] Error:", e);
  }
  return empty;
}

// ─── Core Fetch Logic (shared by manual + scheduled runs) ─────────────────────

// LinkedIn endpoints use a different API host
const LINKEDIN_ENDPOINTS = ["active-jb-7d", "active-jb-24h"] as const;
const FANTASTIC_ENDPOINTS = ["active-ats-7d", "active-ats-24h"] as const;
const ALL_ENDPOINTS = [...FANTASTIC_ENDPOINTS, ...LINKEDIN_ENDPOINTS] as const;

const FetchFiltersSchema = z.object({
  endpoint: z.enum(ALL_ENDPOINTS).default("active-ats-7d"),
  // LinkedIn-specific filters (only used when endpoint is active-jb-*)
  linkedinSeniority: z.string().optional(),
  linkedinDirectApply: z.boolean().optional(),
  linkedinOrgSlugFilter: z.string().optional(),
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
  const fetchStartTime = Date.now();

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
  const isLinkedIn = (LINKEDIN_ENDPOINTS as readonly string[]).includes(endpoint);

  // LinkedIn API uses different host and has different param names
  if (isLinkedIn) {
    // LinkedIn-specific params override
    if (input.linkedinSeniority) params["seniority"] = input.linkedinSeniority;
    if (input.linkedinDirectApply !== undefined) params["directapply"] = String(input.linkedinDirectApply);
    if (input.linkedinOrgSlugFilter) params["organization_slug_filter"] = input.linkedinOrgSlugFilter;
    // LinkedIn API doesn't use include_ai
    delete params["include_ai"];
  }

  const apiHost = isLinkedIn ? "linkedin-job-search-api.p.rapidapi.com" : "active-jobs-db.p.rapidapi.com";
  const queryString = new URLSearchParams(params).toString();
  const url = `https://${apiHost}/${endpoint}?${queryString}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-host": apiHost,
      "x-rapidapi-key": resolvedKey,
    },
  });

  // Extract quota headers
  const jobsRemaining = parseInt(response.headers.get("x-ratelimit-jobs-remaining") ?? "0") || undefined;
  const jobsLimit = parseInt(response.headers.get("x-ratelimit-jobs-limit") ?? "0") || undefined;
  const requestsRemaining = parseInt(response.headers.get("x-ratelimit-requests-remaining") ?? "0") || undefined;
  const requestsLimit = parseInt(response.headers.get("x-ratelimit-requests-limit") ?? "0") || undefined;
  const quotaResetSeconds = parseInt(response.headers.get("x-ratelimit-jobs-reset") ?? "0") || undefined;

  // Update quota in DB — use separate month keys for each API source
  const isLinkedInEndpoint = (LINKEDIN_ENDPOINTS as readonly string[]).includes(input.endpoint ?? "");
  const monthKey = isLinkedInEndpoint ? `li-${getCurrentMonthKey()}` : getCurrentMonthKey();
  await incrementApiUsage(monthKey);
  await updateApiQuota(monthKey, { jobsLimit, jobsRemaining, requestsLimit, requestsRemaining, quotaResetSeconds });

  const contentType = response.headers.get("content-type") ?? "";
  const rawBodyText = await response.text().catch(() => "");

  if (!response.ok) {
    // Detect HTML error pages (e.g. proxy/gateway errors)
    const isHtml = contentType.includes("text/html") || rawBodyText.trimStart().startsWith("<");
    const errorType = isHtml ? "html_response" : response.status === 403 ? "not_subscribed" : response.status === 429 ? "quota_exceeded" : response.status === 401 ? "invalid_api_key" : "api_error";
    const rawSnippet = rawBodyText.slice(0, 500);
    const friendlyMessage = isHtml
      ? `API returned an HTML page instead of JSON (HTTP ${response.status}) — likely a network/proxy issue or incorrect endpoint`
      : response.status === 403
      ? `Not subscribed to this API. Visit rapidapi.com to subscribe to the Active Jobs DB API.`
      : response.status === 429
      ? `Monthly quota exceeded. Check your RapidAPI plan limits.`
      : response.status === 401
      ? `Invalid API key. Check your RAPIDAPI_KEY secret.`
      : `API error ${response.status}: ${rawBodyText.slice(0, 200)}`;

    const errorDetail = JSON.stringify({
      httpStatus: response.status,
      contentType,
      errorType,
      rawSnippet,
      url,
      timestamp: new Date().toISOString(),
    });

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
      durationMs: Date.now() - fetchStartTime,
      status: "error",
      errorMessage: friendlyMessage,
      errorDetail,
    });
    throw new Error(friendlyMessage);
  }

  // Guard against non-JSON success responses (e.g. HTML from a proxy)
  let data: unknown;
  try {
    data = JSON.parse(rawBodyText);
  } catch {
    const isHtml = contentType.includes("text/html") || rawBodyText.trimStart().startsWith("<");
    const friendlyMessage = isHtml
      ? `API returned an HTML page instead of JSON — likely a network/proxy issue. Check the endpoint URL.`
      : `API returned non-JSON content (content-type: ${contentType}). Raw: ${rawBodyText.slice(0, 200)}`;
    const errorDetail = JSON.stringify({
      httpStatus: response.status,
      contentType,
      errorType: isHtml ? "html_response" : "non_json_response",
      rawSnippet: rawBodyText.slice(0, 500),
      url,
      timestamp: new Date().toISOString(),
    });
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
      durationMs: Date.now() - fetchStartTime,
      status: "error",
      errorMessage: friendlyMessage,
      errorDetail,
    });
    throw new Error(friendlyMessage);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataAny = data as any;
  const rawJobs: unknown[] = Array.isArray(data) ? data : (dataAny?.jobs ?? dataAny?.data ?? []);

  let jobsIngested = 0;
  let jobsDuplicate = 0;

  // ── Phase 1: Insert all jobs immediately (no LLM scoring yet) ────────────────
  // This keeps the HTTP response fast and avoids 504 gateway timeouts when
  // fetching large batches (100 jobs × ~3s LLM call = 300s > 5min timeout).
  const insertedJobIds: number[] = [];

  for (const job of rawJobs as Record<string, unknown>[]) {
    try {
      const title = (job.title as string) ?? "Untitled";
      const company = (job.organization as string) ?? (job.company as string) ?? "Unknown";
      const externalId = (job.id as string) ?? undefined;
      const isDuplicate = await checkDuplicate(title, company, externalId);
      if (isDuplicate) {
        jobsDuplicate++;
        continue; // Skip inserting — duplicate jobs are not stored
      }
      const descText = (job.description_text as string) ?? (job.description as string) ?? "";
      const emailFound = extractEmailFromText(descText) ?? (job.ai_hiring_manager_email_address as string) ?? null;
      const hasEmail = !!emailFound;
      // locations_derived is an array of strings like ["Abu Dhabi, Abu Dhabi, United Arab Emirates"]
      const locRaw = job.locations_derived as string[] | undefined;
      const locationStr = locRaw?.[0] ?? (job.location as string) ?? "";
      // Ensure tags is null (not []) when empty — TiDB JSON columns accept null
      const tagsRaw = (job.ai_taxonomies_a as string[]) ?? null;
      const tags = Array.isArray(tagsRaw) && tagsRaw.length > 0 ? tagsRaw : null;
      if (!locationStr) {
        console.log("[fetchJobs] Warning: No location extracted for job", job.id, "locations_derived:", locRaw, "location:", job.location);
      }
      // Insert with matchScore=0; background scorer will update it shortly
      const inserted = await insertJob({
        externalId,
        title,
        company,
        location: locationStr,
        description: descText,
        descriptionHtml: (job.description_html as string) ?? undefined,
        applyUrl: (job.url as string) ?? undefined,
        source: isLinkedIn ? "linkedin" : ((job.source as string) ?? undefined),
        isDuplicate: false,
        hasEmail,
        emailFound: emailFound ?? undefined,
        matchScore: 0,
        status: "matched",
        tags,
        rawJson: job,
      });
      // MySqlRawQueryResult = [ResultSetHeader, FieldPacket[]]
      const newId = (inserted as unknown as [{ insertId: number }])[0]?.insertId;
      if (newId) insertedJobIds.push(newId);
      jobsIngested++;
    } catch (jobErr) {
      console.error("[fetchJobs] Failed to insert job:", (jobErr as Error).message, job);
    }
  }

  // ── Phase 2: Score inserted jobs asynchronously in the background ─────────────
  // Fire-and-forget: does not block the HTTP response.
  if (insertedJobIds.length > 0) _pendingScoringCount += insertedJobIds.length;
  setImmediate(async () => {
    try {
      const skills = await getSkillsProfile();
      if (!skills || insertedJobIds.length === 0) { _pendingScoringCount = Math.max(0, _pendingScoringCount - insertedJobIds.length); return; }
      console.log(`[fetchJobs] Background scoring ${insertedJobIds.length} jobs...`);
      for (const jobId of insertedJobIds) {
        try {
          const jobRow = await getJobById(jobId);
          if (!jobRow || !jobRow.description) continue;
          const result = await scoreJobWithLLM(jobRow.description, skills, jobRow.title, jobRow.company, jobRow.location ?? undefined);
          if (result.dealBreakerMatched) {
            // Dealbreaker hit — reject the job immediately instead of leaving it in Matched with score=0
            await updateJobStatus(jobId, "rejected");
            await updateJobMatchScore(jobId, 0, { dealBreakerMatched: result.dealBreakerMatched });
            console.log(`[fetchJobs] Auto-rejected job ${jobId} (dealbreaker: "${result.dealBreakerMatched}")`);
          } else if (result.scoreSeniority < 50) {
            // Seniority post-filter — jobs scoring below 50 on seniority have <5% approval rate
            await updateJobStatus(jobId, "rejected");
            await updateJobMatchScore(jobId, result.composite, {
              scoreSkills: result.scoreSkills,
              scoreSeniority: result.scoreSeniority,
              scoreLocation: result.scoreLocation,
              scoreIndustry: result.scoreIndustry,
              scoreCompensation: result.scoreCompensation,
              dealBreakerMatched: null,
            });
            console.log(`[fetchJobs] Auto-rejected job ${jobId} (low seniority: ${result.scoreSeniority})`);
          } else {
            await updateJobMatchScore(jobId, result.composite, {
              scoreSkills: result.scoreSkills,
              scoreSeniority: result.scoreSeniority,
              scoreLocation: result.scoreLocation,
              scoreIndustry: result.scoreIndustry,
              scoreCompensation: result.scoreCompensation,
              dealBreakerMatched: null,
            });
          }
        } catch (scoreErr) {
          console.error(`[fetchJobs] Background scoring failed for job ${jobId}:`, (scoreErr as Error).message);
        } finally {
          _pendingScoringCount = Math.max(0, _pendingScoringCount - 1);
        }
      }
      console.log(`[fetchJobs] Background scoring complete for ${insertedJobIds.length} jobs.`);
    } catch (bgErr) {
      console.error("[fetchJobs] Background scoring loop error:", (bgErr as Error).message);
      _pendingScoringCount = 0; // Reset on catastrophic failure
    }
  });

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
    durationMs: Date.now() - fetchStartTime,
    status: "success",
    errorMessage: null,
  });

  return { jobsFetched: rawJobs.length, jobsIngested, jobsDuplicate, jobsRemaining, requestsRemaining };
}

// ─── In-memory ingestion/scoring status (used by TopProgressBar) ─────────────

let _isIngesting = false;
let _pendingScoringCount = 0;

export function getIngestionStatus() {
  return { isIngesting: _isIngesting, pendingScoring: _pendingScoringCount };
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
          await executeFetch({ ...filters, endpoint: schedule.endpoint as FetchFilters["endpoint"] }, schedule.id, schedule.name);
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

// ─── Daily Report Emailer (7 PM GST = 15:00 UTC) ────────────────────────────

let _dailyReportInterval: ReturnType<typeof setInterval> | null = null;
let _weeklyReportInterval: ReturnType<typeof setInterval> | null = null;

// DB keys for persisting last-sent dates across server restarts
const DB_KEY_DAILY_REPORT = "last_daily_report_date";
const DB_KEY_WEEKLY_REPORT = "last_weekly_report_date";

/**
 * Returns the current date key in GST (UTC+4) as "YYYY-MM-DD".
 */
function getGstDateKey(): string {
  const now = new Date();
  // GST is UTC+4
  const gst = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  return gst.toISOString().slice(0, 10);
}

/**
 * Returns the current hour in GST (0-23).
 */
function getGstHour(): number {
  const now = new Date();
  const gst = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  return gst.getUTCHours();
}

/**
 * Formats a date key "YYYY-MM-DD" as a human-readable string like "Wed, Apr 1, 2026".
 */
function formatDateKey(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export async function sendDailyReport(): Promise<void> {
  try {
    const dateKey = getGstDateKey();
    const pipeline = await getPipelineStats();
    const appliedToday = await getAppliedTodayCount(dateKey);
    const weeklyStats = await getApplierStatsRange(7);

    // Build last-7-days array (newest first → reverse for display oldest→newest)
    const weeklyData = weeklyStats
      .slice()
      .reverse()
      .map((s) => ({ date: formatDateKey(s.dateKey), applied: s.appliedCount }));

    const weeklyApplied = weeklyStats.reduce((sum, s) => sum + s.appliedCount, 0);

    const html = buildDailyReportEmail({
      date: formatDateKey(dateKey),
      matchedCount: pipeline.matched,
      toApplyCount: pipeline.toApply,
      blockedCount: pipeline.blocked,
      appliedCount: pipeline.applied,
      appliedToday,
      weeklyApplied,
      weeklyData,
      totalApplied: pipeline.totalApplied,
      targetTotal: 1000,
    });

    const remaining = Math.max(0, 1000 - pipeline.totalApplied);
    const subject = `1000Jobs Daily Report — ✅ ${appliedToday} applied today | ⏳ ${pipeline.toApply} ready to apply | 🎯 ${remaining} remaining`;
    const recipients = [APPLIER_EMAIL, "tedunt@gmail.com"];

    await sendEmail({ to: recipients, subject, html });
    console.log(`[DailyReport] Sent to ${recipients.join(", ")} for ${dateKey}`);
  } catch (err) {
    console.error("[DailyReport] Failed to send:", err);
  }
}

export function startDailyReportScheduler() {
  if (_dailyReportInterval) return;

  const checkAndSendDaily = async () => {
    const hour = getGstHour();
    const dateKey = getGstDateKey();
    // Fire at 7 PM GST (hour 19). Catch up if server woke between 19-21 and hasn't sent today.
    if (hour >= 19 && hour <= 21) {
      // Read last-sent date from DB to survive server restarts
      const lastSent = await getSystemConfig(DB_KEY_DAILY_REPORT);
      if (lastSent !== dateKey) {
        // Persist BEFORE sending to prevent duplicate sends from concurrent wakeups
        await setSystemConfig(DB_KEY_DAILY_REPORT, dateKey);
        console.log(`[DailyReport] Triggering at GST hour ${hour} for ${dateKey}`);
        await sendDailyReport();
      }
    }
  };

  // Run immediately on startup to catch missed sends after hibernation
  checkAndSendDaily();
  _dailyReportInterval = setInterval(checkAndSendDaily, 15 * 60 * 1000);
  console.log("[DailyReport] Scheduler started (checks every 15 min, sends at 7 PM GST)");
}

export async function sendWeeklyReport(): Promise<void> {
  try {
    const dateKey = getGstDateKey();
    const pipeline = await getPipelineStats();
    const appliedToday = await getAppliedTodayCount(dateKey);
    const weeklyStats = await getApplierStatsRange(7);
    const weeklyData = weeklyStats
      .slice()
      .reverse()
      .map((s) => ({ date: formatDateKey(s.dateKey), applied: s.appliedCount }));
    const weeklyApplied = weeklyStats.reduce((sum, s) => sum + s.appliedCount, 0);
    const remaining = Math.max(0, 1000 - pipeline.totalApplied);
    const html = buildDailyReportEmail({
      date: formatDateKey(dateKey),
      matchedCount: pipeline.matched,
      toApplyCount: pipeline.toApply,
      blockedCount: pipeline.blocked,
      appliedCount: pipeline.applied,
      appliedToday,
      weeklyApplied,
      weeklyData,
      totalApplied: pipeline.totalApplied,
      targetTotal: 1000,
    });
    const subject = `1000Jobs Weekly Report — ✅ ${weeklyApplied} applied this week | 🎯 ${remaining} remaining`;
    const recipients = [APPLIER_EMAIL, "tedunt@gmail.com"];
    await sendEmail({ to: recipients, subject, html });
    console.log(`[WeeklyReport] Sent to ${recipients.join(", ")} for week of ${dateKey}`);
  } catch (err) {
    console.error("[WeeklyReport] Failed to send:", err);
  }
}

export function startWeeklyReportScheduler() {
  if (_weeklyReportInterval) return;

  const checkAndSendWeekly = async () => {
    const now = new Date();
    const gst = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const dayOfWeek = gst.getUTCDay(); // 0=Sun, 5=Fri
    const hour = gst.getUTCHours();
    const dateKey = getGstDateKey();
    // Fire on Fridays at 9 PM GST. Catch up if server woke between 21-23 on a Friday.
    if (dayOfWeek === 5 && hour >= 21 && hour <= 23) {
      // Read last-sent date from DB to survive server restarts
      const lastSent = await getSystemConfig(DB_KEY_WEEKLY_REPORT);
      if (lastSent !== dateKey) {
        // Persist BEFORE sending to prevent duplicate sends from concurrent wakeups
        await setSystemConfig(DB_KEY_WEEKLY_REPORT, dateKey);
        console.log(`[WeeklyReport] Triggering Friday report at GST hour ${hour} for ${dateKey}`);
        await sendWeeklyReport();
      }
    }
  };

  checkAndSendWeekly();
  _weeklyReportInterval = setInterval(checkAndSendWeekly, 15 * 60 * 1000);
  console.log("[WeeklyReport] Scheduler started (checks every 15 min, sends Fridays at 9 PM GST)");
}

// ─── Router ───────────────────────────────────────────────────────────────────

// ─── Gate Cookie Name ────────────────────────────────────────────────────────
const GATE_COOKIE = "jp_gate";
const GATE_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days in milliseconds (Express uses ms)

export const appRouter = router({
  system: systemRouter,

  // ─── Password Gate ────────────────────────────────────────────────────────
  gate: router({
    check: publicProcedure.query(({ ctx }) => {
      if (!ENV.sitePassword) return { unlocked: true }; // no password set = open
      // Parse cookie from raw header (no cookie-parser middleware)
      const cookieHeader = ctx.req.headers.cookie ?? "";
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${GATE_COOKIE}=([^;]*)`))
      const token = match ? decodeURIComponent(match[1]!) : null;
      return { unlocked: token === ENV.sitePassword };
    }),
    unlock: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input, ctx }) => {
        if (!ENV.sitePassword || input.password !== ENV.sitePassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password" });
        }
        const isSecure = ENV.isProduction || ctx.req.protocol === "https";
        ctx.res.cookie(GATE_COOKIE, ENV.sitePassword, {
          httpOnly: true,
          secure: isSecure,
          sameSite: isSecure ? "none" : "lax",
          maxAge: GATE_COOKIE_MAX_AGE,
          path: "/",
        });
        return { success: true };
      }),
    lock: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(GATE_COOKIE, { path: "/" });
      return { success: true };
    }),
  }),

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
      if (ctx.user.role !== "admin") {
        // Appliers see the full kanban but only to_apply and blocked columns
        return getKanbanJobs();
      }
      return getKanbanJobs();
    }),

    all: adminProcedure.query(async () => getAllJobs()),

    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => getJobById(input.id)),

    byStatus: adminProcedure
      .input(z.object({ status: z.enum(["ingested", "matched", "to_apply", "blocked", "applied", "rejected", "expired"]) }))
      .query(async ({ input }) => getJobsByStatus(input.status)),

    moveStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["ingested", "matched", "to_apply", "blocked", "applied", "rejected", "expired"]),
        fromSwipe: z.boolean().optional(),
        blockedReason: z.string().max(512).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Appliers can move jobs between to_apply, blocked, applied, and expired
        const applierAllowed: string[] = ["to_apply", "blocked", "applied", "expired"];
        if (ctx.user.role !== "admin" && !applierAllowed.includes(input.status)) throw new TRPCError({ code: "FORBIDDEN" });
        // Save blockedReason when blocking, clear it otherwise
        const extra = input.status === "blocked" && input.blockedReason
          ? { blockedReason: input.blockedReason }
          : undefined;
        await updateJobStatus(input.id, input.status, extra);
        // Track swipe stats when swiping from the swipe view
        if (input.fromSwipe) {
          const dateKey = getCurrentDateKey();
          if (input.status === "to_apply") await recordSwipe(dateKey, "approved");
          else if (input.status === "rejected") await recordSwipe(dateKey, "rejected");
        }
        return { success: true };
      }),

    undoSwipe: adminProcedure
      .input(z.object({ id: z.number(), previousStatus: z.enum(["to_apply", "rejected"]) }))
      .mutation(async ({ input }) => {
        // Restore job to 'matched'
        await updateJobStatus(input.id, "matched");
        // Decrement swipe stat for today
        const dateKey = getCurrentDateKey();
        const direction = input.previousStatus === "to_apply" ? "approved" : "rejected";
        await reverseSwipe(dateKey, direction);
        return { success: true };
      }),

    swipeStats: adminProcedure
      .input(z.object({ days: z.number().min(1).max(30).default(7) }))
      .query(async ({ input }) => {
        const rows = await getSwipeStatsRange(input.days);
        const today = getCurrentDateKey();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        const weekStartKey = weekStart.toISOString().split("T")[0]!;
        let todayApproved = 0, todayRejected = 0;
        let weekApproved = 0, weekRejected = 0;
        for (const row of rows) {
          if (row.dateKey === today) {
            todayApproved = row.approved;
            todayRejected = row.rejected;
          }
          if (row.dateKey >= weekStartKey) {
            weekApproved += row.approved;
            weekRejected += row.rejected;
          }
        }
        return {
          today: { approved: todayApproved, rejected: todayRejected, total: todayApproved + todayRejected },
          week: { approved: weekApproved, rejected: weekRejected, total: weekApproved + weekRejected },
          history: rows,
        };
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
        return { success: true };
      }),

    // Any authenticated user (owner or applier) can reject a job they cannot apply to
    applierReject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateJobStatus(input.id, "rejected");
        return { success: true };
      }),

    // Preview: how many matched jobs would be auto-rejected at the given threshold
    autoRejectPreview: protectedProcedure
      .input(z.object({ threshold: z.number().min(0).max(100) }))
      .query(async ({ input }) => {
        const count = await countAutoRejectPreview(input.threshold);
        return { count };
      }),

    // Execute: bulk-reject all matched jobs below threshold
    autoRejectConfirm: adminProcedure
      .input(z.object({ threshold: z.number().min(0).max(100) }))
      .mutation(async ({ input }) => {
        const affected = await bulkAutoReject(input.threshold);
        return { success: true, affected };
      }),

    // Manually add a job that was applied to directly (e.g. via LinkedIn)
    manualAdd: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        company: z.string().min(1),
        location: z.string().optional(),
        applyUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await insertJob({
          title: input.title,
          company: input.company,
          location: input.location ?? null,
          description: input.notes ?? null,
          applyUrl: input.applyUrl ?? null,
          status: "applied",
          matchScore: 0,
          manuallyAdded: true,
          addedBy: ctx.user.name ?? ctx.user.email ?? "Unknown",
          appliedAt: new Date(),
          statusChangedAt: new Date(),
          isDuplicate: false,
          hasEmail: false,
          autoRejected: false,
        });
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
        let dimensionScores: Partial<DimensionScores> = {};
        let status: "ingested" | "matched" = "ingested";
        if (skills && descText) {
          const result = await scoreJobWithLLM(descText, skills, input.title, input.company, input.location ?? undefined);
          matchScore = result.composite;
          dimensionScores = result;
          if (matchScore > 0 && !result.dealBreakerMatched) status = "matched";
        }
        await insertJob({
          ...input, isDuplicate, hasEmail, emailFound: emailFound ?? undefined, matchScore, status, tags: [],
          scoreSkills: dimensionScores.scoreSkills,
          scoreSeniority: dimensionScores.scoreSeniority,
          scoreLocation: dimensionScores.scoreLocation,
          scoreIndustry: dimensionScores.scoreIndustry,
          scoreCompensation: dimensionScores.scoreCompensation,
          dealBreakerMatched: dimensionScores.dealBreakerMatched ?? undefined,
        });
        return { success: true, isDuplicate, matchScore };
      }),

    // ─── Resume Generation ─────────────────────────────────────────────────
    generateResume: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const job = await getJobById(input.jobId);
        if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
        if (!job.description) throw new TRPCError({ code: "BAD_REQUEST", message: "Job has no description" });

        // Create log entry
        const { getDb } = await import("./db");
        const { resumeGenerationLog } = await import("../drizzle/schema");
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const [logEntry] = await database.insert(resumeGenerationLog).values({
          jobId: input.jobId,
          jobTitle: job.title,
          jobCompany: job.company,
          requestedBy: ctx.user.name || ctx.user.email || "unknown",
          requestedByUserId: ctx.user.id,
          status: "generating",
        }).$returningId();

        // Run generation async (non-blocking)
        const { generateResumeForJob } = await import("./resume-generator");
        generateResumeForJob(job.title, job.company, job.description).then(async (result) => {
          const { getDb: getDb2 } = await import("./db");
          const db2 = await getDb2();
          if (!db2) return;
          const { resumeGenerationLog: rgl, jobs: jobsTable } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          if (result.success && result.filePath) {
            await db2.update(rgl).set({
              status: "completed",
              filePath: result.filePath,
              durationMs: result.durationMs,
              completedAt: new Date(),
            }).where(eq(rgl.id, logEntry.id));
            await db2.update(jobsTable).set({
              resumeGeneratedPath: result.filePath,
            }).where(eq(jobsTable.id, input.jobId));
          } else {
            await db2.update(rgl).set({
              status: "failed",
              errorMessage: result.error || "Unknown error",
              durationMs: result.durationMs,
              completedAt: new Date(),
            }).where(eq(rgl.id, logEntry.id));
          }
        }).catch(async (err) => {
          console.error("[Resume] Unhandled error:", err);
          const { getDb: getDb3 } = await import("./db");
          const db3 = await getDb3();
          if (!db3) return;
          const { resumeGenerationLog: rgl2 } = await import("../drizzle/schema");
          const { eq: eq2 } = await import("drizzle-orm");
          await db3.update(rgl2).set({
            status: "failed",
            errorMessage: err.message || "Unhandled error",
            completedAt: new Date(),
          }).where(eq2(rgl2.id, logEntry.id));
        });

        return { logId: logEntry.id, status: "generating" };
      }),

    resumeStatus: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        const { getDb: getDbStatus } = await import("./db");
        const dbStatus = await getDbStatus();
        if (!dbStatus) return { status: "none" as const, filePath: null };
        const { resumeGenerationLog } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        const [latest] = await dbStatus.select()
          .from(resumeGenerationLog)
          .where(eq(resumeGenerationLog.jobId, input.jobId))
          .orderBy(desc(resumeGenerationLog.requestedAt))
          .limit(1);
        if (!latest) return { status: "none" as const, filePath: null };
        return {
          status: latest.status as "pending" | "generating" | "completed" | "failed",
          filePath: latest.filePath,
          logId: latest.id,
        };
      }),

    resumeLog: protectedProcedure.query(async () => {
      const { getDb: getDbLog } = await import("./db");
      const dbLog = await getDbLog();
      if (!dbLog) return [];
      const { resumeGenerationLog } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      return dbLog.select().from(resumeGenerationLog).orderBy(desc(resumeGenerationLog.requestedAt)).limit(100);
    }),

    resumeConfig: protectedProcedure.query(async () => {
      const { readFileSync, existsSync } = await import("fs");
      const dir = "/home/ubuntu/projects/1000jobs-main-folder-8ad188bd/resume_engine";
      const promptPath = dir + "/prompt_template.txt";
      const cssPath = dir + "/resume_style.css";
      return {
        promptTemplate: existsSync(promptPath) ? readFileSync(promptPath, "utf-8") : "",
        cssTemplate: existsSync(cssPath) ? readFileSync(cssPath, "utf-8") : "",
      };
    }),

    updateResumeConfig: protectedProcedure
      .input(z.object({
        promptTemplate: z.string().optional(),
        cssTemplate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { writeFileSync } = await import("fs");
        const dir = "/home/ubuntu/projects/1000jobs-main-folder-8ad188bd/resume_engine";
        if (input.promptTemplate !== undefined) {
          writeFileSync(dir + "/prompt_template.txt", input.promptTemplate, "utf-8");
        }
        if (input.cssTemplate !== undefined) {
          writeFileSync(dir + "/resume_style.css", input.cssTemplate, "utf-8");
        }
        return { success: true };
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
      const liMonthKey = `li-${monthKey}`;
      const [fantastic, linkedin] = await Promise.all([
        getOrCreateApiUsage(monthKey),
        getOrCreateApiUsage(liMonthKey),
      ]);
      return { fantastic, linkedin };
    }),

    // Fetch Schedules CRUD
    listSchedules: adminProcedure.query(async () => getAllFetchSchedules()),

    createSchedule: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        endpoint: z.enum(ALL_ENDPOINTS).default("active-ats-7d"),
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
          const result = await executeFetch({ ...filters, endpoint: schedule.endpoint as FetchFilters["endpoint"] }, schedule.id, schedule.name);
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
      .input(z.object({
        content: z.string().default(""),
        mustHaveSkills: z.array(z.string()).optional(),
        niceToHaveSkills: z.array(z.string()).optional(),
        dealbreakers: z.array(z.string()).optional(),
        seniority: z.string().optional(),
        salaryMin: z.number().optional(),
        targetIndustries: z.array(z.string()).optional(),
        remotePreference: z.enum(["remote", "hybrid", "onsite", "any"]).optional(),
        weightSkills: z.number().min(0).max(100).optional(),
        weightSeniority: z.number().min(0).max(100).optional(),
        weightLocation: z.number().min(0).max(100).optional(),
        weightIndustry: z.number().min(0).max(100).optional(),
        weightCompensation: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertSkillsProfile(input);
        return { success: true };
      }),

    rescoreAll: adminProcedure
      .input(z.object({ forceRescore: z.boolean().optional().default(false) }))
      .mutation(async ({ input }) => {
      const skills = await getSkillsProfile();
      if (!skills) throw new TRPCError({ code: "BAD_REQUEST", message: "No skills profile found" });
      const allJobs = await getAllJobs();
      let updated = 0;
      let migrated = 0;
      let skipped = 0;
      for (const job of allJobs) {
        // Migrate any remaining "ingested" jobs to "matched" regardless of score
        if (job.status === "ingested") {
          await updateJobStatus(job.id, "matched");
          migrated++;
        }
        // Cost opt #5: skip already-scored jobs unless forceRescore is set
        const needsScoring = input.forceRescore
          ? !!job.description
          : (job.matchScore === 0 || job.matchScore === null) && !!job.description;
        if (!needsScoring) { skipped++; }
        if (needsScoring && job.description) {
          try {
            const result = await scoreJobWithLLM(job.description, skills, job.title, job.company, job.location ?? undefined);
            if (result.dealBreakerMatched) {
              // Auto-reject dealbreaker jobs — don't leave them in Matched with score=0
              if (job.status === "matched" || job.status === "ingested") {
                await updateJobStatus(job.id, "rejected");
              }
              await updateJobMatchScore(job.id, 0, { dealBreakerMatched: result.dealBreakerMatched });
            } else if (result.scoreSeniority < 50) {
              // Seniority post-filter — auto-reject low-seniority matches
              if (job.status === "matched" || job.status === "ingested") {
                await updateJobStatus(job.id, "rejected");
              }
              await updateJobMatchScore(job.id, result.composite, {
                scoreSkills: result.scoreSkills,
                scoreSeniority: result.scoreSeniority,
                scoreLocation: result.scoreLocation,
                scoreIndustry: result.scoreIndustry,
                scoreCompensation: result.scoreCompensation,
                dealBreakerMatched: null,
              });
            } else {
              await updateJobMatchScore(job.id, result.composite, {
                scoreSkills: result.scoreSkills,
                scoreSeniority: result.scoreSeniority,
                scoreLocation: result.scoreLocation,
                scoreIndustry: result.scoreIndustry,
                scoreCompensation: result.scoreCompensation,
                dealBreakerMatched: null,
              });
            }
            updated++;
          } catch (err) {
            console.error("[rescoreAll] Scoring failed for job", job.id, (err as Error).message);
          }
        }
      }
      return { success: true, updated, migrated, skipped };
    }),
  }),

  // ─── Question Bank ──────────────────────────────────────────────────────────

  questions: router({
    all: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") return getAllQuestions();
      return getAllQuestions();
    }),

    unanswered: protectedProcedure.query(async () => getUnansweredQuestions()),

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

    // All authenticated users can answer questions
    answer: protectedProcedure
      .input(z.object({ id: z.number(), answer: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        // Fetch the question before updating so we have context for the email
        const question = await getQuestionById(input.id);
        await answerQuestion(input.id, input.answer);
        // Send email notification to Applier
        if (question) {
          const html = buildQuestionAnsweredEmail({
            question: question.question,
            answer: input.answer,
            answeredBy: ctx.user.name ?? "a user",
            jobTitle: question.jobTitle,
            jobCompany: question.jobCompany,
          });
          await sendEmail({
            to: APPLIER_EMAIL,
            subject: `✅ Question Answered — ${question.jobTitle ?? "JobPilot"}`,
            html,
          });
        }
        // Owner self-notification removed (cost opt #2) — applier email above is sufficient
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

    campaign: publicProcedure.query(async () => {
      const pipeline = await getPipelineStats();
      const totalApplied = pipeline.totalApplied;
      const remaining = Math.max(0, 1000 - totalApplied);
      const pct = Math.min(100, Math.round((totalApplied / 1000) * 100));
      const dateKey = getCurrentDateKey();
      const appliedToday = await getAppliedTodayCount(dateKey);
      return { totalApplied, remaining, pct, goal: 1000, appliedToday };
    }),
    sourceBreakdown: protectedProcedure.query(async () => getAppliedBySource()),

    // Lightweight poll for the top progress bar
    scoringStatus: protectedProcedure.query(() => getIngestionStatus()),
  }),

  // ─── Notifications (email) ───────────────────────────────────────────────────────────────────

  notifications: router({
    // Owner-only: send a test daily report immediately
    sendTestDailyReport: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Owner only" });
      }
      await sendDailyReport();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
