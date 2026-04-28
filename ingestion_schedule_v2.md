# API Ingestion Schedule v2 — Proposed Plan

**Effective:** Tuesday, April 22, 2026 | **Window:** 6:00–9:00 AM GST (Mon–Fri) | **Stagger:** 10 min between calls

---

## 1. Quota Budget

| Metric | LinkedIn Job Search API | Active Jobs DB |
|--------|------------------------|----------------|
| Monthly Quota | 10,000 jobs | 5,000 jobs |
| Current Usage | 9,024 (90.24%) | 3,181 (63.62%) |
| Hard Stop (98%) | 9,800 | 4,900 |
| Safe Credits Remaining | **776 jobs** | **1,719 jobs** |
| Reset Date | May 6, 2026 | Apr 30, 2026 |
| Weekdays Remaining | 10 (Apr 22 → May 5) | 6 (Apr 22 → Apr 29) |
| **Daily Cap** | **77 jobs/day** | **286 jobs/day** |

**Hard Stop Rule:** If `x-ratelimit-jobs-remaining` header drops below 2% of quota (LinkedIn < 200, Active Jobs < 100), all calls for that API are halted until the next billing cycle.

---

## 2. Search Queries — Derived from Success Modeling

Analysis of 351 Applied jobs reveals the following profile:

- **Top title clusters:** Product Manager (180), Operations (94), Director (49), Head of (23), COO (6), Business (18)
- **Top taxonomies:** Management & Leadership (207), Technology (160), Data & Analytics (133), Finance (44)
- **Top geographies:** United States (74), Dubai/UAE (66), Canada (15), Remote (50+)
- **Profile baseline:** COO / Founder / Fintech / AI / Operations

### Query Set (8 queries — identical across both APIs)

| # | Query Name | Title Filter | Location | Remote | Industry/Description Filter | Priority |
|---|-----------|-------------|----------|--------|----------------------------|----------|
| Q1 | COO & Ops Director — Remote | `(COO \| "Chief Operating Officer" \| "Director of Operations" \| "VP Operations" \| "Head of Operations")` | — | `true` | `(fintech \| proptech \| AI \| startup)` | HIGH |
| Q2 | Product Manager — Remote | `("Product Manager" \| "Senior Product Manager" \| "Head of Product" \| "Staff Product Manager")` | — | `true` | `(fintech \| proptech \| AI \| blockchain)` | HIGH |
| Q3 | Business Ops — UAE | `("Business Operations" \| "Operations Manager" \| "Program Manager" \| "Entrepreneur in Residence")` | `UAE,Dubai,Abu Dhabi` | — | — | HIGH |
| Q4 | Product & Strategy — UAE | `("Product Manager" \| "Product Owner" \| "Strategy" \| "Digital Transformation")` | `UAE,Dubai` | — | `(fintech \| proptech \| AI)` | MED |
| Q5 | COO & Ops Director — USA | `(COO \| "Director of Operations" \| "VP Operations" \| "Head of Operations")` | `United States` | — | — | MED |
| Q6 | Product Manager — USA | `("Senior Product Manager" \| "Product Manager" \| "Head of Product")` | `United States` | — | `(fintech \| AI \| proptech)` | MED |
| Q7 | Business Ops — Canada | `("Business Operations" \| "Operations Manager" \| "COO" \| "Program Manager")` | `Canada` | — | — | MED |
| Q8 | People Ops & Growth — Remote | `("People Operations" \| "Head of People" \| "Growth Manager" \| "Business Development")` | — | `true` | `(fintech \| proptech \| AI \| startup)` | LOW |

All queries use the **7-day freshness** endpoint (`active-jb-7d` for LinkedIn, `active-ats-7d` for Active Jobs DB).

---

## 3. Daily Budget Allocation

### LinkedIn (77 jobs/day — TIGHT budget)

LinkedIn is the constrained API. With only 77 jobs/day, we run **1 API call per day** rotating through the top queries. Each call uses `limit=77`.

| Day | Date | Query | Limit |
|-----|------|-------|-------|
| Tue | Apr 22 | Q1: COO & Ops Director — Remote | 77 |
| Wed | Apr 23 | Q2: Product Manager — Remote | 77 |
| Thu | Apr 24 | Q3: Business Ops — UAE | 77 |
| Fri | Apr 25 | Q5: COO & Ops Director — USA | 77 |
| Mon | Apr 28 | Q6: Product Manager — USA | 77 |
| Tue | Apr 29 | Q4: Product & Strategy — UAE | 77 |
| Wed | Apr 30 | Q7: Business Ops — Canada | 77 |
| Thu | May 1 | Q8: People Ops & Growth — Remote | 77 |
| Fri | May 2 | Q1: COO & Ops Director — Remote | 77 |
| Mon | May 5 | Q2: Product Manager — Remote | 77 |
| | | **Total:** | **770 / 776** |

