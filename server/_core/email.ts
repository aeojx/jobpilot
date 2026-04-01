import { Resend } from "resend";
import { ENV } from "./env";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!ENV.resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

// Applier email — receives question answers and daily reports
export const APPLIER_EMAIL = "z.hewedi@gmail.com";

/**
 * Send a transactional email via Resend.
 * Returns true on success, false on failure (never throws — callers can log and continue).
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const resend = getResend();
    const from = payload.from ?? "1000Jobs <notifications@allanabbas.com>";
    const { error } = await resend.emails.send({
      from,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
    });
    if (error) {
      console.warn("[Email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send email:", err);
    return false;
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export function buildQuestionAnsweredEmail(opts: {
  question: string;
  answer: string;
  answeredBy: string;
  jobTitle?: string | null;
  jobCompany?: string | null;
}): string {
  const jobLine =
    opts.jobTitle || opts.jobCompany
      ? `<p style="color:#94a3b8;margin:0 0 16px 0;font-size:14px;">
          Job: <strong style="color:#e2e8f0">${escapeHtml(opts.jobTitle ?? "Unknown")}</strong>
          ${opts.jobCompany ? `at <strong style="color:#e2e8f0">${escapeHtml(opts.jobCompany)}</strong>` : ""}
        </p>`
      : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Question Answered — JobPilot</title></head>
<body style="background:#0f0f1a;color:#e2e8f0;font-family:monospace,sans-serif;margin:0;padding:32px;">
  <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border:1px solid #00ff9f33;border-radius:8px;padding:32px;">
    <h1 style="color:#00ff9f;font-size:20px;margin:0 0 8px 0;letter-spacing:2px;">✅ QUESTION ANSWERED</h1>
    <p style="color:#64748b;font-size:12px;margin:0 0 24px 0;">JobPilot Notification</p>
    ${jobLine}
    <div style="background:#0f0f1a;border-left:3px solid #00ff9f;padding:16px;margin-bottom:16px;border-radius:4px;">
      <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Question</p>
      <p style="color:#e2e8f0;margin:0;font-size:14px;line-height:1.6;">${escapeHtml(opts.question)}</p>
    </div>
    <div style="background:#0f0f1a;border-left:3px solid #fbbf24;padding:16px;margin-bottom:24px;border-radius:4px;">
      <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Answer by ${escapeHtml(opts.answeredBy)}</p>
      <p style="color:#e2e8f0;margin:0;font-size:14px;line-height:1.6;">${escapeHtml(opts.answer)}</p>
    </div>
    <p style="color:#475569;font-size:11px;margin:0;text-align:center;">JobPilot — Smart Job Application Manager · <a href="https://1000jobs.manus.space" style="color:#00ff9f;text-decoration:none;">1000jobs.manus.space</a></p>
  </div>
</body>
</html>`;
}

export function buildDailyReportEmail(opts: {
  date: string;
  matchedCount: number;
  toApplyCount: number;
  appliedCount: number;
  appliedToday: number;
  rejectedToday: number;
  totalRejected: number;
  weeklyApplied: number;
  weeklyData: Array<{ date: string; applied: number }>;
  totalApplied: number;
  targetTotal: number;
  weeksToGoal: number | null;
  appliedTodayJobs: Array<{ title: string; company: string; location: string | null }>;
  rejectedTodayJobs: Array<{ title: string; company: string; location: string | null }>;
}): string {
  const remaining = Math.max(0, opts.targetTotal - opts.totalApplied);
  const pct = Math.min(100, Math.round((opts.totalApplied / opts.targetTotal) * 100));
  const progressBar = buildProgressBar(pct);
  const totalDecisions = opts.appliedToday + opts.rejectedToday;
  const rejectionRate = totalDecisions > 0 ? Math.round((opts.rejectedToday / totalDecisions) * 100) : 0;

  const weekRows = opts.weeklyData
    .map(
      (d) =>
        `<tr>
          <td style="padding:6px 12px;color:#94a3b8;font-size:12px;">${d.date}</td>
          <td style="padding:6px 12px;color:#00ff9f;font-size:12px;text-align:right;">${d.applied}</td>
        </tr>`
    )
    .join("");

  const projectionLine =
    opts.weeksToGoal !== null
      ? `<p style="color:#e2e8f0;font-size:14px;margin:12px 0 0 0;text-align:center;border-top:1px solid #334155;padding-top:12px;">
          ⏱️ At the current rate of applications, you will reach 1,000 jobs in
          <strong style="color:#00ff9f;"> ${opts.weeksToGoal} week${opts.weeksToGoal === 1 ? "" : "s"}</strong>.
        </p>`
      : "";

  const appliedJobRows =
    opts.appliedTodayJobs.length > 0
      ? opts.appliedTodayJobs
          .map(
            (j, i) =>
              `<tr style="background:${i % 2 === 0 ? "#0f0f1a" : "#111827"}">
                <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;">${escapeHtml(j.title)}</td>
                <td style="padding:8px 12px;color:#94a3b8;font-size:12px;">${escapeHtml(j.company)}</td>
                <td style="padding:8px 12px;color:#64748b;font-size:11px;">${j.location ? escapeHtml(j.location) : "—"}</td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="padding:16px 12px;color:#475569;font-size:12px;text-align:center;">No applications submitted today yet.</td></tr>`;

  const rejectedJobRows =
    opts.rejectedTodayJobs.length > 0
      ? opts.rejectedTodayJobs
          .map(
            (j, i) =>
              `<tr style="background:${i % 2 === 0 ? "#0f0f1a" : "#111827"}">
                <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;">${escapeHtml(j.title)}</td>
                <td style="padding:8px 12px;color:#94a3b8;font-size:12px;">${escapeHtml(j.company)}</td>
                <td style="padding:8px 12px;color:#64748b;font-size:11px;">${j.location ? escapeHtml(j.location) : "—"}</td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="padding:16px 12px;color:#475569;font-size:12px;text-align:center;">No rejections today.</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Daily Report — 1000Jobs</title></head>
<body style="background:#0f0f1a;color:#e2e8f0;font-family:monospace,sans-serif;margin:0;padding:32px;">
  <div style="max-width:620px;margin:0 auto;background:#1a1a2e;border:1px solid #00ff9f33;border-radius:8px;padding:32px;">
    <h1 style="color:#00ff9f;font-size:20px;margin:0 0 4px 0;letter-spacing:2px;">📊 DAILY REPORT</h1>
    <p style="color:#64748b;font-size:12px;margin:0 0 28px 0;">${opts.date} · GST</p>

    <!-- Pipeline Snapshot -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:0 0 16px 0;text-transform:uppercase;">Pipeline Snapshot</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="padding:10px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:25%;">
          <div style="color:#00ff9f;font-size:26px;font-weight:bold;">${opts.matchedCount}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Matched</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:10px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:25%;">
          <div style="color:#fbbf24;font-size:26px;font-weight:bold;">${opts.toApplyCount}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Ready to Apply</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:10px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:25%;">
          <div style="color:#60a5fa;font-size:26px;font-weight:bold;">${opts.appliedCount}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Total Applied</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:10px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:25%;">
          <div style="color:#f87171;font-size:26px;font-weight:bold;">${opts.totalRejected}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Total Rejected</div>
        </td>
      </tr>
    </table>

    <!-- Today's Activity -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:0 0 12px 0;text-transform:uppercase;">Today's Activity</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="padding:14px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:33%;">
          <div style="color:#00ff9f;font-size:30px;font-weight:bold;">${opts.appliedToday}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Applied Today</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:14px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:33%;">
          <div style="color:#f87171;font-size:30px;font-weight:bold;">${opts.rejectedToday}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Rejected Today</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:14px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:33%;">
          <div style="color:#a78bfa;font-size:30px;font-weight:bold;">${rejectionRate}%</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Rejection Rate</div>
        </td>
      </tr>
    </table>

    <!-- Last 7 Days -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:0 0 12px 0;text-transform:uppercase;">Last 7 Days</h2>
    <table style="width:100%;border-collapse:collapse;background:#0f0f1a;border-radius:6px;margin-bottom:28px;overflow:hidden;">
      <tr style="background:#1e293b;">
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Date</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Applied</th>
      </tr>
      ${weekRows}
      <tr style="background:#1e293b;border-top:1px solid #334155;">
        <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;font-weight:bold;">7-Day Total</td>
        <td style="padding:8px 12px;color:#00ff9f;font-size:12px;font-weight:bold;text-align:right;">${opts.weeklyApplied}</td>
      </tr>
    </table>

    <!-- 1000-Job Countdown -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:0 0 12px 0;text-transform:uppercase;">🎯 1,000-Job Campaign</h2>
    <div style="background:#0f0f1a;border-radius:6px;padding:20px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#94a3b8;font-size:12px;">Progress</span>
        <span style="color:#00ff9f;font-size:12px;font-weight:bold;">${opts.totalApplied} / ${opts.targetTotal} (${pct}%)</span>
      </div>
      ${progressBar}
      <p style="color:#e2e8f0;font-size:14px;margin:16px 0 0 0;text-align:center;">
        <strong style="color:#fbbf24;font-size:22px;">${remaining.toLocaleString()}</strong>
        <span style="color:#64748b;font-size:12px;"> jobs remaining to reach 1,000</span>
      </p>
      ${projectionLine}
    </div>

    <!-- Applied Today Jobs -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:24px 0 12px 0;text-transform:uppercase;">✅ Applied Today (${opts.appliedTodayJobs.length})</h2>
    <table style="width:100%;border-collapse:collapse;background:#0f0f1a;border-radius:6px;margin-bottom:24px;overflow:hidden;">
      <tr style="background:#1e293b;">
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Job Title</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Company</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Location</th>
      </tr>
      ${appliedJobRows}
    </table>

    <!-- Rejected Today Jobs -->
    <h2 style="color:#f87171;font-size:13px;letter-spacing:2px;margin:0 0 12px 0;text-transform:uppercase;">❌ Rejected Today (${opts.rejectedTodayJobs.length})</h2>
    <table style="width:100%;border-collapse:collapse;background:#0f0f1a;border-radius:6px;margin-bottom:24px;overflow:hidden;">
      <tr style="background:#1e293b;">
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Job Title</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Company</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Location</th>
      </tr>
      ${rejectedJobRows}
    </table>

    <p style="color:#475569;font-size:11px;margin:24px 0 0 0;text-align:center;">1000Jobs · Smart Job Application Manager · <a href="https://1000jobs.manus.space" style="color:#00ff9f;text-decoration:none;">1000jobs.manus.space</a></p>
  </div>
</body>
</html>`;
}

export function buildWeeklyReportEmail(opts: {
  weekLabel: string; // e.g. "Mar 30 – Apr 5, 2026"
  appliedThisWeek: number;
  rejectedThisWeek: number;
  approvalRate: number; // percentage
  totalApplied: number;
  targetTotal: number;
  matchedCount: number;
  toApplyCount: number;
  weeksToGoal: number | null;
  dailyBreakdown: Array<{ date: string; applied: number; rejected: number }>;
  appliedJobs: Array<{ title: string; company: string; location: string | null }>;
  rejectedJobs: Array<{ title: string; company: string; location: string | null; matchScore: number | null }>;
}): string {
  const remaining = Math.max(0, opts.targetTotal - opts.totalApplied);
  const pct = Math.min(100, Math.round((opts.totalApplied / opts.targetTotal) * 100));
  const progressBar = buildProgressBar(pct);

  const projectionLine =
    opts.weeksToGoal !== null
      ? `<p style="color:#e2e8f0;font-size:14px;margin:12px 0 0 0;text-align:center;border-top:1px solid #334155;padding-top:12px;">
          ⏱️ At this week's rate, you will reach 1,000 jobs in
          <strong style="color:#00ff9f;"> ${opts.weeksToGoal} week${opts.weeksToGoal === 1 ? "" : "s"}</strong>.
        </p>`
      : "";

  const dailyRows = opts.dailyBreakdown
    .map(
      (d, i) =>
        `<tr style="background:${i % 2 === 0 ? "#0f0f1a" : "#111827"}">
          <td style="padding:7px 12px;color:#94a3b8;font-size:12px;">${d.date}</td>
          <td style="padding:7px 12px;color:#00ff9f;font-size:12px;text-align:right;">${d.applied}</td>
          <td style="padding:7px 12px;color:#f87171;font-size:12px;text-align:right;">${d.rejected}</td>
        </tr>`
    )
    .join("");

  const appliedJobRows =
    opts.appliedJobs.length > 0
      ? opts.appliedJobs
          .map(
            (j, i) =>
              `<tr style="background:${i % 2 === 0 ? "#0f0f1a" : "#111827"}">
                <td style="padding:7px 12px;color:#e2e8f0;font-size:12px;">${escapeHtml(j.title)}</td>
                <td style="padding:7px 12px;color:#94a3b8;font-size:12px;">${escapeHtml(j.company)}</td>
                <td style="padding:7px 12px;color:#64748b;font-size:11px;">${j.location ? escapeHtml(j.location) : "—"}</td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="padding:16px 12px;color:#475569;font-size:12px;text-align:center;">No applications this week.</td></tr>`;

  const rejectedJobRows =
    opts.rejectedJobs.length > 0
      ? opts.rejectedJobs
          .map(
            (j, i) =>
              `<tr style="background:${i % 2 === 0 ? "#0f0f1a" : "#111827"}">
                <td style="padding:7px 12px;color:#e2e8f0;font-size:12px;">${escapeHtml(j.title)}</td>
                <td style="padding:7px 12px;color:#94a3b8;font-size:12px;">${escapeHtml(j.company)}</td>
                <td style="padding:7px 12px;color:#64748b;font-size:11px;">${j.location ? escapeHtml(j.location) : "—"}</td>
                <td style="padding:7px 12px;color:#a78bfa;font-size:11px;text-align:right;">${j.matchScore !== null ? j.matchScore + "%" : "—"}</td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="4" style="padding:16px 12px;color:#475569;font-size:12px;text-align:center;">No rejections this week.</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Weekly Report — 1000Jobs</title></head>
<body style="background:#0f0f1a;color:#e2e8f0;font-family:monospace,sans-serif;margin:0;padding:32px;">
  <div style="max-width:620px;margin:0 auto;background:#1a1a2e;border:1px solid #a78bfa33;border-radius:8px;padding:32px;">
    <h1 style="color:#a78bfa;font-size:20px;margin:0 0 4px 0;letter-spacing:2px;">📅 WEEKLY REPORT</h1>
    <p style="color:#64748b;font-size:12px;margin:0 0 28px 0;">Week of ${opts.weekLabel} · GST</p>

    <!-- Week at a Glance -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:0 0 16px 0;text-transform:uppercase;">Week at a Glance</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="padding:12px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:25%;">
          <div style="color:#00ff9f;font-size:28px;font-weight:bold;">${opts.appliedThisWeek}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Applied</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:12px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:25%;">
          <div style="color:#f87171;font-size:28px;font-weight:bold;">${opts.rejectedThisWeek}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Rejected</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:12px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:25%;">
          <div style="color:#fbbf24;font-size:28px;font-weight:bold;">${opts.approvalRate}%</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Apply Rate</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:12px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:25%;">
          <div style="color:#60a5fa;font-size:28px;font-weight:bold;">${remaining}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Remaining</div>
        </td>
      </tr>
    </table>

    <!-- Daily Breakdown -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:0 0 12px 0;text-transform:uppercase;">Daily Breakdown</h2>
    <table style="width:100%;border-collapse:collapse;background:#0f0f1a;border-radius:6px;margin-bottom:28px;overflow:hidden;">
      <tr style="background:#1e293b;">
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Date</th>
        <th style="padding:8px 12px;text-align:right;color:#00ff9f;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Applied</th>
        <th style="padding:8px 12px;text-align:right;color:#f87171;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Rejected</th>
      </tr>
      ${dailyRows}
      <tr style="background:#1e293b;border-top:1px solid #334155;">
        <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;font-weight:bold;">Week Total</td>
        <td style="padding:8px 12px;color:#00ff9f;font-size:12px;font-weight:bold;text-align:right;">${opts.appliedThisWeek}</td>
        <td style="padding:8px 12px;color:#f87171;font-size:12px;font-weight:bold;text-align:right;">${opts.rejectedThisWeek}</td>
      </tr>
    </table>

    <!-- Pipeline Health -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:0 0 16px 0;text-transform:uppercase;">Pipeline Health</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="padding:10px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:33%;">
          <div style="color:#00ff9f;font-size:26px;font-weight:bold;">${opts.matchedCount}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Matched</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:10px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:33%;">
          <div style="color:#fbbf24;font-size:26px;font-weight:bold;">${opts.toApplyCount}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Ready to Apply</div>
        </td>
        <td style="width:6px;"></td>
        <td style="padding:10px 8px;background:#0f0f1a;border-radius:6px;text-align:center;width:33%;">
          <div style="color:#60a5fa;font-size:26px;font-weight:bold;">${opts.totalApplied}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Total Applied</div>
        </td>
      </tr>
    </table>

    <!-- 1000-Job Countdown -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:0 0 12px 0;text-transform:uppercase;">🎯 1,000-Job Campaign</h2>
    <div style="background:#0f0f1a;border-radius:6px;padding:20px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#94a3b8;font-size:12px;">Progress</span>
        <span style="color:#00ff9f;font-size:12px;font-weight:bold;">${opts.totalApplied} / ${opts.targetTotal} (${pct}%)</span>
      </div>
      ${progressBar}
      <p style="color:#e2e8f0;font-size:14px;margin:16px 0 0 0;text-align:center;">
        <strong style="color:#fbbf24;font-size:22px;">${remaining.toLocaleString()}</strong>
        <span style="color:#64748b;font-size:12px;"> jobs remaining to reach 1,000</span>
      </p>
      ${projectionLine}
    </div>

    <!-- All Applied This Week -->
    <h2 style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin:24px 0 12px 0;text-transform:uppercase;">✅ All Applied This Week (${opts.appliedJobs.length})</h2>
    <table style="width:100%;border-collapse:collapse;background:#0f0f1a;border-radius:6px;margin-bottom:24px;overflow:hidden;">
      <tr style="background:#1e293b;">
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Job Title</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Company</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Location</th>
      </tr>
      ${appliedJobRows}
    </table>

    <!-- All Rejected This Week -->
    <h2 style="color:#f87171;font-size:13px;letter-spacing:2px;margin:0 0 12px 0;text-transform:uppercase;">❌ All Rejected This Week (${opts.rejectedJobs.length})</h2>
    <table style="width:100%;border-collapse:collapse;background:#0f0f1a;border-radius:6px;margin-bottom:24px;overflow:hidden;">
      <tr style="background:#1e293b;">
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Job Title</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Company</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Location</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Match</th>
      </tr>
      ${rejectedJobRows}
    </table>

    <p style="color:#475569;font-size:11px;margin:24px 0 0 0;text-align:center;">1000Jobs · Smart Job Application Manager · <a href="https://1000jobs.manus.space" style="color:#a78bfa;text-decoration:none;">1000jobs.manus.space</a></p>
  </div>
</body>
</html>`;
}

function buildProgressBar(pct: number): string {
  const filled = Math.round(pct / 5); // 20 blocks total
  const empty = 20 - filled;
  const bar =
    `<span style="color:#00ff9f">${"█".repeat(filled)}</span>` +
    `<span style="color:#1e293b">${"█".repeat(empty)}</span>`;
  return `<div style="font-family:monospace;font-size:16px;letter-spacing:2px;text-align:center;">${bar}</div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}
