import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

interface FAQSection {
  title: string;
  icon: string;
  items: FAQItem[];
}

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: "Overview & Roles",
    icon: "▶",
    items: [
      {
        q: "What is JobPilot?",
        a: (
          <>
            <p>
              JobPilot is a two-person job application management system designed for a coordinated job search. One person
              acts as the <strong style={{ color: "var(--atari-amber)" }}>Owner</strong> (the strategist who sources and
              curates jobs) and another acts as the{" "}
              <strong style={{ color: "var(--atari-cyan)" }}>Applier</strong> (the executor who submits applications).
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              The Owner uses AI-powered tools to fetch hundreds of job listings from external APIs, automatically score
              them against a skills profile, and decide which ones are worth applying to. The Applier then works through
              the curated queue, submitting applications and logging progress — all tracked with gamification and daily
              targets.
            </p>
          </>
        ),
      },
      {
        q: "What are the two roles and what can each do?",
        a: (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Capability</th>
                <th style={{ textAlign: "center", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Owner (Admin)</th>
                <th style={{ textAlign: "center", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-cyan)" }}>Applier (User)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Fetch jobs from API", "✓", "✗"],
                ["View full Kanban Dashboard", "✓", "✗"],
                ["Drag jobs between columns", "✓", "✗"],
                ["Swipe Mode (approve/reject)", "✓", "✗"],
                ["Manage Skills Profile", "✓", "✗"],
                ["Answer questions in Q&A Bank", "✓", "✗"],
                ["View API usage & quota", "✓", "✗"],
                ["Create fetch schedules", "✓", "✗"],
                ["View My Queue (To Apply)", "✓", "✓"],
                ["Mark jobs as Applied", "✓", "✓"],
                ["Ask questions about jobs", "✓", "✓"],
                ["View Performance stats", "✓", "✓"],
                ["View Question Bank", "✓", "✓"],
              ].map(([cap, owner, applier], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--atari-surface)" }}>
                  <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>{cap}</td>
                  <td style={{ textAlign: "center", padding: "5px 10px", color: owner === "✓" ? "var(--atari-green)" : "var(--atari-border)" }}>{owner}</td>
                  <td style={{ textAlign: "center", padding: "5px 10px", color: applier === "✓" ? "var(--atari-green)" : "var(--atari-border)" }}>{applier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
      {
        q: "How do I log in?",
        a: (
          <p>
            JobPilot uses <strong>Manus OAuth</strong> for authentication. Click the <em>Login</em> button in the sidebar
            and you will be redirected to the Manus login portal. After authenticating, you are returned to the app with a
            session cookie that lasts until you log out. Your role (Owner or Applier) is determined by the{" "}
            <code style={{ color: "var(--atari-cyan)" }}>role</code> field in the database — the site owner is
            automatically assigned the <strong>admin</strong> role; anyone else who logs in receives the{" "}
            <strong>user</strong> role.
          </p>
        ),
      },
      {
        q: "What is the site password?",
        a: (
          <p>
            Before any page is accessible, the app requires a site-wide access code (set via the{" "}
            <code style={{ color: "var(--atari-cyan)" }}>SITE_PASSWORD</code> environment secret). This is a single shared
            password for the whole site — it is not per-user. Once entered correctly, a 30-day cookie is set and you will
            not be prompted again. This gate exists to keep the tool private without requiring everyone to create an
            account first.
          </p>
        ),
      },
    ],
  },
  {
    title: "Job Flow & Statuses",
    icon: "▶",
    items: [
      {
        q: "What are the six job statuses and what do they mean?",
        a: (
          <>
            <p style={{ marginBottom: "0.75rem" }}>
              Every job in JobPilot moves through a pipeline of six statuses. Understanding this flow is essential to
              using the tool effectively.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Meaning</th>
                  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Who sets it</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Ingested", "Job was fetched from the API but has no skills profile to score against, or scored 0.", "Automatic on fetch"],
                  ["Matched", "Job was scored by the LLM and received a score > 0. Ready for Owner review.", "Automatic on fetch"],
                  ["To Apply", "Owner approved this job. It appears in the Applier's queue.", "Owner (drag/swipe)"],
                  ["Applied", "Applier submitted the application and marked it done.", "Applier (or Owner)"],
                  ["Rejected", "Owner decided this job is not worth applying to.", "Owner (drag/swipe)"],
                  ["Expired", "Job is no longer available (posting taken down).", "Applier or Owner"],
                ].map(([status, meaning, who], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--atari-surface)" }}>
                    <td style={{ padding: "5px 10px", color: "var(--atari-cyan)", whiteSpace: "nowrap" }}>{status}</td>
                    <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>{meaning}</td>
                    <td style={{ padding: "5px 10px", color: "var(--atari-border)", whiteSpace: "nowrap" }}>{who}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ),
      },
      {
        q: "How does a job move from Ingested to the Applier's queue?",
        a: (
          <p>
            The full journey is: <strong>API fetch → Ingested/Matched → Owner review → To Apply → Applier applies → Applied</strong>.
            When the Owner fetches jobs, each one is automatically scored. Jobs with a score above 0 land in{" "}
            <em>Matched</em>; others land in <em>Ingested</em>. The Owner then reviews Matched jobs — either by dragging
            cards on the Kanban Dashboard or by swiping in Swipe Mode — and moves approved jobs to{" "}
            <em>To Apply</em>. That column is the Applier's queue. Once the Applier submits an application and clicks{" "}
            <em>Applied</em>, the job moves to <em>Applied</em> and XP is awarded.
          </p>
        ),
      },
      {
        q: "What is the Kanban Dashboard?",
        a: (
          <p>
            The Dashboard (Owner only) shows all six status columns side by side. Each column displays job cards with
            title, company, location, match score, and tags. The Owner can drag and drop cards between columns to change
            their status. On <em>To Apply</em> cards, quick-action buttons let the Owner mark a job as Applied or Expired
            without opening the detail modal. Clicking any card opens a full detail modal with the complete job
            description, apply link, and quick actions.
          </p>
        ),
      },
      {
        q: "What tags appear on job cards?",
        a: (
          <p>
            Three tags may appear on a job card. The <strong style={{ color: "var(--atari-cyan)" }}>ATS source tag</strong>{" "}
            (e.g., Greenhouse, Lever, Workday) shows which applicant tracking system the company uses — useful for
            knowing what kind of application form to expect. The{" "}
            <strong style={{ color: "var(--atari-green)" }}>EMAIL OUTREACH tag</strong> appears when the system detected
            an email address in the job description, indicating a direct outreach opportunity. The{" "}
            <strong style={{ color: "var(--atari-magenta)" }}>DUPE tag</strong> means a job with the same title and
            company already exists in the database — it was ingested anyway but flagged so you can decide whether to skip
            it.
          </p>
        ),
      },
    ],
  },
  {
    title: "Matching Algorithm",
    icon: "▶",
    items: [
      {
        q: "How does the match score work?",
        a: (
          <>
            <p>
              The match score (0–100%) is computed by a large language model (LLM) that compares the job description
              against your uploaded Skills Profile. The system prompt instructs the model to act as a{" "}
              <em>"job-matching expert"</em> and to consider{" "}
              <strong>semantic similarity, not just keyword overlap</strong> — meaning it understands context, synonyms,
              and related skills rather than doing a simple word count.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              The model returns a structured JSON response with a single integer field{" "}
              <code style={{ color: "var(--atari-cyan)" }}>score</code> (0–100). The first 3,000 characters of the job
              description are sent to the model along with the full skills profile. The score is clamped to the 0–100
              range and stored in the database.
            </p>
          </>
        ),
      },
      {
        q: "What does the score mean in practice?",
        a: (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Score Range</th>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Color</th>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["70 – 100%", "Green", "Strong match — the candidate's skills align well with the role requirements"],
                ["40 – 69%", "Yellow/Amber", "Partial match — some relevant skills but notable gaps exist"],
                ["1 – 39%", "Red", "Weak match — significant skill or experience mismatch"],
                ["0%", "Gray", "No score — either no skills profile exists or the LLM returned 0"],
              ].map(([range, color, interp], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--atari-surface)" }}>
                  <td style={{ padding: "5px 10px", color: "var(--atari-cyan)" }}>{range}</td>
                  <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>{color}</td>
                  <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>{interp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
      {
        q: "What is the Skills Profile and how do I set it up?",
        a: (
          <p>
            The Skills Profile is a free-text document (plain text or Markdown) that describes the candidate's
            experience, skills, technologies, and background. It is the reference document the LLM uses when scoring
            every job. The Owner uploads or pastes this document on the{" "}
            <strong>Skills</strong> page. It can be updated at any time — after saving, click{" "}
            <strong>Re-score All</strong> to re-run the LLM against every job in the database using the updated profile.
            A well-written, detailed skills profile produces more accurate and useful scores.
          </p>
        ),
      },
      {
        q: "When is scoring triggered?",
        a: (
          <p>
            Scoring runs automatically during every job fetch (both manual and scheduled). For each job, the system
            retrieves the current skills profile and calls the LLM with the job description. If no skills profile has
            been uploaded yet, all jobs land in <em>Ingested</em> with a score of 0. After uploading a skills profile,
            use the <strong>Re-score All</strong> button on the Skills page to retroactively score all existing jobs.
            Individual jobs can also be re-scored by editing and re-saving them (manual ingest path).
          </p>
        ),
      },
      {
        q: "Why might a score seem inaccurate?",
        a: (
          <p>
            LLM scoring is probabilistic and context-dependent. Common causes of inaccurate scores include: a vague or
            incomplete skills profile; a job description that is very short or uses unusual terminology; the 3,000
            character truncation cutting off important details in very long descriptions; or the model being overly
            conservative or generous on a given run. If scores feel off, try rewriting the skills profile to be more
            specific, then click <strong>Re-score All</strong>.
          </p>
        ),
      },
    ],
  },
  {
    title: "Job Ingestion & API",
    icon: "▶",
    items: [
      {
        q: "Where do jobs come from?",
        a: (
          <p>
            Jobs are fetched from the <strong>Active Jobs DB API</strong> hosted on RapidAPI
            (host: <code style={{ color: "var(--atari-cyan)" }}>active-jobs-db.p.rapidapi.com</code>). This is a
            third-party job aggregation service that indexes active job postings from hundreds of ATS platforms. The
            Owner provides a RapidAPI key (stored as the <code style={{ color: "var(--atari-cyan)" }}>RAPIDAPI_KEY</code>{" "}
            secret) to authenticate requests. Without a valid key, no jobs can be fetched.
          </p>
        ),
      },
      {
        q: "What are the two API endpoints?",
        a: (
          <>
            <p style={{ marginBottom: "0.75rem" }}>
              The Active Jobs DB API exposes two endpoints, selectable in the Ingest Jobs form:
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Endpoint</th>
                  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--atari-surface)" }}>
                  <td style={{ padding: "5px 10px", color: "var(--atari-cyan)" }}>active-ats-7d</td>
                  <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>Jobs posted in the last 7 days. Broader pool, better for weekly scheduled runs.</td>
                </tr>
                <tr>
                  <td style={{ padding: "5px 10px", color: "var(--atari-cyan)" }}>active-ats-24h</td>
                  <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>Jobs posted in the last 24 hours. Smaller, fresher pool. Good for daily runs.</td>
                </tr>
              </tbody>
            </table>
          </>
        ),
      },
      {
        q: "What filters can I apply when fetching jobs?",
        a: (
          <>
            <p style={{ marginBottom: "0.75rem" }}>
              The Ingest Jobs form exposes the full filter surface of the Active Jobs DB API:
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "5px 8px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Filter</th>
                  <th style={{ textAlign: "left", padding: "5px 8px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>What it does</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Title Filter", "Keyword match against job title"],
                  ["Advanced Title Filter", "Boolean expression for title (e.g. 'engineer AND NOT manager')"],
                  ["Location Filter", "City, country, or region (e.g. 'New York', 'United Arab Emirates')"],
                  ["Description Filter", "Keyword match inside job description"],
                  ["Advanced Description Filter", "Boolean expression for description content"],
                  ["Organization Filter", "Include only specific companies"],
                  ["Organization Exclusion", "Exclude specific companies (e.g. agencies, staffing firms)"],
                  ["ATS Source", "Filter by applicant tracking system (Greenhouse, Lever, Workday, etc.)"],
                  ["Source Exclusion", "Exclude specific ATS sources"],
                  ["Work Arrangement", "Remote / Hybrid / On-site"],
                  ["Experience Level", "Entry / Mid / Senior / Executive"],
                  ["Employment Type", "Full-time / Part-time / Contract / Internship"],
                  ["Industry Taxonomy", "AI-classified industry category"],
                  ["Visa Sponsorship", "Only show jobs that offer visa sponsorship"],
                  ["Has Salary", "Only show jobs with a disclosed salary"],
                  ["Remote", "Boolean toggle for remote-only jobs"],
                  ["Agency", "Include or exclude recruitment agency postings"],
                  ["LinkedIn Filters", "Filter by LinkedIn company slug, industry, or employee count"],
                  ["Date Filter", "Only fetch jobs posted on or after a specific date"],
                  ["Offset", "Pagination offset for fetching beyond the first 100 results"],
                ].map(([filter, desc], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--atari-surface)" }}>
                    <td style={{ padding: "4px 8px", color: "var(--atari-cyan)", whiteSpace: "nowrap" }}>{filter}</td>
                    <td style={{ padding: "4px 8px", color: "var(--atari-gray)" }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ),
      },
      {
        q: "What is deduplication and how does it work?",
        a: (
          <p>
            Before inserting a job, the system checks whether a job with the same{" "}
            <strong>title</strong> and <strong>company name</strong> already exists in the database. If a match is found,
            the job is still inserted (so you can see it) but is flagged with{" "}
            <code style={{ color: "var(--atari-magenta)" }}>isDuplicate = true</code> and displayed with a{" "}
            <strong>DUPE</strong> tag. This prevents accidentally sending the Applier to apply for the same role twice.
          </p>
        ),
      },
      {
        q: "What is the API quota and how do I monitor it?",
        a: (
          <p>
            The Active Jobs DB API has monthly limits on the number of job records returned (
            <code style={{ color: "var(--atari-cyan)" }}>jobsLimit</code> /{" "}
            <code style={{ color: "var(--atari-cyan)" }}>jobsRemaining</code>) and on the number of API requests (
            <code style={{ color: "var(--atari-cyan)" }}>requestsLimit</code> /{" "}
            <code style={{ color: "var(--atari-cyan)" }}>requestsRemaining</code>). After every fetch, these values are
            read from the API response headers and stored in the database. The Ingest Jobs page displays a quota warning
            banner when remaining jobs or requests are low. The Owner can also see the total call count for the current
            month on the same page.
          </p>
        ),
      },
      {
        q: "What do the API error codes mean?",
        a: (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Error</th>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Cause & Fix</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["HTTP 401", "Invalid API key. Check the RAPIDAPI_KEY secret in Settings."],
                ["HTTP 403", "Not subscribed to the Active Jobs DB API. Visit rapidapi.com to subscribe."],
                ["HTTP 429", "Monthly quota exceeded. Upgrade your RapidAPI plan or wait for the reset."],
                ["HTML response", "API returned an HTML page instead of JSON — usually a network/proxy issue or wrong endpoint URL."],
              ].map(([code, fix], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--atari-surface)" }}>
                  <td style={{ padding: "5px 10px", color: "var(--atari-red)", whiteSpace: "nowrap" }}>{code}</td>
                  <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>{fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
    ],
  },
  {
    title: "Fetch Schedules",
    icon: "▶",
    items: [
      {
        q: "What are Fetch Schedules?",
        a: (
          <p>
            Fetch Schedules let the Owner automate job ingestion on a recurring basis without manual intervention. A
            schedule stores a complete set of filters (title, location, ATS source, etc.) and a time configuration. The
            server checks for due schedules every <strong>5 minutes</strong> and automatically runs any that are overdue.
          </p>
        ),
      },
      {
        q: "What schedule intervals are available?",
        a: (
          <>
            <p style={{ marginBottom: "0.75rem" }}>Three interval types are supported:</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Behaviour</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Manual", "No automatic runs. Use the 'Run Now' button to trigger on demand."],
                  ["Daily", "Runs once per day at the configured hour and minute (UTC)."],
                  ["Weekly", "Runs once per week on the configured day of the week and time (UTC)."],
                ].map(([type, desc], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--atari-surface)" }}>
                    <td style={{ padding: "5px 10px", color: "var(--atari-cyan)" }}>{type}</td>
                    <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ),
      },
      {
        q: "How do I create a schedule from a past fetch?",
        a: (
          <p>
            In the Fetch History panel on the Ingest Jobs page, each successful ad-hoc fetch row has a{" "}
            <strong>Convert to Schedule</strong> button. Clicking it pre-fills the schedule builder with the exact
            filters used in that run, so you can set a name and interval without re-entering all the parameters.
          </p>
        ),
      },
      {
        q: "Can I pause a schedule without deleting it?",
        a: (
          <p>
            Yes. Each schedule has an enable/disable toggle in the Schedules list. Disabling a schedule prevents it from
            running automatically but preserves all its settings. Re-enable it at any time to resume automatic runs.
          </p>
        ),
      },
    ],
  },
  {
    title: "Swipe Mode",
    icon: "▶",
    items: [
      {
        q: "What is Swipe Mode?",
        a: (
          <p>
            Swipe Mode (accessible from the sidebar as <strong>Swiping</strong>) is a mobile-first, Tinder-style
            interface for the Owner to quickly review Matched jobs. Jobs are presented one at a time as a card stack,
            sorted from <strong>highest to lowest match score</strong>. The Owner swipes right (or clicks ✓) to move a
            job to <em>To Apply</em>, or swipes left (or clicks ✗) to <em>Reject</em> it. Keyboard arrow keys also work
            on desktop.
          </p>
        ),
      },
      {
        q: "What information is shown on each swipe card?",
        a: (
          <p>
            Each card displays: the <strong>job title</strong> with the match score percentage badge inline; the{" "}
            <strong>company name</strong>; the <strong>location</strong> (prominently in cyan); all applicable{" "}
            <strong>tags</strong> (ATS source, Email Outreach, Duplicate); a <strong>description excerpt</strong> with a
            Read More / Show Less toggle for the full text; and a <strong>VIEW FULL JOB POSTING</strong> link at the
            bottom that opens the original job URL in a new tab. The background card behind the top card shows a preview
            of the next job in the queue.
          </p>
        ),
      },
      {
        q: "How are jobs ordered in Swipe Mode?",
        a: (
          <p>
            Jobs are fetched from the database ordered by <code style={{ color: "var(--atari-cyan)" }}>matchScore DESC</code>{" "}
            — the highest-scoring job is always presented first. This ensures the Owner sees the best matches at the top
            of the queue and can make fast decisions without having to hunt for good fits.
          </p>
        ),
      },
      {
        q: "What are the swipe statistics?",
        a: (
          <p>
            The <strong>STATS</strong> button in the Swipe Mode header opens a statistics panel showing: today's
            approved, rejected, and total swipe counts with an approval rate bar; this week's (last 7 days) aggregated
            totals with an approval rate; and a daily breakdown chart for the past 7 days with green (approved) and red
            (rejected) stacked bars. Every swipe is recorded in the <code style={{ color: "var(--atari-cyan)" }}>swipe_stats</code>{" "}
            database table, keyed by date.
          </p>
        ),
      },
      {
        q: "Does swiping affect the Kanban board?",
        a: (
          <p>
            Yes — swiping is just a different interface for the same underlying status change. Approving a job in Swipe
            Mode moves it to <em>To Apply</em> on the Kanban board, making it immediately visible in the Applier's
            queue. Rejecting a job moves it to the <em>Rejected</em> column. The Kanban board and Swipe Mode are always
            in sync.
          </p>
        ),
      },
    ],
  },
  {
    title: "Applier Workflow",
    icon: "▶",
    items: [
      {
        q: "What does the Applier see?",
        a: (
          <p>
            The Applier's main view is <strong>My Queue</strong> (the Apply page), which shows only jobs in the{" "}
            <em>To Apply</em> status. Each card displays the job title, company, location, match score, tags, and a
            direct apply link if available. The Applier can click <strong>Details</strong> to read the full description,
            click <strong>Applied</strong> to log the application, or click <strong>Job No Longer Available</strong> to
            move it to Expired.
          </p>
        ),
      },
      {
        q: "What happens when the Applier clicks 'Applied'?",
        a: (
          <p>
            Clicking <em>Applied</em> triggers the <code style={{ color: "var(--atari-cyan)" }}>markApplied</code>{" "}
            procedure, which: moves the job to <em>Applied</em> status; increments today's application count in the{" "}
            <code style={{ color: "var(--atari-cyan)" }}>applier_stats</code> table; awards <strong>10 XP</strong> to
            the Applier's gamification record; updates the daily streak; and — if today's target has been met — sends an
            owner notification.
          </p>
        ),
      },
      {
        q: "What is the daily application target?",
        a: (
          <p>
            The target follows a <strong>ramp-up schedule</strong> designed to build momentum gradually. The system
            calculates the current day number based on when the first application was submitted:
          </p>
        ),
      },
      {
        q: "How is the ramp-up schedule calculated?",
        a: (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Period</th>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Daily Target</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Days 1–5 (Week 1)", "10 applications / day"],
                ["Days 6–12 (Week 2)", "20 applications / day"],
                ["Days 13–19 (Week 3)", "40 applications / day"],
                ["Day 20+ (Week 4 onwards)", "80 applications / day"],
              ].map(([period, target], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--atari-surface)" }}>
                  <td style={{ padding: "5px 10px", color: "var(--atari-cyan)" }}>{period}</td>
                  <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>{target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
    ],
  },
  {
    title: "Question Bank",
    icon: "▶",
    items: [
      {
        q: "What is the Question Bank?",
        a: (
          <p>
            The Question Bank is a shared communication channel between the Applier and the Owner. When the Applier
            encounters a question about a specific job — such as salary expectations, role requirements, or application
            strategy — they can submit it directly from the job card. The question is stored in the database linked to
            that job, and the Owner receives an instant notification.
          </p>
        ),
      },
      {
        q: "How does the Owner answer questions?",
        a: (
          <p>
            On the Question Bank page, the Owner sees all questions grouped by answered/unanswered status. Each entry
            shows the job title, company, the question text, and who asked it. The Owner types an answer inline and
            submits it. The answer is then visible to the Applier on the same page, along with the timestamp of when it
            was answered.
          </p>
        ),
      },
      {
        q: "Are questions linked to specific jobs?",
        a: (
          <p>
            Yes. Every question stores the <code style={{ color: "var(--atari-cyan)" }}>jobId</code>,{" "}
            <code style={{ color: "var(--atari-cyan)" }}>jobTitle</code>, and{" "}
            <code style={{ color: "var(--atari-cyan)" }}>jobCompany</code> at the time of submission. This provides
            context even if the job card is later moved to a different status or the job description changes.
          </p>
        ),
      },
    ],
  },
  {
    title: "Gamification & Performance",
    icon: "▶",
    items: [
      {
        q: "How does the XP system work?",
        a: (
          <p>
            The Applier earns <strong>10 XP</strong> for every application submitted via the <em>Applied</em> button.
            XP accumulates indefinitely and determines the Applier's tier. There is no XP decay — every application
            permanently contributes to the total.
          </p>
        ),
      },
      {
        q: "What are the XP tiers?",
        a: (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Tier</th>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>XP Required</th>
                <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--atari-red)", color: "var(--atari-amber)" }}>Applications</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Rookie", "0 XP", "Starting tier"],
                ["Grinder", "100 XP", "10 applications"],
                ["Machine", "500 XP", "50 applications"],
                ["Legend", "2,000 XP", "200 applications"],
              ].map(([tier, xp, apps], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--atari-surface)" }}>
                  <td style={{ padding: "5px 10px", color: "var(--atari-amber)" }}>{tier}</td>
                  <td style={{ padding: "5px 10px", color: "var(--atari-gray)" }}>{xp}</td>
                  <td style={{ padding: "5px 10px", color: "var(--atari-border)" }}>{apps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
      {
        q: "How does the streak work?",
        a: (
          <p>
            A streak counts the number of <strong>consecutive days</strong> on which the Applier submitted at least one
            application. The streak increments when an application is submitted on the day immediately following the
            last active day. If a day is skipped, the streak resets to 1 (the current day). The{" "}
            <strong>longest streak</strong> ever achieved is also tracked separately and never resets.
          </p>
        ),
      },
      {
        q: "What does the Performance page show?",
        a: (
          <p>
            The Performance page (visible to both roles) shows: today's application count vs. the daily target with a
            progress bar; the current XP, tier, and progress to the next tier; the current and longest streak; the
            ramp-up schedule with the current phase highlighted; and a 30-day history of daily application counts with
            per-day progress bars. The Owner receives a notification when the daily target is met.
          </p>
        ),
      },
    ],
  },
  {
    title: "Notifications",
    icon: "▶",
    items: [
      {
        q: "What notifications does the Owner receive?",
        a: (
          <p>
            The Owner receives two types of automated notifications via the Manus notification system: a{" "}
            <strong>"New Question from Applier"</strong> notification whenever the Applier submits a question in the
            Question Bank, and a <strong>"Daily Target Met"</strong> notification when the Applier reaches the day's
            application target. Notifications appear in the Manus platform's notification feed.
          </p>
        ),
      },
      {
        q: "Does the Applier receive notifications?",
        a: (
          <p>
            Currently, the notification system is one-directional — only the Owner receives automated notifications. The
            Applier can check the Question Bank page directly to see if their questions have been answered.
          </p>
        ),
      },
    ],
  },
  {
    title: "Data & Privacy",
    icon: "▶",
    items: [
      {
        q: "Where is data stored?",
        a: (
          <p>
            All data is stored in a <strong>MySQL/TiDB database</strong> managed by the Manus platform. This includes
            all job records, the skills profile, question bank entries, API usage counters, fetch schedules, fetch
            history, applier stats, gamification data, and swipe stats. No data is stored in the browser beyond the
            session cookie and the site password cookie.
          </p>
        ),
      },
      {
        q: "What data is sent to the LLM?",
        a: (
          <p>
            For each job scored, the following is sent to the LLM: the first <strong>3,000 characters</strong> of the
            job description, and the <strong>full skills profile</strong> document. No personally identifiable
            information about the Applier is sent. The LLM is called server-side only — the API key is never exposed to
            the browser.
          </p>
        ),
      },
      {
        q: "Is the raw job data preserved?",
        a: (
          <p>
            Yes. The complete raw JSON response from the Active Jobs DB API is stored in the{" "}
            <code style={{ color: "var(--atari-cyan)" }}>rawJson</code> column of each job record. This means no
            information is lost during ingestion — if a field is not currently displayed in the UI, it is still
            accessible in the database.
          </p>
        ),
      },
    ],
  },
  {
    title: "Release Notes",
    icon: "📋",
    items: [
      {
        q: "v3.20 — Apr 5, 2026 · Daily Report Bug Fix & Time Change",
        a: (
          <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li><strong>Duplicate daily emails fixed</strong> — the last-sent date is now persisted to the database (<code style={{ color: "var(--atari-cyan)" }}>system_config</code> table) instead of an in-memory variable. Server restarts and hibernation wakeups no longer trigger duplicate sends.</li>
            <li><strong>Daily report rescheduled to 7 PM GST</strong> (was 9 PM). The trigger window is now 7–9 PM GST (hours 19–21).</li>
            <li><strong>Weekly report</strong> also updated to use DB persistence for the same reason.</li>
          </ul>
        ),
      },
      {
        q: "v3.19 — Apr 3, 2026 · CampaignBar Now Visible on All Pages",
        a: (
          <p>
            Root cause found — the CampaignBar was wired into <code style={{ color: "var(--atari-cyan)" }}>DashboardLayout</code> but the app uses a custom <code style={{ color: "var(--atari-cyan)" }}>AppLayout</code> component. Moved CampaignBar to AppLayout so it now appears on every page.
          </p>
        ),
      },
      {
        q: "v3.18 — Apr 3, 2026 · CampaignBar Redesign",
        a: (
          <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li><strong>Redesigned layout</strong> — shows ✅ applied today pill, animated progress bar, total applied / 1,000, and 🎯 remaining badge.</li>
            <li><strong>Sticky bar</strong> — stays visible while scrolling.</li>
            <li><strong>Clickable</strong> — links to the Performance page.</li>
            <li><strong>Auto-refreshes</strong> every 60 seconds.</li>
          </ul>
        ),
      },
      {
        q: "v3.17 — Apr 3, 2026 · Campaign Progress Bar (Initial)",
        a: (
          <p>
            Added a persistent <strong>CampaignBar</strong> component at the top of every page. Shows the 🎯 1000 Jobs label, an animated progress bar, total applied count (e.g. 19 / 1,000), and a remaining badge. Backed by a new <code style={{ color: "var(--atari-cyan)" }}>stats.campaign</code> tRPC query. Refreshes every 60 seconds.
          </p>
        ),
      },
      {
        q: "v3.16 — Apr 3, 2026 · Remove Gamification from Performance Page",
        a: (
          <p>
            Removed the Applier Stats / Gamification section (Tier, XP, Streak, Best Streak, XP progress bar) from the Performance page. The page now focuses on applied counts, pipeline health, and the 1,000-job campaign progress.
          </p>
        ),
      },
      {
        q: "v3.15 — Apr 3, 2026 · Fix Applied Job Counting",
        a: (
          <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li><strong>Fixed applied count</strong> — daily reports and performance stats now query the <code style={{ color: "var(--atari-cyan)" }}>jobs</code> table directly using <code style={{ color: "var(--atari-cyan)" }}>statusChangedAt</code> in GST timezone.</li>
            <li>Previously these functions read from the <code style={{ color: "var(--atari-cyan)" }}>applierStats</code> table which only tracked “Mark as Applied” button clicks, missing manually added jobs and swipe-approved jobs.</li>
            <li>All applied jobs (manual, swipe, button) now count correctly in the daily report, weekly stats, and performance metrics.</li>
          </ul>
        ),
      },
      {
        q: "v3.14 — Apr 2, 2026 · Weekly Report & Scheduler Fix",
        a: (
          <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li><strong>Weekly report added</strong> — sent every Friday at 9 PM GST to both Owner and Applier.</li>
            <li><strong>Daily report trigger hour corrected</strong> to 9 PM GST (was 11 PM).</li>
            <li><strong>Catch-up logic</strong> — if the server wakes after the trigger hour and no report was sent today, it sends immediately.</li>
            <li><strong>Subject lines updated</strong> to use correct dynamic format with remaining count.</li>
          </ul>
        ),
      },
      {
        q: "v3.13 — Apr 2, 2026 · Release Notes Section in FAQ",
        a: (
          <p>
            Added this Release Notes section to the FAQ page with a full timeline of all changes from v3.0 onwards. Each entry shows the date, version title, and a summary of what changed. The section is searchable and collapsible like all other FAQ sections.
          </p>
        ),
      },
      {
        q: "v3.12 — Apr 2, 2026 · Smarter Duplicate Detection",
        a: (
          <p>
            Duplicate detection now uses a two-stage check. The API's own job ID (<code style={{ color: "var(--atari-cyan)" }}>externalId</code>) is checked first — an exact match immediately skips the job. If no externalId is available, the system falls back to the existing title + company fuzzy match. This catches the same job re-posted under a slightly different title.
          </p>
        ),
      },
      {
        q: "v3.11 — Apr 2, 2026 · Duplicate Jobs Deleted (Not Tagged)",
        a: (
          <p>
            Duplicate jobs are now silently skipped during ingestion — they are never inserted into the database. Previously they were stored with an <code style={{ color: "var(--atari-cyan)" }}>isDuplicate</code> flag. 316 existing duplicate-tagged jobs were deleted from the database. The fetch History panel still shows the duplicate count for each run.
          </p>
        ),
      },
      {
        q: "v3.10 — Apr 2, 2026 · Improved API Error Logging",
        a: (
          <p>
            When the API returns an HTML page instead of JSON (e.g. due to an expired key, rate limit, or proxy issue), the error is now captured and stored with a human-readable diagnosis. The History panel shows the exact HTTP status and a plain-English explanation: <em>"Not subscribed to this API"</em>, <em>"Monthly quota exceeded"</em>, <em>"Invalid API key"</em>, or <em>"API returned HTML — likely a network/proxy issue"</em>.
          </p>
        ),
      },
      {
        q: "v3.9 — Apr 2, 2026 · Ingest & Dashboard Updates",
        a: (
          <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li><strong>UAE added to location filter</strong> — "United Arab Emirates" is now a selectable location in the Fetch Now form.</li>
            <li><strong>Multi-select location filter</strong> — multiple locations can now be selected simultaneously for a single fetch.</li>
            <li><strong>Fetch details in History & Schedules</strong> — every History and Schedule entry now shows the full filter set used for that API call.</li>
            <li><strong>Ingested column removed</strong> — all fetched jobs now land directly in Matched after AI scoring. The Ingested column no longer exists.</li>
            <li><strong>Retroactive scoring</strong> — 197 previously unscored Matched jobs were scored using the LLM.</li>
          </ul>
        ),
      },
      {
        q: "v3.8 — Apr 1, 2026 · Remove Daily Target Met Email",
        a: (
          <p>
            The "Daily Target Met!" notification email was removed. The daily and weekly report emails remain active.
          </p>
        ),
      },
      {
        q: "v3.7 — Apr 1, 2026 · Public Landing Page",
        a: (
          <p>
            The <code style={{ color: "var(--atari-cyan)" }}>/landing</code> route is now publicly accessible without requiring the password gate. Anyone can visit the 1000Jobs marketing page directly.
          </p>
        ),
      },
      {
        q: "v3.6 — Apr 1, 2026 · Marketing Landing Page",
        a: (
          <p>
            A full one-page marketing site was built at <code style={{ color: "var(--atari-cyan)" }}>/landing</code> for the "1000Jobs — Tinder for Jobs" product. It includes a hero with swipe card mockup, problem/solution sections, social proof, three pricing tiers (Free / Hustler $29/mo / Operator $99/mo), a 90-day guarantee, FAQ accordion, and a final CTA — all styled in the retro-futuristic aesthetic.
          </p>
        ),
      },
      {
        q: "v3.5 — Apr 1, 2026 · Email Overhaul (Daily + Weekly Reports)",
        a: (
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
        q: "v3.4 — Mar 31, 2026 · Daily Report Email Enhancements",
        a: (
          <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li><strong>Dynamic subject line</strong> with live applied/pipeline/remaining counts.</li>
            <li><strong>Rate projection</strong> — "At the current rate, you will reach 1,000 jobs in X weeks" based on 7-day rolling average.</li>
            <li><strong>Applied today table</strong> — all jobs applied that day listed with title, company, and location at the bottom of the email.</li>
          </ul>
        ),
      },
      {
        q: "v3.3 — Mar 30, 2026 · Email Notifications (Resend)",
        a: (
          <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li><strong>Resend SDK integrated</strong> with verified domain <code style={{ color: "var(--atari-cyan)" }}>notifications@allanabbas.com</code>.</li>
            <li><strong>Question-answered email</strong> — when any user answers a question in the Question Bank, an email is sent to the Applier (z.hewedi@gmail.com) with the question, answer, and job context.</li>
            <li><strong>Daily report email</strong> — sent nightly to both Owner and Applier with pipeline snapshot, last 7 days breakdown, and 1,000-job campaign progress bar.</li>
          </ul>
        ),
      },
      {
        q: "v3.2 — Mar 29, 2026 · Manual Job Add",
        a: (
          <p>
            A "Manual Add" button was added to the Kanban header. Owners can manually add jobs (title, company, location, URL, notes) that land directly in the Applied column. Manually added cards show a <strong style={{ color: "var(--atari-amber)" }}>MANUAL</strong> tag and an "Added by [name]" attribution line.
          </p>
        ),
      },
      {
        q: "v3.1 — Mar 28, 2026 · Matching Algorithm Upgrade",
        a: (
          <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li><strong>Structured skills profile</strong> — must-have skills, nice-to-have skills, dealbreakers, seniority, salary minimum, target industries, remote preference.</li>
            <li><strong>5-dimension scoring</strong> — Skills, Seniority, Location, Industry, Compensation scored separately then combined into a composite.</li>
            <li><strong>Dealbreaker pre-filter</strong> — jobs matching any dealbreaker keyword are auto-rejected before the LLM call.</li>
            <li><strong>Dimension score breakdown</strong> shown on SwipeView cards and Kanban job detail modal.</li>
          </ul>
        ),
      },
      {
        q: "v3.0 — Mar 27, 2026 · Auto-Reject Feature",
        a: (
          <p>
            An Auto-Reject button was added to the SwipeView header. The Owner sets a score threshold (default 30%) and previews how many jobs will be rejected. On confirmation, all Matched jobs below the threshold are moved to Rejected with an <strong style={{ color: "var(--atari-red)" }}>AUTO-REJECTED</strong> tag and removed from the swipe queue immediately.
          </p>
        ),
      },
    ],
  },
];

// ─── Accordion Item ───────────────────────────────────────────────────────────

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--atari-border)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "0.85rem 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: isOpen ? "var(--atari-amber)" : "var(--atari-white)",
            letterSpacing: "0.04em",
            lineHeight: 1.5,
            flex: 1,
          }}
        >
          {item.q}
        </span>
        <span style={{ color: "var(--atari-amber)", flexShrink: 0, marginTop: "2px" }}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {isOpen && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            color: "var(--atari-gray)",
            lineHeight: 1.8,
            paddingBottom: "1rem",
            paddingRight: "1.5rem",
          }}
        >
          {item.a}
        </div>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function FAQSectionBlock({ section }: { section: FAQSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        border: "1px solid var(--atari-border)",
        background: "var(--atari-surface)",
      }}
    >
      {/* Section header */}
      <button
        onClick={() => setSectionOpen((s) => !s)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          background: "transparent",
          border: "none",
          borderBottom: sectionOpen ? "2px solid var(--atari-red)" : "none",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "0.7rem",
            color: "var(--atari-amber)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {section.icon} {section.title}
        </span>
        <span style={{ color: "var(--atari-border)" }}>
          {sectionOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {sectionOpen && (
        <div style={{ padding: "0 1rem" }}>
          {section.items.map((item, i) => (
            <AccordionItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FAQ() {
  const [search, setSearch] = useState("");

  const filtered: FAQSection[] = search.trim()
    ? FAQ_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.q.toLowerCase().includes(search.toLowerCase()) ||
            (typeof item.a === "string" && item.a.toLowerCase().includes(search.toLowerCase()))
        ),
      })).filter((s) => s.items.length > 0)
    : FAQ_SECTIONS;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--atari-black)",
        padding: "1.5rem 1rem 3rem",
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "clamp(0.8rem, 3vw, 1.1rem)",
            color: "var(--atari-amber)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "0.25rem",
          }}
        >
          ▶ FREQUENTLY ASKED QUESTIONS
        </h1>
        <div style={{ height: 2, background: "var(--atari-red)", marginBottom: "0.75rem" }} />
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--atari-gray)",
            lineHeight: 1.7,
          }}
        >
          Everything you need to know about how JobPilot works — from job ingestion and AI matching to the Applier
          workflow and gamification system.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--atari-border)" }}>▶</span>
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: "var(--atari-surface)",
            border: "1px solid var(--atari-border)",
            color: "var(--atari-white)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            padding: "0.5rem 0.75rem",
            outline: "none",
            letterSpacing: "0.04em",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              background: "transparent",
              border: "1px solid var(--atari-border)",
              color: "var(--atari-gray)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              padding: "0.4rem 0.6rem",
              cursor: "pointer",
            }}
          >
            CLR
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {search && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--atari-border)", marginBottom: "1rem" }}>
          {filtered.reduce((acc, s) => acc + s.items.length, 0)} result(s) for "{search}"
        </p>
      )}

      {/* Sections */}
      {filtered.length === 0 ? (
        <div
          style={{
            border: "1px solid var(--atari-border)",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--atari-border)",
          }}
        >
          NO RESULTS FOUND
        </div>
      ) : (
        filtered.map((section, i) => <FAQSectionBlock key={i} section={section} />)
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "2rem",
          borderTop: "1px solid var(--atari-border)",
          paddingTop: "1rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          color: "var(--atari-border)",
          textAlign: "center",
          letterSpacing: "0.06em",
        }}
      >
        JOBPILOT FAQ — ALL SYSTEMS DOCUMENTED
      </div>
    </div>
  );
}
