# JobPilot TODO

## Database Schema
- [x] jobs table (id, title, company, description, source, location, url, matchScore, status, isDuplicate, hasEmail, tags, rawJson, createdAt, updatedAt)
- [x] skillsProfile table (id, content, updatedAt)
- [x] questionBank table (id, jobId, question, answer, askedBy, createdAt, answeredAt)
- [x] apiUsage table (id, month, callCount, updatedAt)
- [x] applierStats table (id, date, appliedCount, targetCount)
- [x] applierGamification table (id, userId, totalXp, currentStreak, longestStreak, lastActiveDate)

## Authentication & Roles
- [x] Owner role (admin) — full access
- [x] Applier role (user) — restricted to To Apply column only
- [x] Role-based route guards on frontend
- [x] Role-based procedure guards on backend (adminProcedure + protectedProcedure)

## API Integration (Owner)
- [x] Fantastic Jobs API integration via RapidAPI key
- [x] Ingestion form: job title, location, industry, work arrangement, experience level, ATS source, agency exclusion, visa sponsorship, LinkedIn exclusion
- [x] Hardcoded limit=100, include_ai=true defaults
- [x] Monthly API usage counter (persistent, resets monthly)
- [x] Deduplication logic: Company Name + Job Title comparison against DB
- [x] DUPLICATED tag on job cards when duplicate detected

## Skills & Matching
- [x] Skills document upload (text/markdown input or .md file)
- [x] LLM-powered semantic match scoring (0–100%) via invokeLLM
- [x] Match score displayed on job cards with color-coded bar
- [x] Auto-trigger scoring on ingestion
- [x] Re-score All button to re-run LLM against all existing jobs

## Kanban Board (Owner)
- [x] Five columns: Job Ingested, Matched, To Apply, Applied, Rejected
- [x] Drag-and-drop job cards between columns (Owner only)
- [x] Mobile swipeable columns (scroll-snap)
- [x] Job cards: title, company, match score, ATS tag, Email Outreach tag, DUPLICATED tag
- [x] Email Outreach tag: parse job description for email addresses
- [x] Owner can drag from Matched → To Apply to assign to Applier
- [x] Owner can drag to Rejected
- [x] Job Detail Modal with full description, apply link, quick actions

## Applier Workflow
- [x] Applier sees only To Apply column (My Queue page)
- [x] Click job card to view full description, link, tags (via modal)
- [x] Mark as Applied button → moves card to Applied + awards XP
- [x] Add Question input on job card → logs to Question Bank
- [x] Gamification: streak counter, daily progress badge, XP points for applications

## Question Bank
- [x] Question Bank UI page (Owner + Applier view)
- [x] Owner can type and submit answers inline
- [x] Questions show job title, company, date asked
- [x] Notification to Owner when new question submitted

## Performance Tracking
- [x] Daily progress bar: Today's Progress X/Y Applied
- [x] Ramp-up schedule: Days 1-5 = 10/day, Week 2 = 20/day, Week 3 = 40/day, Week 4+ = 80/day
- [x] Auto-calculate current day's target based on ramp-up schedule
- [x] Notification to Owner when daily application target is met
- [x] Recent history list with per-day progress bars

## Notifications
- [x] Notify Owner when Applier submits a question
- [x] Notify Owner when daily application target is met

## Gamification (Applier)
- [x] XP points per application submitted (10 XP each)
- [x] Daily streak counter (consecutive active days)
- [x] Tier system: Rookie (0 XP), Grinder (100 XP), Machine (500 XP), Legend (2000 XP)
- [x] Longest streak tracking
- [x] XP progress bar to next tier
- [x] Gamification mini-stats in Applier queue header

## UI / Brutalist Design
- [x] Stark black background (oklch(0.04 0 0))
- [x] White condensed sans-serif typography (Barlow Condensed)
- [x] Vivid red full-width horizontal divider line (oklch(0.5 0.22 27))
- [x] Minimalist, high-contrast layout
- [x] Custom sidebar navigation (AppLayout)
- [x] Mobile-responsive Kanban with swipeable columns (scroll-snap)
- [x] Brutalist card design: sharp corners (radius: 0), thick borders
- [x] Barlow Condensed + Barlow + Share Tech Mono font stack
- [x] Custom scrollbar styling
- [x] Score bars with color-coded tiers (red/yellow/green)

