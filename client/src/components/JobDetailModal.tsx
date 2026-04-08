import { trpc } from "@/lib/trpc";
import { Job } from "../../../drizzle/schema";
import { AtSign, Copy, ExternalLink, HelpCircle, X, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type KanbanStatus = "ingested" | "matched" | "to_apply" | "blocked" | "applied" | "rejected" | "expired";

export default function JobDetailModal({
  job,
  isOwner,
  onClose,
  onStatusChange,
}: {
  job: Job;
  isOwner: boolean;
  onClose: () => void;
  onStatusChange: (status: KanbanStatus, blockedReason?: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const utils = trpc.useUtils();

  const askQuestion = trpc.questions.ask.useMutation({
    onSuccess: () => {
      toast.success("Question submitted to owner");
      setQuestion("");
    },
    onError: (e) => toast.error(e.message),
  });

  const markApplied = trpc.jobs.markApplied.useMutation({
    onSuccess: () => {
      toast.success("Marked as applied! +10 XP");
      utils.jobs.kanban.invalidate();
      utils.stats.today.invalidate();
      utils.stats.gamification.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const score = Math.round(job.matchScore ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        style={{
          background: "var(--atari-panel)",
          border: "2px solid var(--atari-border)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "var(--atari-border)" }}>
          <div className="flex-1 min-w-0 pr-4">
            <h2
              className="text-xl font-black text-foreground leading-tight"
              style={{ fontFamily: "Press Start 2P, monospace", letterSpacing: "0.03em" }}
            >
              {job.title}
            </h2>
            <p
              className="mt-1"
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                color: "var(--atari-gray)",
                textTransform: "uppercase",
              }}
            >
              {job.company}
              {job.location && ` · ${job.location}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Red divider */}
        <div className="atari-divider flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tags & Score */}
          <div className="flex flex-wrap items-center gap-2">
            {score > 0 && (
              <span
                className="brutal-tag"
                style={{
                  borderColor: score >= 70 ? "var(--atari-green)" : score >= 40 ? "var(--atari-amber)" : "var(--atari-amber)",
                  color: score >= 70 ? "var(--atari-green)" : score >= 40 ? "var(--atari-amber)" : "var(--atari-amber)",
                  fontSize: "0.75rem",
                  padding: "3px 8px",
                }}
              >
                {score}% Match
              </span>
            )}
            {job.source && (
              <span className="brutal-tag" style={{ borderColor: "var(--atari-cyan)", color: "var(--atari-cyan)" }}>
                {job.source}
              </span>
            )}
            {job.hasEmail && (
              <span className="brutal-tag" style={{ borderColor: "var(--atari-amber)", color: "var(--atari-amber)" }}>
                <AtSign size={9} /> Email Outreach
              </span>
            )}
            {job.isDuplicate && (
              <span className="brutal-tag" style={{ borderColor: "var(--atari-amber)", color: "var(--atari-amber)" }}>
                <Copy size={9} /> Duplicated
              </span>
            )}
          </div>

          {/* Email found */}
          {job.emailFound && (
            <div
              className="p-3"
              style={{ background: "oklch(0.1 0 0)", border: "1px solid oklch(0.75 0.18 65 / 0.3)" }}
            >
              <p
                style={{
                  fontFamily: "Press Start 2P, monospace",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  color: "var(--atari-amber)",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Email Found
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--atari-white)" }}>
                {job.emailFound}
              </p>
            </div>
          )}

          {/* Apply URL */}
          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm transition-colors"
              style={{
                fontFamily: "Press Start 2P, monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--atari-cyan)",
                fontSize: "0.8rem",
              }}
            >
              <ExternalLink size={13} />
              Open Application Link
            </a>
          )}

          {/* Dimension Score Breakdown */}
          {((job as any).scoreSkills != null || (job as any).scoreSeniority != null) && (
            <div>
              <p className="mb-2" style={{ fontFamily: "Press Start 2P, monospace", fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--atari-gray)", textTransform: "uppercase" }}>
                Score Breakdown
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {([
                  { label: "Skills Match", key: "scoreSkills", color: "var(--atari-cyan)" },
                  { label: "Seniority Fit", key: "scoreSeniority", color: "var(--atari-amber)" },
                  { label: "Location / Remote", key: "scoreLocation", color: "oklch(0.7 0.18 145)" },
                  { label: "Industry Fit", key: "scoreIndustry", color: "oklch(0.75 0.18 290)" },
                  { label: "Compensation", key: "scoreCompensation", color: "oklch(0.65 0.22 27)" },
                ] as const).map(({ label, key, color }) => {
                  const val = (job as any)[key];
                  if (val == null) return null;
                  const pct = Math.max(0, Math.min(100, Math.round(val)));
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "oklch(0.5 0 0)", width: "8rem", flexShrink: 0 }}>{label}</span>
                      <div style={{ flex: 1, height: 5, background: "oklch(0.15 0 0)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color, width: "2.5rem", textAlign: "right", flexShrink: 0 }}>{pct}%</span>
                    </div>
                  );
                })}
                {(job as any).dealBreakerMatched && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--atari-red)", marginTop: 4 }}>⚠ Dealbreaker keyword matched — score suppressed</p>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <p
                className="mb-2"
                style={{
                  fontFamily: "Press Start 2P, monospace",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  color: "var(--atari-gray)",
                  textTransform: "uppercase",
                }}
              >
                Description
              </p>
              <div
                className="text-sm leading-relaxed"
                style={{
                  color: "oklch(0.7 0 0)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.82rem",
                  maxHeight: "300px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {job.description}
              </div>
            </div>
          )}

          {/* Applier: Block reason input (shown on to_apply jobs) */}
          {!isOwner && job.status === "to_apply" && (
            <div>
              <p
                className="mb-2"
                style={{ fontFamily: "Press Start 2P, monospace", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--atari-magenta)", textTransform: "uppercase" }}
              >
                Block Reason (optional)
              </p>
              <input
                className="brutal-input w-full text-sm"
                placeholder="e.g. portal broken, requires UAE national..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          )}

          {/* Show existing block reason on blocked jobs */}
          {job.status === "blocked" && job.blockedReason && (
            <div>
              <p
                className="mb-2"
                style={{ fontFamily: "Press Start 2P, monospace", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--atari-magenta)", textTransform: "uppercase" }}
              >
                Block Reason
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--atari-white)", background: "var(--atari-dark)", padding: "8px 12px", border: "1px solid var(--atari-magenta)33" }}>
                {job.blockedReason}
              </p>
            </div>
          )}

          {/* Applier: Ask Question */}
          {!isOwner && job.status === "to_apply" && (
            <div>
              <p
                className="mb-2"
                style={{
                  fontFamily: "Press Start 2P, monospace",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  color: "var(--atari-gray)",
                  textTransform: "uppercase",
                }}
              >
                Ask Owner a Question
              </p>
              <div className="flex gap-2">
                <input
                  className="brutal-input flex-1 text-sm"
                  placeholder="Type your question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && question.trim()) {
                      askQuestion.mutate({
                        jobId: job.id,
                        jobTitle: job.title,
                        jobCompany: job.company,
                        question: question.trim(),
                      });
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (question.trim()) {
                      askQuestion.mutate({
                        jobId: job.id,
                        jobTitle: job.title,
                        jobCompany: job.company,
                        question: question.trim(),
                      });
                    }
                  }}
                  disabled={!question.trim() || askQuestion.isPending}
                  className="px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all"
                  style={{
                    fontFamily: "Press Start 2P, monospace",
                    background: "var(--atari-dark)",
                    border: "1.5px solid oklch(0.3 0 0)",
                    color: "oklch(0.7 0 0)",
                  }}
                >
                  <HelpCircle size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t flex items-center gap-3" style={{ borderColor: "var(--atari-border)" }}>
          {/* Applier: Mark as Complete */}
          {!isOwner && job.status === "to_apply" && (
            <button
              onClick={() => markApplied.mutate({ id: job.id })}
              disabled={markApplied.isPending}
              className="flex-1 py-3 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
              style={{
                fontFamily: "Press Start 2P, monospace",
                background: "var(--atari-green)",
                color: "var(--atari-black)",
                border: "2px solid var(--atari-green)",
                letterSpacing: "0.15em",
              }}
            >
              <CheckCircle size={16} />
              {markApplied.isPending ? "Marking..." : "Mark as Applied"}
            </button>
          )}

          {/* Applier: Block a to_apply job */}
          {!isOwner && job.status === "to_apply" && (
            <button
              onClick={() => onStatusChange("blocked", blockReason.trim() || undefined)}
              className="py-3 px-4 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
              style={{
                fontFamily: "Press Start 2P, monospace",
                background: "transparent",
                color: "var(--atari-magenta)",
                border: "2px solid var(--atari-magenta)",
                letterSpacing: "0.1em",
              }}
            >
              <XCircle size={14} />
              Can't Apply
            </button>
          )}

          {/* Applier: Unblock a blocked job back to to_apply */}
          {!isOwner && job.status === "blocked" && (
            <button
              onClick={() => onStatusChange("to_apply")}
              className="flex-1 py-3 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
              style={{
                fontFamily: "Press Start 2P, monospace",
                background: "transparent",
                color: "var(--atari-amber)",
                border: "2px solid var(--atari-amber)",
                letterSpacing: "0.1em",
              }}
            >
              <ArrowRight size={14} />
              Move Back to Queue
            </button>
          )}

          {/* Owner: Quick move actions */}
          {isOwner && (
            <>
              {job.status !== "to_apply" && job.status !== "applied" && job.status !== "rejected" && (
                <button
                  onClick={() => onStatusChange("to_apply")}
                  className="flex-1 py-3 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
                  style={{
                    fontFamily: "Press Start 2P, monospace",
                    background: "var(--atari-white)",
                    color: "var(--atari-black)",
                    border: "2px solid var(--atari-white)",
                    letterSpacing: "0.1em",
                  }}
                >
                  <ArrowRight size={14} />
                  Assign to Applier
                </button>
              )}
              {job.status !== "rejected" && (
                <button
                  onClick={() => onStatusChange("rejected")}
                  className="py-3 px-4 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
                  style={{
                    fontFamily: "Press Start 2P, monospace",
                    background: "transparent",
                    color: "var(--atari-amber)",
                    border: "2px solid var(--atari-amber)",
                    letterSpacing: "0.1em",
                  }}
                >
                  <XCircle size={14} />
                  Reject
                </button>
              )}
              {job.status === "to_apply" && (
                <button
                  onClick={() => onStatusChange("expired")}
                  className="py-3 px-4 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
                  style={{
                    fontFamily: "Press Start 2P, monospace",
                    background: "transparent",
                    color: "#6b6b6b",
                    border: "2px solid #6b6b6b",
                    letterSpacing: "0.1em",
                  }}
                >
                  <XCircle size={14} />
                  No Longer Available
                </button>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="py-3 px-4 font-bold text-xs tracking-widest uppercase transition-all"
            style={{
              fontFamily: "Press Start 2P, monospace",
              background: "transparent",
              color: "var(--atari-gray)",
              border: "1.5px solid var(--atari-border)",
              letterSpacing: "0.1em",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
