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