## Tests
- [x] Vitest: auth procedures (me, logout)
- [x] Vitest: job procedures (kanban, ingest, batchIngest, moveStatus, markApplied)
- [x] Vitest: skills procedures (get, upsert, rescoreAll)
- [x] Vitest: question procedures (all, ask, answer)
- [x] Vitest: stats procedures (today, recent, gamification)
- [x] Vitest: ingestion procedures (getUsage, access control)
- [x] 24 tests passing

## API Update (Active Jobs DB)
- [x] Update RAPIDAPI_KEY secret to correct key (af953bfb6emsh...)
- [x] Update API host to active-jobs-db.p.rapidapi.com
- [x] Update all parameter names to match Active Jobs DB API spec
- [x] Add new filter fields: title_filter, advanced_title_filter, description_filter, advanced_description_filter, organization_filter, organization_exclusion_filter, remote, source_exclusion, ai_employment_type_filter, ai_taxonomies_a_primary_filter, ai_taxonomies_a_exclusion_filter, ai_has_salary, include_li, li_organization_slug_filter, li_organization_slug_exclusion_filter, li_industry_filter, li_organization_employees_lte, li_organization_employees_gte, offset (pagination)
- [x] Update Ingestion UI with all new filter fields
- [x] Update tests for new API configuration

## v1.2 Feature Update
- [x] Rename "Kanban Board" nav item to "Dashboard"
- [x] DB: fetch_schedules table (name, filters JSON, endpoint, interval, next_run, enabled)
- [x] DB: fetch_history table (schedule_id, ran_at, jobs_fetched, jobs_remaining, requests_remaining, status, error)
- [x] Backend: read x-ratelimit-jobs-remaining and x-ratelimit-requests-remaining headers from API response
- [x] Backend: store quota info in api_usage table (jobs_remaining, requests_remaining, jobs_limit, requests_limit)
- [x] Backend: fetchSchedules CRUD (create, list, toggle, delete, runNow)
- [x] Backend: fetchHistory list per schedule
- [x] Backend: server-side cron runner for scheduled fetches
- [x] Ingestion UI: endpoint selector dropdown (7d / 24h)
- [x] Ingestion UI: all filter fields as proper dropdowns per API spec
- [x] Ingestion UI: date_filter field
- [x] Ingestion UI: schedule builder (name, interval: hourly/daily/weekly, time)
- [x] Ingestion UI: fetch history panel with results count
- [x] Ingestion UI: quota warning banner (jobs remaining / requests remaining)
- [x] Atari retro gaming design system (scanlines, pixel font, green/amber phosphor palette, CRT glow)
- [x] Apply retro theme to all pages: AppLayout, KanbanBoard/Dashboard, Skills, QuestionBank, Performance, ApplierView

## v1.2 Gap Fixes
- [x] Update Skills, QuestionBank, Performance, ApplierView to use Atari CSS variables
- [x] Verify cron runner bootstrap is wired in server startup

## Bug Fixes
- [x] Fix Dashboard jobs query error: created missing jobs, skills_profile, question_bank tables; fixed TiDB-incompatible JSON default ('[]' → NULL)

## Password Gate
- [x] Store SITE_PASSWORD as env secret ("JobPortal")
- [x] Add tRPC publicProcedure: gate.check (reads cookie) and gate.unlock (validates password, sets 30-day cookie)
- [x] Build PasswordGate.tsx page with Atari retro styling
- [x] Wrap all routes in App.tsx with a GateGuard component that redirects to /gate if not unlocked
- [x] Add vitest for gate.unlock procedure (5 tests passing)

## UX Fix: Remove Landing Page
- [x] Redirect / directly to /dashboard (skip Home page entirely)
- [x] PasswordGate onUnlocked navigates to /dashboard instead of re-rendering home

