import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Copy, Check, Mail } from "lucide-react";

// ─── Week 2 Plan (hardcoded from user's plan) ─────────────────────────────────
const WEEK2_PLAN = `MONDAY, APRIL 7
✅ Implement LinkedIn Jobs API integration (DONE — v3.21)
⏳ Apply 20 jobs
⏳ Feature: AutoApply MVP

TUESDAY, APRIL 8
⏳ Apply 20 jobs
⏳ Feature: LLM for answering application questions in Allan's voice (Gemini Gem / NotebookLLM)

WEDNESDAY, APRIL 9
⏳ Apply 20 jobs
⏳ Feature: Tool to generate tailor-made resume for each role

THURSDAY, APRIL 10
⏳ Apply 20 jobs
⏳ Feature: Auto-categorize emails received in inbox & automatically categorize jobs where rejection emails were received

FRIDAY, APRIL 11
⏳ Apply 20 jobs
⏳ Suggest improvements to hit 30 applications/day next week`;

// ─── Release Notes Summary ────────────────────────────────────────────────────
const RELEASE_NOTES_SUMMARY = `v3.23 (Apr 6) — Fix 504 Gateway Timeout on Ingest: LLM scoring now runs async in background; fetch response returns in <10s
v3.22 (Apr 6) — LinkedIn LI badge on job cards, per-source applied chart on Performance, source badge in fetch history
v3.21 (Apr 6) — LinkedIn Jobs API fully integrated (same RapidAPI key, new endpoint); source toggle in Ingest UI
v3.20 (Apr 5) — Fixed duplicate daily report emails (DB persistence); daily report moved to 7 PM GST
v3.19 (Apr 3) — CampaignBar now visible on all pages
v3.18 (Apr 3) — CampaignBar redesign: applied today pill, animated progress bar, sticky, auto-refresh
v3.17 (Apr 3) — Initial CampaignBar component
v3.16 (Apr 3) — Removed gamification from Performance page
v3.15 (Apr 3) — Fixed applied job counting (now queries jobs table directly by statusChangedAt)
v3.14 (Apr 2) — Weekly report added; daily report trigger corrected to 9 PM GST
v3.13 (Apr 2) — Release Notes section added to FAQ
v3.12 (Apr 2) — Smarter duplicate detection (externalId first, then fuzzy fallback)
v3.11 (Apr 2) — Duplicate jobs deleted (not tagged) — pipeline stays clean
v3.10 (Apr 2) — Improved API error logging with full response body and HTTP status
v3.9  (Apr 2) — Fetch history panel, quota banner, schedule management, dashboard pipeline stats
v3.8  (Apr 1) — Removed "Daily Target Met" email (too noisy)
v3.7  (Apr 1) — Public landing page at /landing
v3.6  (Apr 1) — Marketing landing page scaffold
v3.5  (Apr 1) — Email overhaul: rejection stats, rejected jobs table, weekly report
v3.4  (Mar 31) — Daily report: rate projection, applied today table, dynamic subject line
v3.3  (Mar 30) — Email notifications via Resend (question-answered + daily report)
v3.2  (Mar 29) — Manual job add to Applied column
v3.1  (Mar 28) — Matching algorithm upgrade: 5-dimension scoring, dealbreaker pre-filter
v3.0  (Mar 27) — Auto-reject feature with score threshold`;

