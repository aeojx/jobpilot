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
