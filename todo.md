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
