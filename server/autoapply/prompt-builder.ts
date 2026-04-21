/**
 * Builds the system and user prompts for the AutoApply LLM agent.
 * The agent uses these prompts to decide what actions to take on each page.
 */

import type {
  ApplicantPersonal,
  ApplicantWorkAuth,
  ApplicantCompensation,
  ApplicantExperience,
  ApplicantEEO,
  ApplicantAvailability,
  ApplicantSkillsBoundary,
  ApplicantProfile,
  Job,
} from "../../drizzle/schema";

export interface ApplyContext {
  job: Pick<Job, "id" | "title" | "company" | "location" | "description" | "applyUrl">;
  profile: ApplicantProfile;
  resumeText: string;
}

/** Build the system prompt for the AutoApply agent */
export function buildSystemPrompt(ctx: ApplyContext): string {
  const p = ctx.profile.personal as ApplicantPersonal | null;
  const wa = ctx.profile.workAuth as ApplicantWorkAuth | null;
  const comp = ctx.profile.compensation as ApplicantCompensation | null;
  const exp = ctx.profile.experience as ApplicantExperience | null;
  const eeo = ctx.profile.eeo as ApplicantEEO | null;
  const avail = ctx.profile.availability as ApplicantAvailability | null;
  const skills = ctx.profile.skillsBoundary as ApplicantSkillsBoundary | null;

  return `You are an expert job application assistant. You analyze web page content and decide what action to take next to complete a job application.

=== APPLICANT PROFILE ===
Name: ${p?.fullName ?? "N/A"}
Email: ${p?.email ?? "N/A"}
Phone: ${p?.phone ?? "N/A"}
Address: ${p?.address ?? ""}, ${p?.city ?? ""}, ${p?.provinceState ?? ""}, ${p?.country ?? ""} ${p?.postalCode ?? ""}
LinkedIn: ${p?.linkedinUrl ?? "N/A"}
GitHub: ${p?.githubUrl ?? "N/A"}
Portfolio: ${p?.portfolioUrl ?? "N/A"}
Website: ${p?.websiteUrl ?? "N/A"}

Work Authorization: ${wa?.legallyAuthorized ?? "N/A"} | Sponsorship Required: ${wa?.requireSponsorship ?? "N/A"} | Permit: ${wa?.workPermitType ?? "N/A"}

Salary Expectation: ${comp?.salaryExpectation ?? "N/A"} ${comp?.salaryCurrency ?? "USD"} (Range: ${comp?.salaryRangeMin ?? "N/A"} - ${comp?.salaryRangeMax ?? "N/A"})

Experience: ${exp?.yearsTotal ?? "N/A"} years | Education: ${exp?.educationLevel ?? "N/A"} | Current Title: ${exp?.currentTitle ?? "N/A"} | Target: ${exp?.targetRole ?? "N/A"}

EEO: Gender: ${eeo?.gender ?? "Decline"} | Race: ${eeo?.raceEthnicity ?? "Decline"} | Veteran: ${eeo?.veteranStatus ?? "Decline"} | Disability: ${eeo?.disabilityStatus ?? "Decline"}

Availability: Start: ${avail?.earliestStart ?? "Immediately"} | Full-time: ${avail?.fullTime ?? "Yes"} | Contract: ${avail?.contract ?? "No"}

Skills: ${skills ? [
    skills.languages?.length ? `Languages: ${skills.languages.join(", ")}` : "",
    skills.frameworks?.length ? `Frameworks: ${skills.frameworks.join(", ")}` : "",
    skills.devops?.length ? `DevOps: ${skills.devops.join(", ")}` : "",
    skills.databases?.length ? `Databases: ${skills.databases.join(", ")}` : "",
    skills.tools?.length ? `Tools: ${skills.tools.join(", ")}` : "",
  ].filter(Boolean).join(" | ") : "N/A"}

=== JOB DETAILS ===
Title: ${ctx.job.title}
Company: ${ctx.job.company}
Location: ${ctx.job.location ?? "Not specified"}

=== RESUME TEXT ===
${ctx.resumeText.slice(0, 3000)}

=== RULES ===
1. NEVER lie about work authorization, citizenship, criminal history, or education.
2. NEVER grant camera/mic/location permissions.
3. NEVER enter payment information or SSN.
4. For salary questions: use the midpoint of any posted range, or the salary expectation from the profile if no range is given.
5. For EEO questions: use the values from the profile (default: "Decline to self-identify").
6. For screening questions about skills: answer confidently based on the resume and skills list.
7. For open-ended questions: write 2-3 specific sentences referencing the job description and the applicant's experience.
8. Always upload the resume when asked. Delete any pre-existing resume first.
9. Check all pre-filled fields for accuracy and correct any errors.
10. Review all fields before submitting.

=== RESPONSE FORMAT ===
You must respond with a JSON object containing exactly one of these actions:

{ "action": "fill_field", "selector": "CSS selector", "value": "text to type", "clear": true }
{ "action": "select_option", "selector": "CSS selector", "value": "option value or text" }
{ "action": "click", "selector": "CSS selector", "reason": "why clicking this" }
{ "action": "upload_file", "selector": "CSS selector for file input" }
{ "action": "wait", "ms": 2000, "reason": "waiting for page load" }
{ "action": "scroll_down", "reason": "need to see more of the form" }
{ "action": "captcha_detected", "type": "hcaptcha|recaptcha_v2|recaptcha_v3|turnstile", "siteKey": "key" }
{ "action": "done", "result": "APPLIED|EXPIRED|FAILED|CAPTCHA|LOGIN_ISSUE", "reason": "explanation" }

Only respond with the JSON object, no other text.`;
}

/** Build the user prompt with current page state */
export function buildPageAnalysisPrompt(
  pageUrl: string,
  pageTitle: string,
  visibleText: string,
  formFields: string,
  stepInfo: string
): string {
  return `Current URL: ${pageUrl}
Page Title: ${pageTitle}
Step: ${stepInfo}

=== VISIBLE FORM FIELDS ===
${formFields.slice(0, 4000)}

=== PAGE TEXT (truncated) ===
${visibleText.slice(0, 3000)}

What is the next action to take? Respond with a single JSON action object.`;
}
