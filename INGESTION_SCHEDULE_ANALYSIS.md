# JobPilot Ingestion Schedule Analysis & Recommendations

**Generated:** April 8, 2026 | **Based on:** 1,505 ingested jobs, 159 applied, 1,122 rejected

---

## 1. Key Findings from Swipe Data

### Location Performance

| Region | Swiped | Applied | Approval Rate |
|--------|--------|---------|---------------|
| Remote | 10 | 10 | **100%** |
| No Location | 133 | 25 | **18.8%** |
| Canada | 45 | 7 | **15.6%** |
| UAE | 231 | 31 | **13.4%** |
| US | 758 | 81 | **10.7%** |
| UK | 10 | 0 | 0% |
| Other | 94 | 5 | 5.3% |

**Insight:** Remote jobs have a 100% approval rate (10/10 applied). UAE and Canada are strong secondary targets. US jobs dominate volume but have lower approval rates — many are filtered out by seniority/title mismatch.

### Title Performance

| Title Group | Swiped | Applied | Approval Rate |
|-------------|--------|---------|---------------|
| Chief of Staff | 2 | 2 | **100%** |
| Director of Product | 15 | 8 | **53.3%** |
| Head of Operations | 2 | 1 | **50%** |
| Product Manager (Sr.) | 188 | 76 | **40.4%** |
| Strategy | 20 | 4 | **20%** |
| VP Operations | 13 | 2 | **15.4%** |
| Director of Operations | 65 | 8 | **12.3%** |
| COO | 58 | 2 | **3.4%** |

**Insight:** Product Manager (Senior) is the highest-volume, highest-yield title. Director of Product has exceptional precision (53%). COO titles score poorly — many are too senior or require specific industry experience.

### Score Distribution

| Score Range | Total | Applied | Applied Rate |
|-------------|-------|---------|--------------|
| 90–100 | 12 | 6 | **50%** |
| 80–89 | 76 | 25 | **33%** |
| 70–79 | 155 | 53 | **34%** |
| 60–69 | 155 | 26 | **17%** |
| 50–59 | 72 | 8 | **11%** |
| Below 50 | 811 | 41 | 5% |

**Insight:** The sweet spot is 70–89 (high volume + high approval). The current matched threshold of 40 lets through many low-quality jobs. **Raising to 55 is strongly supported** — jobs scoring 50–59 have only 11% approval.

### API Source Performance

| Source | Swiped | Applied | Approval Rate | Avg Score |
|--------|--------|---------|---------------|-----------|
| ATS (Fantastic Jobs) | 1,110 | 157 | **14.1%** | 37.7 |
| LinkedIn | 171 | 2 | **1.2%** | 30.6 |

**Critical Insight:** LinkedIn jobs are performing very poorly — only 2 applied out of 171 swiped (1.2%). ATS is 12x more effective. LinkedIn ingestion should be **deprioritized** until filters are tuned.

### ATS Source Quality

| ATS Source | Swiped | Applied | Approval Rate |
|------------|--------|---------|---------------|
| lever.co | 90 | 32 | **35.6%** |
| greenhouse | 142 | 33 | **23.2%** |
| ashby | 66 | 12 | **18.2%** |
| workday | 180 | 14 | **7.8%** |
| workable | 95 | 10 | **10.5%** |
| oraclecloud | 103 | 2 | **1.9%** |
| linkedin | 171 | 2 | **1.2%** |
| teamtailor | 57 | 1 | **1.8%** |

**Insight:** Lever.co and Greenhouse are the highest-quality ATS sources. OracleCloud, TeamTailor, and LinkedIn consistently produce poor matches.

---

## 2. Recommended Daily Ingestion Schedule

### Target: 20 applications/day | Owner time: ≤10 min/day

Based on the analysis, here is the optimal 3-run daily schedule:

---

### Run 1 — Morning (8 AM GST) | ATS 24h | Senior Product Manager + Remote
**Source:** Fantastic Jobs API | **Endpoint:** `active-ats-24h`
**Filters:**
- `title_filter`: `Senior Product Manager`
- `location_filter`: *(leave empty — catches US remote + "United States" listings)*
- Pages: 1 (100 jobs)