## Bug Fix: Fetch Jobs "No values to set"
- [x] Diagnose root cause of "No values to set" error in fetchJobs / ingest procedure
- [x] Fix the bug: updateApiQuota now strips undefined fields before Drizzle update; per-job loop wrapped in try/catch; tags uses null instead of [] for TiDB compatibility

## v1.3 UX Improvements
- [x] Add "expired" status to jobs table enum (DB migration)
- [x] Add "Expired Jobs" column to Dashboard Kanban board (6th column)
- [x] Add "Job no longer available" button on To Apply cards → moves to Expired Jobs
- [x] Add "Job Applied" button on To Apply cards → moves to Applied
- [x] Autocomplete/dropdown for Location filter in Ingest Jobs (country/city suggestions)
- [x] Dropdowns for all enum-style API parameters (remote, employment type, industry, etc.)
- [x] Grey out all Ingest Jobs form fields while a fetch is in progress
- [x] Add durationMs column to fetch_history table (DB migration)
- [x] Show fetch duration in Fetch History panel
- [x] Add "Convert to Schedule" button on ad-hoc fetch history rows

## v1.4 API Error Logging
- [x] Add errorDetail column to fetch_history table (TEXT, nullable) for full error info
- [x] Harden server fetchJobs: detect HTML responses, capture HTTP status + raw response snippet + error type
- [x] Store structured error JSON in errorDetail (status, type, message, rawSnippet, url, timestamp)
- [x] Add API Error Log panel to Ingestion UI: show failed history rows with expandable error detail
- [x] Show inline error badge on failed history rows with HTTP status code
- [x] Add "Copy Error" button for easy sharing/debugging
- [x] Surface actionable error messages: 403 = not subscribed, 429 = quota exceeded, HTML = proxy/network issue

## v1.5 Job Card Display
- [x] Update job cards: show match score as numerical value only (remove progress bar)
- [x] Add job location display on job cards

## v1.6 Bug Fixes
- [x] Fix location extraction: locations_derived is array of strings, not array of objects
- [x] Re-fetch jobs to populate location field with corrected parsing logic (user action required)

## v1.7 Swiping Tab (Tinder-style)
- [x] Build SwipeView.tsx page with card stack showing Matched jobs only
- [x] Touch-optimized drag gestures: swipe right → To Apply, swipe left → Rejected
- [x] Visual feedback during drag: green glow + "TO APPLY" label on right, red glow + "REJECTED" label on left
- [x] Card shows: title, company, location, match score, description excerpt, tags
- [x] Keyboard support: arrow keys for desktop
- [x] Button controls: ✗ (reject) and ✓ (apply) buttons below card
- [x] Counter showing remaining matched jobs
- [x] Empty state when all matched jobs have been swiped
- [x] Register /swiping route in App.tsx
- [x] Add "Swiping" nav item in AppLayout sidebar

## v1.8 Swiping Enhancements
- [x] Sort matched jobs by matchScore DESC in jobs.byStatus procedure
- [x] Expand SwipeView card to show all available job fields: full description, applyUrl, source/ATS tag, email tag, duplicate tag, ingestedAt
- [x] Show job location prominently on swipe card
- [x] Add swipe_stats table: dateKey, approved, rejected, total (for daily/weekly stats)
- [x] Backend: recordSwipe mutation (increments approved or rejected count for today)
- [x] Backend: getSwipeStats query (returns today + last 7 days)
- [x] SwipeView: stats panel showing today's swiped/approved/rejected counts
- [x] SwipeView: weekly stats bar or summary (total this week, approval rate)

## v1.9 FAQ Page
- [x] Build FAQ.tsx page with all sections: overview, roles, job flow, matching algorithm, API/ingestion, schedules, swiping, question bank, gamification, performance, password gate
- [x] Add /faq route in App.tsx
- [x] Add FAQ nav item to both ownerNav and applierNav in AppLayout.tsx

## v2.0 SwipeView UX
- [x] Add Undo button that restores the last swiped card and reverses its status change
- [x] Make job title larger and more prominent on swipe card
- [x] Make company name larger and more prominent on swipe card