export default function EmailDraft() {
  const [copied, setCopied] = useState(false);

  const { data: campaign } = trpc.stats.campaign.useQuery();
  const { data: recent } = trpc.stats.recent.useQuery();
  const { data: sourceBreakdown } = trpc.stats.sourceBreakdown.useQuery();

  // Build daily breakdown for last 7 days
  const last7 = (recent ?? []).slice(0, 7).reverse();
  const totalApplied = campaign?.totalApplied ?? 0;
  const remaining = campaign?.remaining ?? (1000 - totalApplied);
  const pct = campaign?.pct ?? 0;

  // Compute week 1 total (Mar 30 – Apr 5)
  const week1Days = last7.filter(d => d.dateKey >= "2026-03-30" && d.dateKey <= "2026-04-06");
  const week1Total = week1Days.reduce((s, d) => s + d.appliedCount, 0);
  const avgPerDay = week1Days.length > 0 ? (week1Total / week1Days.length).toFixed(1) : "0";

  const liApplied = sourceBreakdown?.linkedin ?? 0;
  const extApplied = sourceBreakdown?.external ?? 0;
  const manualApplied = sourceBreakdown?.manual ?? 0;

  const dailyBreakdown = last7
    .map(d => `  ${d.dateKey}: ${d.appliedCount} applied`)
    .join("\n");

  const emailText = `Subject: 1000 Jobs — Week 1 Recap & Week 2 Plan 🚀

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1000 JOBS CAMPAIGN — WEEK 1 RECAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi Ziad,

Here's the full recap of Week 1 of the 1000 Jobs campaign, plus the plan for Week 2.

─── CAMPAIGN PROGRESS ───────────────────────────

🎯 Total Applied:   ${totalApplied} / 1,000 (${pct}%)
📊 Remaining:       ${remaining} jobs
📈 Week 1 Total:    ${week1Total} applications
⚡ Avg Per Day:     ${avgPerDay} applications/day

─── WEEK 1 DAILY BREAKDOWN ──────────────────────

${dailyBreakdown}

─── BY SOURCE ───────────────────────────────────

  LinkedIn API:     ${liApplied} applied
  External API:     ${extApplied} applied
  Manual:           ${manualApplied} applied

─── PIPELINE STATUS ─────────────────────────────

  Matched (ready to swipe): ${campaign ? 1000 - totalApplied - remaining : "—"}
  Applied:                  ${totalApplied}
  Remaining to goal:        ${remaining}

─── WEEK 1 HIGHLIGHTS ───────────────────────────

• JobPilot platform built from scratch — full-stack job management system with AI scoring, Kanban board, swipe interface, email reports, and API ingestion.
• Integrated TWO job APIs: Fantastic Jobs (ATS) and LinkedIn Jobs — both running on the same RapidAPI key.
• AI matching algorithm: 5-dimension scoring (Skills, Seniority, Location, Industry, Compensation) + dealbreaker pre-filter.
• Daily report emails at 7 PM GST with pipeline stats, applied jobs table, and rejection breakdown.
• Weekly report every Friday at 9 PM GST.
• 24 releases shipped (v3.0 → v3.23) in 10 days.

─── RELEASE NOTES SUMMARY ───────────────────────

${RELEASE_NOTES_SUMMARY}

Full changelog: https://jobpilotapp-8xw3ydhl.manus.space/release-notes

─── WEEK 2 PLAN ─────────────────────────────────

${WEEK2_PLAN}

─── NOTES ───────────────────────────────────────

The current pace of ${avgPerDay} applications/day is below the 20/day target. Week 2 goal is to hit 20/day consistently and identify blockers. The AutoApply MVP (Monday) is the highest-leverage feature — if it works, it could 10x throughput.

Let me know if you have any questions or want to adjust priorities.

Allan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: "1.5rem 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Mail size={18} style={{ color: "var(--atari-amber)" }} />
          <div>
            <h1 style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              letterSpacing: "0.15em",
              color: "var(--atari-amber)",
              textTransform: "uppercase",
              margin: 0,
            }}>
              WEEK 1 RECAP EMAIL DRAFT
            </h1>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              color: "var(--atari-dim)",
              margin: "0.25rem 0 0 0",
            }}>
              Draft only — not sent. Copy and send manually.
            </p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: copied ? "rgba(57,255,20,0.1)" : "transparent",
            color: copied ? "var(--atari-green)" : "var(--atari-amber)",
            border: `1.5px solid ${copied ? "var(--atari-green)" : "var(--atari-amber)"}`,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "COPIED!" : "COPY EMAIL"}
        </button>
      </div>

      {/* Stats summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Applied", value: totalApplied, color: "var(--atari-cyan)" },
          { label: "Week 1 Total", value: week1Total, color: "var(--atari-amber)" },
          { label: "Avg / Day", value: avgPerDay, color: "var(--atari-green)" },
          { label: "Remaining", value: remaining, color: "var(--atari-red)" },
        ].map(card => (
          <div key={card.label} style={{
            background: "var(--atari-surface)",
            border: "1px solid var(--atari-border)",
            padding: "0.75rem",
            borderRadius: "4px",
          }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--atari-dim)", margin: "0 0 0.25rem 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {card.label}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", color: card.color, margin: 0, fontWeight: "bold" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Email preview */}
      <div style={{
        background: "var(--atari-surface)",
        border: "1px solid var(--atari-border)",
        borderRadius: "4px",
        padding: "1.25rem",
      }}>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "var(--atari-dim)",
          margin: "0 0 1rem 0",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          borderBottom: "1px solid var(--atari-border)",
          paddingBottom: "0.5rem",
        }}>
          EMAIL PREVIEW (PLAIN TEXT)
        </p>
        <pre style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          color: "var(--atari-text)",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          margin: 0,
        }}>
          {emailText}
        </pre>
      </div>
    </div>
  );
}