**Rationale:** Senior PM is the highest-yield title (40% approval). The 24h endpoint catches freshly posted jobs before they fill. Running in the morning maximizes time for the Applier to submit same-day.

**Expected yield:** ~100 fetched → ~15–20 new → ~6–8 applied

---

### Run 2 — Midday (12 PM GST) | ATS 7d | Director of Product + UAE/Canada
**Source:** Fantastic Jobs API | **Endpoint:** `active-ats-7d`
**Filters:**
- `title_filter`: `Director of Product`
- `location_filter`: `Canada` (first run), then `United Arab Emirates` (second run, alternate days)
- Pages: 1 (100 jobs)

**Rationale:** Director of Product has 53% approval — extremely high precision. UAE and Canada are the best geographic targets after remote. The 7d window ensures you don't miss roles posted earlier in the week.

**Expected yield:** ~100 fetched → ~10–15 new → ~4–6 applied

---

### Run 3 — Evening (5 PM GST) | ATS 24h | Operations + Remote
**Source:** Fantastic Jobs API | **Endpoint:** `active-ats-24h`
**Filters:**
- `title_filter`: `Operations Manager` OR `Head of Operations` OR `Chief of Staff`
- `location_filter`: *(leave empty)*
- Pages: 1 (100 jobs)

**Rationale:** Operations titles are the second-largest applied category. Running in the evening catches jobs posted during the US business day (EST morning = GST afternoon).

**Expected yield:** ~100 fetched → ~10–15 new → ~3–5 applied

---

### Weekly Bonus Run (Sundays) | ATS 7d | Broad Senior Search
**Source:** Fantastic Jobs API | **Endpoint:** `active-ats-7d`
**Filters:**
- `title_filter`: `Senior Product Manager`
- `location_filter`: `Remote`
- Pages: 2–3 (200–300 jobs)

**Rationale:** Sunday catches the full week's remote PM postings. Remote jobs have 100% approval — every one that passes scoring gets applied.

---

## 3. LinkedIn Usage Recommendation

**Current state:** LinkedIn has 1.2% approval rate vs 14.1% for ATS.

**Root cause hypothesis:** LinkedIn's `active-jb-7d` endpoint returns many jobs from sources like OracleCloud, TeamTailor, and SmartRecruiters that score poorly. The LinkedIn API also returns more international/irrelevant roles.

**Recommendation:** Use LinkedIn **only** for targeted UAE searches where ATS coverage is thin:
- **Endpoint:** `active-jb-7d`
- **Filters:** `keywords`: `Product Manager`, `locationId` for Dubai/UAE
- **Frequency:** Once per week (not daily)

---

## 4. Immediate Improvements to Implement

These changes will significantly improve pipeline quality before the schedule goes live:

| # | Change | Expected Impact |
|---|--------|-----------------|
| 1 | Add "Co-Founder" as title dealbreaker | Eliminates startup co-founder noise |
| 2 | Add "Sales Director", "Account Executive" as title dealbreakers | Removes sales roles mismatched to profile |
| 3 | Raise matched threshold from 40 → 55 | Cuts ~400 low-quality matched jobs, saves swipe time |
| 4 | Add "UAE National required" as dealbreaker | Removes roles you're ineligible for |
| 5 | Empty-location → score as "Remote" | Captures remote roles with no location tag (18.8% approval!) |

---

## 5. Projected Daily Output (After Improvements)

| Metric | Current | After Improvements |
|--------|---------|-------------------|
| Jobs ingested/day | ~300 (manual) | ~300 (3 automated runs) |
| Jobs matched/day | ~20–30 | ~15–20 (higher quality) |
| Jobs applied/day | ~8–12 | ~15–20 |
| Owner time | ~15–20 min | **≤10 min** |

---

*Analysis based on 1,505 ingested jobs, 159 applied, 1,122 rejected as of April 8, 2026.*