## v2.1 Bug Fixes
- [x] Fix "Incorrect password" mutation error on /dashboard page — investigated: this is expected behavior (wrong password entered by user), gate logic is correct, no code change needed

## v2.2 Dwell Timer & Kanban Sort
- [x] Add statusChangedAt column to jobs table in schema.ts
- [x] Generate and apply migration SQL
- [x] Update updateJobStatus db helper to set statusChangedAt = now()
- [x] Compute dwellDays in kanban query: for matched = days since postedAt (ingestedAt fallback), for to_apply = days since statusChangedAt
- [x] Show dwell badge on Kanban cards (Matched and To Apply columns)
- [x] Add sort controls to dashboard Kanban: sort by Match Score, Dwell (asc/desc)

## v2.3 SwipeView Card Redesign
- [x] Completely rewrite swipe card layout to eliminate all text overlap

## v2.4 SwipeView Background Card Fix
- [x] Strip all text from background (next job) card — show only a minimal silhouette with score badge, no title/company/location text bleeding through
- [x] Ensure foreground card clips its content with overflow:hidden so nothing escapes the card boundary

## v2.5 Applier Reject Permission
- [x] Add applierReject procedure in routers.ts — protectedProcedure (any logged-in user), moves job from to_apply → rejected
- [x] Add "CAN'T APPLY" reject button to each job card in ApplierView
- [x] Show confirmation dialog before rejecting to prevent accidental rejections
- [x] Add test for applierReject procedure

## v2.6 Question Bank Open Access
- [x] Change questions.answer procedure from adminProcedure to protectedProcedure so all users can answer
- [x] Update QuestionBank.tsx UI to show the answer input/button for all authenticated users (not just admins)
- [x] Update tests to reflect that applier can now answer questions

## v2.7 Question Bank Standalone Form
- [x] Add "New Question" form directly on the Question Bank page (question text + optional job title/company fields)
- [x] Form available to all authenticated users (both Owner and Applier)
- [x] Submit via questions.ask procedure, clear form on success

## v2.8 Owner "View as Applier" Toggle
- [x] Create ViewModeContext (viewMode: "owner" | "applier", toggleViewMode) in client/src/contexts/
- [x] Wrap App in ViewModeProvider
- [x] Add toggle button in AppLayout sidebar/header (only visible to admin users) — shows "VIEW AS APPLIER" / "BACK TO OWNER VIEW"
- [x] Wire viewMode into AppLayout nav: when viewMode="applier", show applier nav items and hide owner-only items
- [x] Wire viewMode into routing: when viewMode="applier", redirect owner-only pages to applier home
- [x] Show a persistent green banner at top of screen when in "applier view" mode so owner always knows they're in preview mode

## v2.9 SwipeView Full Description
- [x] Remove showFullDesc state and Read More / Show Less toggle from SwipeView
- [x] Always render the full job description text in the scrollable description zone

## v3.0 Auto-Reject Feature
- [x] Add autoRejected boolean column to jobs table in schema.ts, generate and apply migration
- [x] Add autoReject bulk procedure in routers.ts: accepts threshold (0-100), returns count of jobs to be rejected, then on confirm moves all matched jobs below threshold to rejected with autoRejected=true
- [x] Add Auto-Reject button to SwipeView header
- [x] Show threshold input dialog with slider (default 30%)
- [x] Show preview: "X jobs will be auto-rejected" before confirming
- [x] Require explicit confirmation before executing bulk rejection
- [x] Remove auto-rejected jobs from the swipe queue immediately after confirmation
- [x] Show AUTO-REJECTED tag (red) on Kanban cards in the rejected column