### Active Jobs DB (286 jobs/day — comfortable budget)

With 286 jobs/day, we run **3 API calls per day** covering 3 different queries. Each call uses `limit=95` (3 × 95 = 285 ≤ 286).

| Day | Date | Call 1 (6:00 AM) | Call 2 (6:10 AM) | Call 3 (6:20 AM) |
|-----|------|-----------------|-----------------|-----------------|
| Tue | Apr 22 | Q1: COO Remote (95) | Q2: PM Remote (95) | Q3: Biz Ops UAE (95) |
| Wed | Apr 23 | Q4: PM UAE (95) | Q5: COO USA (95) | Q6: PM USA (95) |
| Thu | Apr 24 | Q7: Biz Ops Canada (95) | Q8: People Ops (95) | Q1: COO Remote (95) |
| Fri | Apr 25 | Q2: PM Remote (95) | Q3: Biz Ops UAE (95) | Q4: PM UAE (95) |
| Mon | Apr 28 | Q5: COO USA (95) | Q6: PM USA (95) | Q7: Biz Ops Canada (95) |
| Tue | Apr 29 | Q8: People Ops (95) | Q1: COO Remote (95) | Q2: PM Remote (95) |
| | | **Total:** | | **1,710 / 1,719** |

---

## 4. Execution Timeline — Daily Run (6:00–9:00 AM GST)

Each day's calls are staggered by 10 minutes:

| Time (GST) | API | Query |
|------------|-----|-------|
| 6:00 AM | Active Jobs DB | Call 1 of 3 |
| 6:10 AM | Active Jobs DB | Call 2 of 3 |
| 6:20 AM | Active Jobs DB | Call 3 of 3 |
| 6:30 AM | LinkedIn Job Search | Call 1 of 1 |

Total daily window: **30 minutes** (6:00–6:30 AM GST), well within the 6–9 AM window.

---

## 5. Safety Mechanisms

1. **Pre-flight quota check:** Before each API call, read `x-ratelimit-jobs-remaining` from the last stored response. If below threshold (LinkedIn < 200, Active Jobs < 100), skip the call and log a warning.
2. **Post-call quota update:** After each call, update the DB with the latest quota headers.
3. **Hard stop enforcement:** If any call returns `429 (quota exceeded)`, immediately disable all schedules for that API source.
4. **No de-duplication at ingestion:** All results are ingested regardless of overlap between APIs.
5. **Status on ingestion:** All jobs enter `"matched"` status for manual review via the swiping pipeline.
6. **No auto-resume generation:** Jobs are queued for review only.

---

## 6. Implementation Plan

The system already has a `fetch_schedules` table and a `startScheduledFetchRunner()` that checks every 5 minutes for due schedules. I will create **4 schedule entries** in the database:

| Schedule Name | API | Interval | Time (UTC) | Queries |
|--------------|-----|----------|------------|---------|
| `v2-ats-slot-1` | Active Jobs DB | Daily (Mon–Fri) | 02:00 (6:00 GST) | Rotating Q1→Q8 |
| `v2-ats-slot-2` | Active Jobs DB | Daily (Mon–Fri) | 02:10 (6:10 GST) | Rotating Q2→Q1 |
| `v2-ats-slot-3` | Active Jobs DB | Daily (Mon–Fri) | 02:20 (6:20 GST) | Rotating Q3→Q2 |
| `v2-li-slot-1` | LinkedIn | Daily (Mon–Fri) | 02:30 (6:30 GST) | Rotating Q1→Q2 |

The query rotation will be managed by a day-counter that cycles through the 8 queries.

---

## 7. Summary

| Metric | LinkedIn | Active Jobs DB | Combined |
|--------|----------|---------------|----------|
| Daily calls | 1 | 3 | 4 |
| Daily jobs (max) | 77 | 285 | 362 |
| Total jobs over cycle | 770 | 1,710 | 2,480 |
| Projected final usage | 97.5% | 97.8% | — |
| Time window | 6:30 AM | 6:00–6:20 AM | 6:00–6:30 AM |

**Expected outcome:** ~362 new jobs per weekday entering the swiping pipeline, targeting 97.5–97.8% quota exhaustion by each reset date, with hard-stop safety at 98%.
