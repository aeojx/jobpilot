import { useState } from "react";
import { ChevronDown, ChevronRight, Rocket } from "lucide-react";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReleaseEntry {
  version: string;
  date: string;
  title: string;
  content: React.ReactNode;
  tag?: "fix" | "feature" | "infra";
}

// ─── Release Data ─────────────────────────────────────────────────────────────
const RELEASES: ReleaseEntry[] = [
  {
    version: "3.39",
    date: "Apr 17, 2026",
    title: "Resume Generation — Tailored Resume Builder",
    tag: "feature" as const,
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Generate Resume button</strong> — every job card in My Queue and the Dashboard Kanban now has a "Generate Resume" button. One click triggers an LLM-powered resume tailored to that specific job description.</li>
        <li><strong>3-state button UX</strong> — the button transitions through Generate Resume → Generating... (disabled, polling) → Download Resume (cyan, opens PDF). On failure, shows Retry Resume.</li>
        <li><strong>Document Vault</strong> — base profile, prompt template, and CSS stylesheet are stored in the database and reused across all resume generations. Editable from the Resume Generation → Document Vault tab.</li>
        <li><strong>Zero-hallucination policy</strong> — the LLM prompt strictly enforces that only facts from the master profile are used. No fabricated roles, metrics, or responsibilities.</li>
        <li><strong>ATS keyword optimization</strong> — the generator extracts 15-20 keywords from the job description and weaves them naturally into the resume using AEO principles.</li>
        <li><strong>Executive-caliber PDF output</strong> — resumes are generated in Markdown, styled with a custom CSS (EB Garamond serif font, teal accents, structured sections), and converted to PDF.</li>
        <li><strong>S3 storage</strong> — generated PDFs are uploaded to S3 for persistent access. Download links work from any device.</li>
        <li><strong>Resume Generation Log</strong> — all generation requests are logged with job title, company, status, duration, and download link. Accessible from the Resume Gen sidebar tab.</li>
        <li><strong>Resume Gen nav item</strong> — added to both Owner and Applier sidebar navigation.</li>
        <li><strong>8 new vitest tests</strong> — covering generate, status, log, getConfig, and updateConfig endpoints.</li>
      </ul>
    ),
  },
  {
    version: "3.33",
    date: "Apr 8, 2026",
    title: "Blocked Reason + Daily Report Blocked Count",
    tag: "feature" as const,
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Blocked reason field added</strong> — Applier can now type an optional reason when blocking a job (e.g. 'portal broken', 'requires UAE national'). Reason is saved to the database and displayed on the card and in the Job Detail Modal.</li>
        <li><strong>Reason prompt modal</strong> — clicking the 🚫 BLOCKED quick-action button on a Kanban card opens a focused input modal. Press Enter to confirm or Escape to cancel.</li>
        <li><strong>Block Reason in Job Detail Modal</strong> — an optional reason input is shown in the modal body for To Apply jobs. Blocked jobs display the saved reason in a highlighted box.</li>
        <li><strong>Auto-clear on unblock</strong> — moving a job back to To Apply automatically clears the blocked reason.</li>
        <li><strong>Blocked count in daily/weekly report emails</strong> — Pipeline Snapshot now shows 4 cells: Matched, To Apply, Blocked, Applied.</li>
      </ul>
    ),
  },
  {
    version: "v3.32",
    date: "Apr 8, 2026",
    title: "Applier Dashboard Access + Blocked Column",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Dashboard now accessible to Applier</strong> — the Applier role can now navigate to the full Kanban Dashboard via the sidebar. Dashboard link added to Applier nav.</li>
        <li><strong>Applier drag-and-drop enabled</strong> — Applier can drag cards between <code style={{ color: "var(--atari-cyan)" }}>To Apply</code>, <code style={{ color: "var(--atari-cyan)" }}>Blocked</code>, <code style={{ color: "var(--atari-cyan)" }}>Applied</code>, and <code style={{ color: "var(--atari-cyan)" }}>Expired</code> columns. Owner-only columns (Matched, Rejected, Ingested) remain protected.</li>
        <li><strong>New “Blocked” column</strong> — a magenta-colored column placed immediately after To Apply for jobs the Applier cannot apply to (e.g., requires referral, portal broken, already applied elsewhere). Jobs can be dragged back to To Apply from Blocked.</li>
        <li><strong>Quick-action buttons updated</strong> — To Apply cards now show a 🚫 BLOCKED button alongside APPLIED and EXPIRED. Blocked cards show APPLIED and EXPIRED buttons.</li>
        <li><strong>Job Detail Modal updated</strong> — Applier sees a “Can't Apply” button on To Apply jobs and a “Move Back to Queue” button on Blocked jobs.</li>
        <li><strong>DB migration applied</strong> — <code style={{ color: "var(--atari-cyan)" }}>jobs.status</code> enum extended to include <code style={{ color: "var(--atari-cyan)" }}>blocked</code>. 83 tests passing.</li>
      </ul>
    ),
  },
  {
    version: "v3.31",
    date: "Apr 8, 2026",
    title: "Ingestion Schedule Analysis + 5 Pipeline Improvements",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Ingestion schedule analysis</strong> — analyzed 1,505 ingested jobs and 159 applied jobs to produce data-driven daily fetch schedule recommendations (see INGESTION_SCHEDULE_ANALYSIS.md).</li>
        <li><strong>3 new dealbreakers added</strong> — <code style={{ color: "var(--atari-cyan)" }}>co-founder</code>, <code style={{ color: "var(--atari-cyan)" }}>sales director</code>, <code style={{ color: "var(--atari-cyan)" }}>account executive</code> added to the dealbreaker list. 1 existing matched job retroactively rejected.</li>
        <li><strong>Empty-location fix</strong> — when a job has no location, the LLM scoring prompt now passes <code style={{ color: "var(--atari-cyan)" }}>"Remote (no location specified — treat as remote-friendly)"</code> instead of omitting the field. This prevents remote-eligible jobs from scoring 0 on location. Data shows no-location jobs have 18.8% approval rate.</li>
        <li><strong>Skills profile cache invalidated</strong> — new dealbreakers take effect immediately for all new ingestion runs.</li>
      </ul>
    ),
  },
  {
    version: "v3.30",
    date: "Apr 7, 2026",
    title: "Minimum Seniority Post-Filter",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Seniority post-filter</strong> — jobs scoring below 50 on <code style={{ color: "var(--atari-cyan)" }}>scoreSeniority</code> are now auto-rejected after LLM evaluation (same pattern as dealbreaker filter).</li>
        <li><strong>Applied to background scoring and rescoreAll</strong> — both the async background scorer and the manual Rescore All operation enforce this filter.</li>
        <li><strong>Retroactive cleanup</strong> — 114 existing matched jobs with <code style={{ color: "var(--atari-cyan)" }}>scoreSeniority &lt; 50</code> were retroactively rejected.</li>
        <li><strong>1 new unit test added</strong> — 82 tests passing total.</li>
      </ul>
    ),
  },
  {
    version: "v3.29",
    date: "Apr 7, 2026",
    title: "Location Normalization",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>normalizeLocation() helper</strong> — converts verbose API location strings to clean short forms before passing to LLM scoring. Example: <code style={{ color: "var(--atari-cyan)" }}>"Dubai, Dubai, United Arab Emirates"</code> → <code style={{ color: "var(--atari-cyan)" }}>"Dubai, UAE"</code>.</li>
        <li><strong>Supported country aliases</strong> — United Arab Emirates → UAE, United States → US, United Kingdom → UK.</li>
        <li><strong>6 new unit tests</strong> — 81 tests passing total.</li>
      </ul>
    ),
  },
  {
    version: "v3.28",
    date: "Apr 7, 2026",
    title: "4 Cost Optimizations",
    tag: "infra",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Removed owner self-notification on question answer</strong> — eliminated unnecessary notification when the owner answers their own questions.</li>
        <li><strong>Slowed getUsage poll: 30s → 5 min</strong> — API usage stats on the Ingest page now refresh every 5 minutes instead of every 30 seconds.</li>
        <li><strong>5-min in-memory cache for getSkillsProfile()</strong> — avoids 100+ DB reads per scoring batch; cache invalidated on profile update.</li>
        <li><strong>rescoreAll skips already-scored jobs by default</strong> — only re-scores jobs with <code style={{ color: "var(--atari-cyan)" }}>matchScore = 0</code> unless <code style={{ color: "var(--atari-cyan)" }}>forceRescore: true</code> is passed.</li>
      </ul>
    ),
  },
  {
    version: "v3.27",
    date: "Apr 6, 2026",
    title: "Auto-Reject Dealbreaker Jobs During Scoring",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Auto-reject on dealbreaker match</strong> — jobs matching a dealbreaker keyword during background scoring are now immediately moved to Rejected instead of staying in Matched with score=0.</li>
        <li><strong>Applied to rescoreAll</strong> — the manual Rescore All operation also enforces this rule.</li>
        <li><strong>Retroactive cleanup</strong> — 121 existing matched jobs with dealbreaker keywords were retroactively rejected.</li>
      </ul>
    ),
  },
  {
    version: "v3.26",
    date: "Apr 6, 2026",
    title: "TopProgressBar — Live Ingestion & Scoring Status",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>TopProgressBar component</strong> — a slim animated bar appears at the top of every page during job ingestion (amber) and background LLM scoring (blue/purple).</li>
        <li><strong>Smart polling</strong> — polls the <code style={{ color: "var(--atari-cyan)" }}>scoringStatus</code> tRPC endpoint every 3 seconds while active, slowing to 10 seconds when idle.</li>
        <li><strong>Integrated in AppLayout</strong> — visible on all pages without any per-page setup.</li>
      </ul>
    ),
  },
  {
    version: "v3.25",
    date: "Apr 6, 2026",
    title: "Removed Email Draft Tab",
    tag: "infra",
    content: (
      <p>Removed the Email Draft nav item from the owner sidebar and the <code style={{ color: "var(--atari-cyan)" }}>/email-draft</code> route. The EmailDraft.tsx file is kept in the codebase but is no longer accessible via the UI.</p>
    ),
  },
  {
    version: "v3.24",
    date: "Apr 6, 2026",
    title: "Standalone Release Notes Page",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Public Release Notes page</strong> — standalone page at <code style={{ color: "var(--atari-cyan)" }}>/release-notes</code> listing all versions (v3.0–v3.23), accessible without login.</li>
        <li><strong>Release Notes link added to sidebar</strong> — available for both Owner and Applier roles.</li>
      </ul>
    ),
  },
  {
    version: "v3.23",
    date: "Apr 6, 2026",
    title: "Fix 504 Gateway Timeout on Ingest",
    tag: "fix",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Root cause identified</strong> — fetching 100 jobs with synchronous LLM scoring took ~300 seconds, exceeding the AWS load balancer's 5-minute timeout and returning an HTML 504 page instead of JSON.</li>
        <li><strong>Fix: async background scoring</strong> — jobs are now inserted immediately with <code style={{ color: "var(--atari-cyan)" }}>matchScore = 0</code>. LLM scoring runs in a background task via <code style={{ color: "var(--atari-cyan)" }}>setImmediate</code> after the HTTP response is sent.</li>
        <li><strong>Result</strong> — fetch response now returns in under 10 seconds regardless of batch size. Scores appear on the Dashboard within a few minutes.</li>
      </ul>
    ),
  },
  {
    version: "v3.22",
    date: "Apr 6, 2026",
    title: "LinkedIn Badge, Per-Source Chart, Fetch History Source",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>LinkedIn LI badge</strong> — a blue <code style={{ color: "var(--atari-cyan)" }}>LI</code> badge appears on Kanban and Swipe cards when the job's source contains "linkedin".</li>
        <li><strong>Applied by Source chart</strong> — Performance page now shows a horizontal bar chart breaking down applied jobs by LINKEDIN / EXTERNAL / MANUAL with counts and percentages.</li>
        <li><strong>Fetch history source indicator</strong> — every row in the Ingest Jobs history panel now shows a LINKEDIN (blue) or EXTERNAL (amber) badge derived from the endpoint.</li>
      </ul>
    ),
  },
  {
    version: "v3.21",
    date: "Apr 6, 2026",
    title: "LinkedIn Jobs API Integration",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>New API source: LinkedIn Jobs</strong> — integrated <code style={{ color: "var(--atari-cyan)" }}>linkedin-job-search-api.p.rapidapi.com</code> using the same RapidAPI key.</li>
        <li><strong>Two LinkedIn endpoints</strong> — <code style={{ color: "var(--atari-cyan)" }}>active-jb-24h</code> (last 24 hours) and <code style={{ color: "var(--atari-cyan)" }}>active-jb-7d</code> (last 7 days).</li>
        <li><strong>Source toggle in Ingest UI</strong> — switch between Fantastic Jobs and LinkedIn Jobs with a toggle at the top of the Ingest page.</li>
        <li><strong>LinkedIn-specific filters</strong> — seniority level, direct apply only, org slug filter.</li>
        <li><strong>Separate quota tracking</strong> — LinkedIn API usage tracked independently under <code style={{ color: "var(--atari-cyan)" }}>li-YYYY-MM</code> month key.</li>
        <li><strong>DB migration</strong> — <code style={{ color: "var(--atari-cyan)" }}>fetch_schedules.endpoint</code> enum extended to include LinkedIn endpoints.</li>
      </ul>
    ),
  },
  {
    version: "v3.20",
    date: "Apr 5, 2026",
    title: "Daily Report Bug Fix & Time Change",
    tag: "fix",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Duplicate daily emails fixed</strong> — the last-sent date is now persisted to the database (<code style={{ color: "var(--atari-cyan)" }}>system_config</code> table) instead of an in-memory variable. Server restarts and hibernation wakeups no longer trigger duplicate sends.</li>
        <li><strong>Daily report rescheduled to 7 PM GST</strong> (was 9 PM). The trigger window is now 7–9 PM GST (hours 19–21).</li>
        <li><strong>Weekly report</strong> also updated to use DB persistence for the same reason.</li>
      </ul>
    ),
  },
  {
    version: "v3.19",
    date: "Apr 3, 2026",
    title: "CampaignBar Now Visible on All Pages",
    tag: "fix",
    content: (
      <p>
        Root cause found — the CampaignBar was wired into <code style={{ color: "var(--atari-cyan)" }}>DashboardLayout</code> but the app uses a custom <code style={{ color: "var(--atari-cyan)" }}>AppLayout</code> component. Moved CampaignBar to AppLayout so it now appears on every page.
      </p>
    ),
  },
  {
    version: "v3.18",
    date: "Apr 3, 2026",
    title: "CampaignBar Redesign",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Redesigned layout</strong> — shows ✅ applied today pill, animated progress bar, total applied / 1,000, and 🎯 remaining badge.</li>
        <li><strong>Sticky bar</strong> — stays visible while scrolling.</li>
        <li><strong>Clickable</strong> — links to the Performance page.</li>
        <li><strong>Auto-refreshes</strong> every 60 seconds.</li>
      </ul>
    ),
  },
  {
    version: "v3.17",
    date: "Apr 3, 2026",
    title: "Campaign Progress Bar (Initial)",
    tag: "feature",
    content: (
      <p>
        Added a persistent <strong>CampaignBar</strong> component at the top of every page. Shows the 🎯 1000 Jobs label, an animated progress bar, total applied count (e.g. 19 / 1,000), and a remaining badge. Backed by a new <code style={{ color: "var(--atari-cyan)" }}>stats.campaign</code> tRPC query. Refreshes every 60 seconds.
      </p>
    ),
  },
  {
    version: "v3.16",
    date: "Apr 3, 2026",
    title: "Remove Gamification from Performance Page",
    tag: "feature",
    content: (
      <p>
        Removed the Applier Stats / Gamification section (Tier, XP, Streak, Best Streak, XP progress bar) from the Performance page. The page now focuses on applied counts, pipeline health, and the 1,000-job campaign progress.
      </p>
    ),
  },
  {
    version: "v3.15",
    date: "Apr 3, 2026",
    title: "Fix Applied Job Counting",
    tag: "fix",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Fixed applied count</strong> — daily reports and performance stats now query the <code style={{ color: "var(--atari-cyan)" }}>jobs</code> table directly using <code style={{ color: "var(--atari-cyan)" }}>statusChangedAt</code> in GST timezone.</li>
        <li>Previously these functions read from the <code style={{ color: "var(--atari-cyan)" }}>applierStats</code> table which only tracked "Mark as Applied" button clicks, missing manually added jobs and swipe-approved jobs.</li>
        <li>All applied jobs (manual, swipe, button) now count correctly in the daily report, weekly stats, and performance metrics.</li>
      </ul>
    ),
  },
  {
    version: "v3.14",
    date: "Apr 2, 2026",
    title: "Weekly Report & Scheduler Fix",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Weekly report added</strong> — sent every Friday at 9 PM GST to both Owner and Applier.</li>
        <li><strong>Daily report trigger hour corrected</strong> to 9 PM GST (was 11 PM).</li>
        <li><strong>Catch-up logic</strong> — if the server wakes after the trigger hour and no report was sent today, it sends immediately.</li>
        <li><strong>Subject lines updated</strong> to use correct dynamic format with remaining count.</li>
      </ul>
    ),
  },
  {
    version: "v3.13",
    date: "Apr 2, 2026",
    title: "Release Notes Section in FAQ",
    tag: "feature",
    content: (
      <p>
        Added a Release Notes section to the FAQ page with a full timeline of all changes from v3.0 onwards. Each entry shows the date, version title, and a summary of what changed. Now moved to this dedicated page.
      </p>
    ),
  },
  {
    version: "v3.12",
    date: "Apr 2, 2026",
    title: "Smarter Duplicate Detection",
    tag: "fix",
    content: (
      <p>
        Duplicate detection now uses a two-stage check. The API's own job ID (<code style={{ color: "var(--atari-cyan)" }}>externalId</code>) is checked first — an exact match immediately skips the job. If no externalId is available, the system falls back to the existing title + company fuzzy match. This catches the same job re-posted under a slightly different title.
      </p>
    ),
  },
  {
    version: "v3.11",
    date: "Apr 2, 2026",
    title: "Duplicate Jobs Deleted (Not Tagged)",
    tag: "fix",
    content: (
      <p>
        Previously, duplicate jobs were inserted with a <code style={{ color: "var(--atari-cyan)" }}>isDuplicate = true</code> flag and shown with a DUPLICATED tag on the card. Now duplicates are detected before insertion and skipped entirely — they never enter the database. This keeps the pipeline clean and avoids cluttering the Kanban board.
      </p>
    ),
  },
  {
    version: "v3.10",
    date: "Apr 2, 2026",
    title: "Improved API Error Logging",
    tag: "infra",
    content: (
      <p>
        API errors from the RapidAPI fetch are now logged with the full response body and HTTP status code. The error message shown to the user is also more descriptive, distinguishing between quota exhaustion, authentication failures, and network errors.
      </p>
    ),
  },
  {
    version: "v3.9",
    date: "Apr 2, 2026",
    title: "Ingest & Dashboard Updates",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Fetch history panel</strong> — shows last 20 fetch runs with timestamp, endpoint, jobs fetched/ingested/duplicate, duration, and status.</li>
        <li><strong>Quota banner</strong> — shows remaining jobs and requests for the current month.</li>
        <li><strong>Schedule management</strong> — create, edit, and delete automated fetch schedules with custom filters.</li>
        <li><strong>Dashboard pipeline stats</strong> — Matched / Applied / Rejected counts with percentages.</li>
      </ul>
    ),
  },
  {
    version: "v3.8",
    date: "Apr 1, 2026",
    title: "Remove Daily Target Met Email",
    tag: "fix",
    content: (
      <p>
        Removed the "Daily Target Met" email notification that fired every time the applied count hit the daily target. It was triggering too frequently and adding noise to the inbox. The daily report at 7 PM GST now serves as the single daily summary.
      </p>
    ),
  },
  {
    version: "v3.7",
    date: "Apr 1, 2026",
    title: "Public Landing Page",
    tag: "feature",
    content: (
      <p>
        A public-facing landing page was added at <code style={{ color: "var(--atari-cyan)" }}>/landing</code>. It introduces the 1000 Jobs product with a hero section, problem/solution framing, social proof, three pricing tiers, a 90-day guarantee, FAQ accordion, and a final CTA — all styled in the retro-futuristic aesthetic.
      </p>
    ),
  },
  {
    version: "v3.6",
    date: "Apr 1, 2026",
    title: "Marketing Landing Page",
    tag: "feature",
    content: (
      <p>
        Initial marketing landing page scaffold created with hero, features, and pricing sections. Styled to match the app's retro-futuristic design system.
      </p>
    ),
  },
  {
    version: "v3.5",
    date: "Apr 1, 2026",
    title: "Email Overhaul (Daily + Weekly Reports)",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Daily report rescheduled to 9 PM GST</strong> (was 11 PM).</li>
        <li><strong>Subject line updated</strong> to: <em>"1000Jobs Daily Report — ✅ X applied today | ⏳ Y ready to apply | 🎯 Z remaining"</em>.</li>
        <li><strong>Rejection stats added</strong> to daily email: Rejected Today, Total Rejected, Rejection Rate %.</li>
        <li><strong>Rejected jobs table added</strong> — all jobs rejected that day listed with title, company, location.</li>
        <li><strong>Weekly report added</strong> — sent every Friday at 9 PM GST with Week at a Glance stats, daily Mon–Sun breakdown, pipeline health, 1,000-job progress bar, and full lists of all applied and rejected jobs for the week.</li>
      </ul>
    ),
  },
  {
    version: "v3.4",
    date: "Mar 31, 2026",
    title: "Daily Report Email Enhancements",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Dynamic subject line</strong> with live applied/pipeline/remaining counts.</li>
        <li><strong>Rate projection</strong> — "At the current rate, you will reach 1,000 jobs in X weeks" based on 7-day rolling average.</li>
        <li><strong>Applied today table</strong> — all jobs applied that day listed with title, company, and location at the bottom of the email.</li>
      </ul>
    ),
  },
  {
    version: "v3.3",
    date: "Mar 30, 2026",
    title: "Email Notifications (Resend)",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Resend SDK integrated</strong> with verified domain <code style={{ color: "var(--atari-cyan)" }}>notifications@allanabbas.com</code>.</li>
        <li><strong>Question-answered email</strong> — when any user answers a question in the Question Bank, an email is sent to the Applier with the question, answer, and job context.</li>
        <li><strong>Daily report email</strong> — sent nightly to both Owner and Applier with pipeline snapshot, last 7 days breakdown, and 1,000-job campaign progress bar.</li>
      </ul>
    ),
  },
  {
    version: "v3.2",
    date: "Mar 29, 2026",
    title: "Manual Job Add",
    tag: "feature",
    content: (
      <p>
        A "Manual Add" button was added to the Kanban header. Owners can manually add jobs (title, company, location, URL, notes) that land directly in the Applied column. Manually added cards show a <strong style={{ color: "var(--atari-amber)" }}>MANUAL</strong> tag and an "Added by [name]" attribution line.
      </p>
    ),
  },
  {
    version: "v3.1",
    date: "Mar 28, 2026",
    title: "Matching Algorithm Upgrade",
    tag: "feature",
    content: (
      <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
        <li><strong>Structured skills profile</strong> — must-have skills, nice-to-have skills, dealbreakers, seniority, salary minimum, target industries, remote preference.</li>
        <li><strong>5-dimension scoring</strong> — Skills, Seniority, Location, Industry, Compensation scored separately then combined into a composite.</li>
        <li><strong>Dealbreaker pre-filter</strong> — jobs matching any dealbreaker keyword are auto-rejected before the LLM call.</li>
        <li><strong>Dimension score breakdown</strong> shown on SwipeView cards and Kanban job detail modal.</li>
      </ul>
    ),
  },
  {
    version: "v3.0",
    date: "Mar 27, 2026",
    title: "Auto-Reject Feature",
    tag: "feature",
    content: (
      <p>
        An Auto-Reject button was added to the SwipeView header. The Owner sets a score threshold (default 30%) and previews how many jobs will be rejected. On confirmation, all Matched jobs below the threshold are moved to Rejected with an <strong style={{ color: "var(--atari-red)" }}>AUTO-REJECTED</strong> tag and removed from the swipe queue immediately.
      </p>
    ),
  },
];