## v3.1 Matching Algorithm Upgrade
- [x] Migrate skills_profile: add structured columns (mustHaveSkills, niceToHaveSkills, dealbreakers, seniority, salaryMin, targetIndustries, remotePreference) alongside legacy content field
- [x] Add dimension score columns to jobs table: scoreSkills, scoreSeniority, scoreLocation, scoreIndustry, scoreCompensation
- [x] Apply DB migrations for both tables
- [x] Rewrite scoreJobWithLLM: pass full description (no 3000-char cap), title+company as explicit fields, return 5 dimension scores + composite
- [x] Add negative keyword pre-filter: check dealbreakers before LLM call, auto-reject if matched
- [x] Rebuild Skills Profile page: structured form with all fields, weights slider, negative keywords list
- [x] Show dimension score breakdown on SwipeView card (mini bar chart or 5 labelled scores)
- [x] Show dimension score breakdown on Kanban job detail modal
- [x] Update rescoreAll to use new structured profile
- [x] 66 tests passing (all existing tests verified)

## v3.2 Manual Job Add
- [x] Add manuallyAdded boolean and addedBy text columns to jobs table in schema.ts
- [x] Generate and apply migration SQL
- [x] Add jobs.manualAdd procedure: protectedProcedure, accepts title/company/location/url/notes, inserts with status=applied, manuallyAdded=true, addedBy=ctx.user.name
- [x] Add "Manual Add" button to KanbanBoard header
- [x] Build modal form: title (required), company (required), location, job URL, notes
- [x] Show "MANUAL" tag (amber) on Kanban cards for manually added jobs
- [x] Show "Added by [name]" attribution line on manually added cards
- [x] 75 tests passing (4 new manualAdd tests)

## v3.3 Notification Updates
- [x] Store RESEND_API_KEY secret
- [x] Install resend npm package
- [x] Create server/_core/email.ts helper with sendEmail(to, subject, html) using Resend
- [x] Update questions.answer: send email to z.hewedi@gmail.com (Applier) when question is answered
- [x] Add daily report cron at 11 PM GST (19:00 UTC): query matched/to_apply/applied counts, last 7 days applied stats, compute 1000-job countdown
- [x] Send daily report email to both Owner (via notifyOwner) and Applier (z.hewedi@gmail.com via Resend)
- [x] Add tests for email helper and daily report cron logic

## v3.3 Email Notifications (Resend)
- [x] Install Resend SDK and create server/_core/email.ts with sendEmail helper
- [x] Store RESEND_API_KEY as environment secret
- [x] Set from address to notifications@allanabbas.com (verified domain)
- [x] Add APPLIER_EMAIL constant (z.hewedi@gmail.com)
- [x] Build buildQuestionAnsweredEmail() HTML template (retro-futuristic style)
- [x] Build buildDailyReportEmail() HTML template with pipeline stats + 1,000-job countdown
- [x] Add getQuestionById() helper to db.ts
- [x] Add getPipelineStats() helper to db.ts (matched/toApply/applied counts)
- [x] Add getAppliedTodayCount() helper to db.ts
- [x] Wire questions.answer mutation to send email to Applier on answer
- [x] Add daily report cron (checks every 15 min, fires at 11 PM GST)
- [x] Daily report sent to both Owner (tedunt@gmail.com) and Applier (z.hewedi@gmail.com)
- [x] Add notifications.sendTestDailyReport tRPC mutation (Owner only, for on-demand testing)
- [x] Add email mock to test suite — 75 tests still passing

## v3.6 Marketing Landing Page
- [x] Create /landing route in App.tsx for the 1000Jobs marketing page
- [x] Build full one-page landing with hero, problem, solution, how it works, social proof, pricing, guarantee, FAQ, final CTA
- [x] Implement dark retro-futuristic design with swipe card animation in hero
- [x] Build three pricing tier cards (Free / Hustler / Operator) with feature comparison table
- [x] Add FAQ accordion section
- [x] Register /landing route in App.tsx

## v3.7 Public Landing Page
- [x] Exempt /landing from GateGuard so it is accessible without password

## v3.8 Remove Daily Target Met Email
- [x] Delete the "Daily Target Met!" email trigger from the codebase

## v3.9 Ingest & Dashboard Updates
- [x] Add "United Arab Emirates" to location filter in Fetch Now page
- [x] Enable multi-select for location filter in Fetch Now page
- [x] Show fetch details (query, location, keywords, count) in History entries
- [x] Log failed API calls with error reason in History
- [x] Show fetch details in Schedules entries
- [x] Remove "Ingested" Kanban column — auto-score jobs on ingest and place in "Matched"
- [x] Migrate existing "ingested" jobs: score them and move to "matched"
- [x] Retroactively score all unscored "matched" jobs

## v3.10 Improve API Error Logging
- [x] Capture raw response body before JSON.parse in fetch handler
- [x] When JSON parse fails, log the first 200 chars of HTML response in History error message
- [x] Add diagnosis hint (e.g., "API returned HTML — likely auth error, rate limit, or expired key")

## v3.11 Skip Duplicate Job Insertion
- [x] Update ingest loop: when isDuplicate is true, skip insertJob and continue to next job
- [x] Keep jobsDuplicate counter increment for History reporting
- [x] Optionally: delete all existing jobs where isDuplicate = true from the database

## v3.12 Smarter Duplicate Detection
- [x] Update checkDuplicate in db.ts to accept optional externalId and check it first
- [x] If externalId matches an existing job, return true (duplicate) immediately
- [x] Fall back to title+company match if no externalId provided or no externalId match
- [x] Pass externalId from the ingest loop to checkDuplicate in routers.ts
- [x] Update tests to cover externalId-based deduplication

## v3.13 Release Notes in FAQ
- [x] Add Release Notes section to FAQ.tsx with full timeline of all versions (v3.0–v3.12)
- [x] Update Release Notes with every future change

## v3.14 Fix Daily Report Scheduler
- [x] Fix trigger hour from 23 (11 PM GST) to 21 (9 PM GST)
- [x] Add catch-up logic: if server wakes after 9 PM and no report sent today, send immediately
- [x] Wire startWeeklyReportScheduler into server startup (Fridays 9 PM GST)

## v3.15 Fix Applied Today Count Bug
- [x] Fix getAppliedTodayCount: now queries jobs table directly using DATE(CONVERT_TZ(statusChangedAt)) in GST
- [x] Fix getApplierStatsRange: now queries jobs table directly grouped by GST date
- [x] Normalize TiDB Date object returns to YYYY-MM-DD string
- [x] Verified: today's 6 manually added jobs now count correctly (confirmed 6 in DB)

## v3.17 Campaign Top Bar
- [x] Add stats.campaign publicProcedure query to routers.ts (uses existing getPipelineStats)
- [x] Build CampaignBar component (top bar with progress bar, applied count, remaining badge)
- [x] Wire CampaignBar into DashboardLayout so it appears on all pages for all users

## v3.18 Fix CampaignBar Visibility
- [x] Fixed: server needed restart to pick up new stats.campaign tRPC procedure
- [x] Add "jobs applied today" count to the bar
- [x] Add "jobs remaining to hit 1000" label to the bar
- [x] Make bar sticky so it stays visible while scrolling
- [x] Bar is now clickable and links to Performance page

## v3.19 CampaignBar Debug
- [x] Root cause: CampaignBar was added to DashboardLayout but app uses AppLayout — moved to AppLayout

## v3.20 Fix Duplicate Daily Report Emails
- [x] Diagnose why daily report fires multiple times per day
- [x] Fix deduplication logic so it sends exactly once per day at 7 PM GST (persist last-sent date to system_config DB table)
- [x] Update scheduled time from 9 PM to 7 PM GST as requested
- [x] Apply same DB persistence fix to weekly report scheduler
- [x] Update Release Notes in FAQ (v3.13–v3.20)

## v3.21 LinkedIn Jobs API Integration
- [x] Add "linkedin" as a source type in the backend fetch logic (new API host: linkedin-job-search-api.p.rapidapi.com)
- [x] Support both active-jb-24h and active-jb-7d LinkedIn endpoints
- [x] Map LinkedIn API fields to existing job schema (id→externalId, title, organization→company, locations_derived→location, description_text→description, url→applyUrl, source→source, linkedin_id for dedup)
- [x] Add separate apiUsage tracking for LinkedIn (month key prefixed with "li-")
- [x] Add "LinkedIn" source selector to Ingestion UI (toggle between Fantastic Jobs / LinkedIn)
- [x] Add LinkedIn-specific filter fields: seniority, directApply, orgSlugFilter
- [x] Show LinkedIn source tag on job cards (LINKEDIN badge via source field)
- [x] Support LinkedIn in fetch schedules (active-jb-7d / active-jb-24h endpoints)
- [x] Update FAQ Release Notes with v3.21
- [x] DB migrations applied: fetch_schedules endpoint enum extended, api_usage monthKey length extended