// ─── Tag Badge ────────────────────────────────────────────────────────────────
function TagBadge({ tag }: { tag?: string }) {
  if (!tag) return null;
  const styles: Record<string, React.CSSProperties> = {
    fix: { background: "rgba(255,80,80,0.15)", color: "var(--atari-red)", border: "1px solid rgba(255,80,80,0.3)" },
    feature: { background: "rgba(0,255,200,0.1)", color: "var(--atari-cyan)", border: "1px solid rgba(0,255,200,0.25)" },
    infra: { background: "rgba(255,200,0,0.1)", color: "var(--atari-amber)", border: "1px solid rgba(255,200,0,0.25)" },
  };
  const labels: Record<string, string> = { fix: "BUG FIX", feature: "FEATURE", infra: "INFRA" };
  return (
    <span style={{
      ...styles[tag],
      fontFamily: "var(--font-mono)",
      fontSize: "0.55rem",
      letterSpacing: "0.1em",
      padding: "2px 6px",
      borderRadius: "2px",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {labels[tag]}
    </span>
  );
}

// ─── Release Entry Row ────────────────────────────────────────────────────────
function ReleaseRow({ entry }: { entry: ReleaseEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--atari-border)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.9rem 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {open
          ? <ChevronDown size={14} style={{ color: "var(--atari-amber)", flexShrink: 0 }} />
          : <ChevronRight size={14} style={{ color: "var(--atari-amber)", flexShrink: 0 }} />
        }
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          color: "var(--atari-amber)",
          letterSpacing: "0.08em",
          flexShrink: 0,
          minWidth: "3.5rem",
        }}>
          {entry.version}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "var(--atari-dim)",
          flexShrink: 0,
          minWidth: "6rem",
        }}>
          {entry.date}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--atari-text)",
          flex: 1,
        }}>
          {entry.title}
        </span>
        <TagBadge tag={entry.tag} />
      </button>
      {open && (
        <div style={{
          paddingLeft: "1.5rem",
          paddingBottom: "1rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--atari-dim)",
          lineHeight: 1.7,
        }}>
          {entry.content}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReleaseNotes() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--atari-black)",
      padding: "2rem 1rem",
    }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Rocket size={20} style={{ color: "var(--atari-amber)" }} />
            <h1 style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.1rem",
              letterSpacing: "0.15em",
              color: "var(--atari-amber)",
              textTransform: "uppercase",
              margin: 0,
            }}>
              RELEASE NOTES
            </h1>
          </div>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--atari-dim)",
            margin: "0 0 0.75rem 0",
          }}>
            JobPilot changelog — all updates from v3.0 onwards, newest first.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-dim)" }}>
              <span style={{ color: "var(--atari-cyan)" }}>{RELEASES.length}</span> releases
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-dim)" }}>
              Latest: <span style={{ color: "var(--atari-amber)" }}>{RELEASES[0].version}</span> — {RELEASES[0].date}
            </span>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Link href="/faq" style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              color: "var(--atari-cyan)",
              textDecoration: "none",
            }}>
              ← Back to FAQ
            </Link>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <TagBadge tag="feature" />
          <TagBadge tag="fix" />
          <TagBadge tag="infra" />
        </div>

        {/* Entries */}
        <div style={{
          background: "var(--atari-surface)",
          border: "1px solid var(--atari-border)",
          borderRadius: "4px",
          padding: "0 1.25rem",
        }}>
          {RELEASES.map((entry) => (
            <ReleaseRow key={entry.version} entry={entry} />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "2rem",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "var(--atari-dim)",
        }}>
          JobPilot · 1000 Jobs Campaign · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