## v3.22 LinkedIn Badge, Per-Source Stats, Fetch History Source
- [x] Add blue LI badge on Kanban job cards when source contains "linkedin"
- [x] Add blue LI badge on Swipe job cards when source contains "linkedin"
- [x] Add per-source applied jobs breakdown chart on Performance page (LinkedIn vs Fantastic Jobs)
- [x] Add backend query for per-source applied counts (getAppliedBySource in db.ts)
- [x] Add API source indicator (LINKEDIN / EXTERNAL badge) in Ingest Jobs fetch history rows
- [x] Source derived from endpoint field in fetch_history (no schema change needed)

## v3.23 Fix /ingest 504 Gateway Timeout
- [x] Diagnose root cause: 504 Gateway Timeout from AWS load balancer after 300s (100 jobs × ~3s LLM = 300s > 5min limit)
- [x] Fix: decouple LLM scoring from fetch loop — insert all jobs immediately with score=0, then score asynchronously via setImmediate background task
- [x] Background scorer fetches each inserted job by ID and calls updateJobMatchScore after LLM result
- [x] HTTP response now returns in <10s regardless of batch size
- [x] Verify with TypeScript check (0 errors) and tests (75 passing)

## v3.24 Release Notes Page & Week 1 Email Draft
- [x] Extract Release Notes content from FAQ.tsx
- [x] Create standalone public ReleaseNotes.tsx page (visible without login, 24 entries v3.0–v3.23)
- [x] Add /release-notes route in App.tsx (outside auth guard, in PUBLIC_ROUTES)
- [x] Add Release Notes link in AppLayout sidebar nav (both owner and applier)
- [x] Keep Release Notes section in FAQ as link (not removed)
- [x] Draft Week 1 recap + Week 2 plan email with live metrics (total applied, avg/day, source breakdown, daily breakdown)
- [x] Create EmailDraft.tsx page (owner-only) with stats cards and copy-to-clipboard button
- [x] Add /email-draft route in App.tsx and Email Draft nav item in owner sidebar

## v3.26 Top Progress Bar Notification
- [x] Add backend tRPC query: stats.scoringStatus — returns { pendingScoring: number, isIngesting: boolean }
- [x] Add in-memory _pendingScoringCount flag on server (increments per inserted job, decrements per scored job)
- [x] Build TopProgressBar.tsx component: animated bar + label pill, color-coded (amber/blue/purple)
- [x] Wire TopProgressBar into AppLayout above CampaignBar
- [x] Auto-poll every 3s while active, every 10s when idle
- [x] Show distinct states: "INGESTING JOBS...", "SCORING X JOBS...", "INGESTING + SCORING..."
- [x] TypeScript: 0 errors, Tests: 75 passing

## v3.27 Auto-Reject Dealbreaker Jobs
- [x] Fix background scoring: when dealBreakerMatched is set, update job status to "rejected" instead of leaving it as "matched" with score=0
- [x] Fix rescoreAll procedure: same auto-reject logic applied
- [x] Retroactively verified: 0 matched jobs with score=0 (DB was already clean from bulk auto-reject)
- [x] All 121 dealbreaker jobs correctly in Rejected column, 0 in Matched with score=0
- [x] TypeScript: 0 errors, Tests: 75 passing

## v3.28 Cost Optimizations
- [x] #2: Removed notifyOwner call when a question is answered (applier email still fires)
- [x] #3: Slowed getUsage poll in AppLayout from 30s to 5 minutes (10× fewer DB queries/hour)
- [x] #4: Added 5-min in-memory cache for getSkillsProfile() in db.ts; invalidated on upsert
- [x] #5: rescoreAll now skips already-scored jobs by default; pass forceRescore:true to override
- [x] Updated Skills.tsx toast to show skip count; updated tests to pass forceRescore:true
- [x] TypeScript: 0 errors, Tests: 75 passing

## v3.29 Location Normalization Fix
- [x] Add normalizeLocation() helper: "Dubai, Dubai, United Arab Emirates" → "Dubai, UAE", "New York, New York, United States" → "New York, US", etc.
- [x] Apply normalizeLocation() to job location before passing to LLM scoring prompt
- [x] Apply normalizeLocation() to profile location context in the LLM prompt
- [x] Export normalizeLocation() for unit testing
- [x] Added 6 unit tests for normalizeLocation (81 tests total passing)
- [x] TypeScript: 0 errors

## v3.30 Minimum Seniority Post-Filter
- [x] Add seniority post-filter in background scoring: if scoreSeniority < 50 after LLM, auto-reject
- [x] Apply same filter in rescoreAll procedure
- [x] Retroactively rejected 114 existing matched jobs with scoreSeniority < 50
- [x] Added unit test for seniority post-filter (82 tests total passing)
- [x] TypeScript: 0 errors (watcher errors are stale)

## v3.31 Pipeline Improvements
- [x] Analyze 1,505 ingested jobs + swipe patterns to produce daily ingestion schedule recommendations
- [x] Add 3 new dealbreakers: co-founder, sales director, account executive
- [x] Raise matched threshold from 40 → 55 (auto-reject composite score < 55)
- [x] Retroactively reject 108 matched jobs with score 1-54
- [x] Retroactively reject 1 matched job with new dealbreaker (co-founder)
- [x] Fix empty-location scoring: pass "Remote (no location specified)" to LLM instead of omitting location
- [x] Update Release Notes page with v3.24 through v3.31 entries

## v3.32 Applier Dashboard + Blocked Column
- [x] Add 'blocked' to jobs.status enum in drizzle/schema.ts
- [x] Generate and apply DB migration for new status value
- [x] Allow Applier role to call moveStatus procedure (not admin-only)
- [x] Add 'blocked' column to kanban board beside 'to_apply'
- [x] Applier can drag jobs: to_apply ↔ blocked, to_apply → applied/expired
- [x] Unlock /dashboard route for Applier role in App.tsx
- [x] Update sidebar to show Dashboard nav item for Applier

## v3.33 Blocked Reason + Daily Report Blocked Count
- [x] Add blockedReason varchar column to jobs table in drizzle/schema.ts
- [x] Generate and apply DB migration for blockedReason column
- [x] Extend moveStatus procedure to accept optional blockedReason, save to DB
- [x] Update getPipelineStats to include blocked count
- [x] Update daily report email to show blocked count
- [x] Kanban: show reason input modal when clicking BLOCKED quick-action button
- [x] Job Detail Modal: show reason input when clicking "Can't Apply"
- [x] Display blockedReason on Blocked column cards
- [x] Update release notes with v3.33 entry

## v3.39 Resume Generation Full Rebuild
- [x] Store base profile in resume_config DB table (Document Vault)
- [x] Store prompt template and CSS in resume_config DB table
- [x] Create resume-generator.ts with invokeLLM + manus-md-to-pdf conversion
- [x] Zero-hallucination + keyword-optimization instructions in prompt
- [x] Add tRPC endpoints: generateResume, resumeStatus, resumeLog, resumeConfig, updateResumeConfig
- [x] Add /api/resume/download/:jobId express route for PDF serving
- [x] Add Generate Resume button to My Queue with 3 states (Generate/Generating/Download)
- [x] Add Generate Resume button to Dashboard To Apply cards
- [x] Create Resume Generation page with Resume Log sub-tab
- [x] Create Resume Generation page with Configuration sub-tab
- [x] Add Resume Generation nav item to sidebar for all users
- [x] Log all generation requests in resume_generation_log table
- [x] Update release notes with v3.39 entry
