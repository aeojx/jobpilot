import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Job } from "../../../drizzle/schema";
import {
  AtSign,
  CheckCircle,
  Copy,
  ExternalLink,
  Flame,
  HelpCircle,
  Loader2,
  PlusCircle,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import JobDetailModal from "@/components/JobDetailModal";
import ResumeButton from "@/components/ResumeButton";

const TIERS = [
  { name: "Rookie", minXp: 0, color: "var(--atari-gray)" },
  { name: "Grinder", minXp: 100, color: "var(--atari-amber)" },
  { name: "Machine", minXp: 500, color: "var(--atari-cyan)" },
  { name: "Legend", minXp: 2000, color: "var(--atari-amber)" },
];

function getTier(xp: number) {
  return [...TIERS].reverse().find((t) => xp >= t.minXp) ?? TIERS[0]!;
}

function getScoreColor(score: number) {
  if (score >= 70) return "var(--atari-green)";
  if (score >= 40) return "var(--atari-amber)";
  return "var(--atari-amber)";
}

export default function ApplierView() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: allJobs = [], isLoading } = trpc.jobs.kanban.useQuery();
  const { data: todayStats } = trpc.stats.today.useQuery();
  const { data: gami } = trpc.stats.gamification.useQuery();

  const markApplied = trpc.jobs.markApplied.useMutation({
    onSuccess: () => {
      toast.success("Applied! +10 XP 🎯");
      utils.jobs.kanban.invalidate();
      utils.stats.today.invalidate();
      utils.stats.gamification.invalidate();
      setSelectedJob(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const [confirmRejectId, setConfirmRejectId] = useState<number | null>(null);

  // Manual Add Job state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualApplyUrl, setManualApplyUrl] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const manualAdd = trpc.jobs.manualAdd.useMutation({
    onSuccess: () => {
      utils.jobs.kanban.invalidate();
      toast.success("Job added to Applied column");
      setShowManualForm(false);
      setManualTitle(""); setManualCompany(""); setManualLocation(""); setManualApplyUrl(""); setManualNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  const applierReject = trpc.jobs.applierReject.useMutation({
    onSuccess: () => {
      toast.success("Job moved to rejected pile");
      utils.jobs.kanban.invalidate();
      setConfirmRejectId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const toApplyJobs = allJobs.filter((j) => j.status === "to_apply");
  const today = todayStats?.appliedCount ?? 0;
  const target = todayStats?.targetCount ?? 10;
  const pct = Math.min(100, Math.round((today / target) * 100));
  const isComplete = today >= target;
  const tier = getTier(gami?.totalXp ?? 0);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "Press Start 2P, monospace", letterSpacing: "0.05em" }}
          >
            My Queue
          </h2>
          <div className="flex items-center gap-2">
            <span
              className="brutal-tag"
              style={{ borderColor: "var(--atari-amber)", color: "var(--atari-amber)", fontSize: "0.75rem" }}
            >
              {toApplyJobs.length} to apply
            </span>
            {isLoading && <Loader2 size={14} className="animate-spin text-foreground/40" />}
            <button
              onClick={() => { setShowManualForm(true); setTimeout(() => titleRef.current?.focus(), 50); }}
              className="flex items-center gap-1"
              style={{
                background: "transparent",
                border: "1px solid var(--atari-amber)",
                color: "var(--atari-amber)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.08em",
                padding: "3px 8px",
                cursor: "pointer",
              }}
            >
              <PlusCircle size={10} /> ADD JOB
            </button>
          </div>
        </div>
        <div className="atari-divider" />
      </div>

      <div className="flex-1 px-5 pb-5 space-y-5">
        {/* Daily Progress + Gamification Banner */}
        <div
          className="p-4"
          style={{
            background: "var(--atari-panel)",
            border: `2px solid ${isComplete ? "var(--atari-green)" : "var(--atari-border)"}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div>
                <p
                  style={{
                    fontFamily: "Press Start 2P, monospace",
                    fontSize: "0.65rem",
                    letterSpacing: "0.12em",
                    color: "var(--atari-gray)",
                    textTransform: "uppercase",
                  }}
                >
                  Today's Progress
                </p>
                <p
                  style={{
                    fontFamily: "Press Start 2P, monospace",
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    color: isComplete ? "var(--atari-green)" : "var(--atari-white)",
                    lineHeight: 1,
                  }}
                >
                  {today}
                  <span style={{ fontSize: "1rem", color: "oklch(0.35 0 0)", fontWeight: 400 }}>
                    /{target}
                  </span>
                </p>
              </div>
            </div>

            {/* Gamification mini-stats */}
            {gami && (
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Flame size={12} style={{ color: "var(--atari-amber)" }} />
                    <span
                      style={{
                        fontFamily: "Press Start 2P, monospace",
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "var(--atari-white)",
                      }}
                    >
                      {gami.currentStreak}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.55rem",
                      color: "oklch(0.35 0 0)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Streak
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Zap size={12} style={{ color: "var(--atari-amber)" }} />
                    <span
                      style={{
                        fontFamily: "Press Start 2P, monospace",
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "var(--atari-white)",
                      }}
                    >
                      {gami.totalXp}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.55rem",
                      color: "oklch(0.35 0 0)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    XP
                  </p>
                </div>
                <div
                  className="px-2 py-1"
                  style={{ border: `1.5px solid ${tier.color}` }}
                >
                  <p
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      color: tier.color,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tier.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="progress-track">
            <div
              className={`progress-fill ${isComplete ? "complete" : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {isComplete && (
            <p
              className="mt-2"
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                color: "var(--atari-green)",
                textTransform: "uppercase",
              }}
            >
              🎯 Daily target reached! Keep going for bonus XP
            </p>
          )}
        </div>

        {/* Job List */}
        {toApplyJobs.length === 0 && !isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-16"
            style={{ border: "1.5px dashed var(--atari-border)" }}
          >
            <Trophy size={28} style={{ color: "var(--atari-border)", marginBottom: 12 }} />
            <p
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.8rem",
                letterSpacing: "0.12em",
                color: "oklch(0.35 0 0)",
                textTransform: "uppercase",
              }}
            >
              No jobs assigned yet
            </p>
            <p
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                color: "var(--atari-border)",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              The Owner will assign jobs to your queue
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {toApplyJobs.map((job) => {
              const score = Math.round(job.matchScore ?? 0);
              const scoreColor = getScoreColor(score);
              return (
                <div
                  key={job.id}
                  className="p-4"
                  style={{
                    background: "var(--atari-panel)",
                    border: "1.5px solid oklch(0.18 0 0)",
                    transition: "border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--atari-amber)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "oklch(0.18 0 0)")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold leading-tight mb-1"
                        style={{
                          fontFamily: "Press Start 2P, monospace",
                          fontSize: "1rem",
                          letterSpacing: "0.02em",
                          color: "var(--atari-white)",
                        }}
                      >
                        {job.title}
                      </p>
                      <p
                        style={{
                          fontFamily: "Press Start 2P, monospace",
                          fontSize: "0.75rem",
                          letterSpacing: "0.06em",
                          color: "oklch(0.5 0 0)",
                          textTransform: "uppercase",
                        }}
                      >
                        {job.company}
                        {job.location && ` · ${job.location}`}
                      </p>

                      {/* Score */}
                      {score > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="score-bar-track flex-1" style={{ maxWidth: 80 }}>
                            <div
                              className={`score-bar-fill ${score >= 70 ? "high" : score >= 40 ? "mid" : ""}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.65rem",
                              color: scoreColor,
                            }}
                          >
                            {score}%
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.source && (
                          <span className="brutal-tag" style={{ borderColor: "var(--atari-cyan)", color: "var(--atari-cyan)" }}>
                            {job.source}
                          </span>
                        )}
                        {job.hasEmail && (
                          <span className="brutal-tag" style={{ borderColor: "var(--atari-amber)", color: "var(--atari-amber)" }}>
                            <AtSign size={8} /> Email
                          </span>
                        )}
                        {job.isDuplicate && (
                          <span className="brutal-tag" style={{ borderColor: "var(--atari-amber)", color: "var(--atari-amber)" }}>
                            <Copy size={8} /> Dupe
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => markApplied.mutate({ id: job.id })}
                        disabled={markApplied.isPending || applierReject.isPending}
                        className="flex items-center gap-1 px-3 py-2 font-black text-xs tracking-widest uppercase transition-all"
                        style={{
                          fontFamily: "Press Start 2P, monospace",
                          background: "var(--atari-green)",
                          color: "var(--atari-black)",
                          border: "2px solid var(--atari-green)",
                          letterSpacing: "0.08em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {markApplied.isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        Applied
                      </button>

                      {/* Can't Apply — reject with confirmation */}
                      {confirmRejectId === job.id ? (
                        <div className="flex flex-col gap-1">
                          <p style={{ fontFamily: "Press Start 2P, monospace", fontSize: "0.5rem", color: "var(--atari-red)", letterSpacing: "0.06em", textAlign: "center" }}>
                            CONFIRM?
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => applierReject.mutate({ id: job.id })}
                              disabled={applierReject.isPending}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1"
                              style={{
                                fontFamily: "Press Start 2P, monospace",
                                fontSize: "0.5rem",
                                background: "var(--atari-red)",
                                color: "var(--atari-white)",
                                border: "2px solid var(--atari-red)",
                                letterSpacing: "0.05em",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {applierReject.isPending ? <Loader2 size={10} className="animate-spin" /> : "YES"}
                            </button>
                            <button
                              onClick={() => setConfirmRejectId(null)}
                              className="flex-1 flex items-center justify-center px-2 py-1"
                              style={{
                                fontFamily: "Press Start 2P, monospace",
                                fontSize: "0.5rem",
                                background: "transparent",
                                color: "oklch(0.5 0 0)",
                                border: "1.5px solid var(--atari-border)",
                                letterSpacing: "0.05em",
                              }}
                            >
                              NO
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRejectId(job.id)}
                          disabled={markApplied.isPending || applierReject.isPending}
                          className="flex items-center gap-1 px-3 py-2 font-bold text-xs tracking-widest uppercase transition-all"
                          style={{
                            fontFamily: "Press Start 2P, monospace",
                            background: "transparent",
                            color: "var(--atari-red)",
                            border: "1.5px solid var(--atari-red)",
                            letterSpacing: "0.08em",
                            whiteSpace: "nowrap",
                            opacity: 0.7,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                        >
                          <XCircle size={12} />
                          Can't Apply
                        </button>
                      )}

                      <ResumeButton jobId={job.id} />

                      <button
                        onClick={() => setSelectedJob(job)}
                        className="flex items-center gap-1 px-3 py-2 font-bold text-xs tracking-widest uppercase transition-all"
                        style={{
                          fontFamily: "Press Start 2P, monospace",
                          background: "transparent",
                          color: "oklch(0.5 0 0)",
                          border: "1.5px solid var(--atari-border)",
                          letterSpacing: "0.08em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <HelpCircle size={12} />
                        Details
                      </button>
                    </div>
                  </div>

                  {/* Apply link shortcut */}
                  {job.applyUrl && (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 mt-3 text-xs"
                      style={{
                        fontFamily: "Press Start 2P, monospace",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--atari-cyan)",
                        fontSize: "0.7rem",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={11} />
                      Open Application
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {showManualForm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowManualForm(false); }}
        >
          <div
            style={{
              background: "var(--atari-bg)",
              border: "1px solid var(--atari-amber)",
              boxShadow: "0 0 20px var(--atari-amber)33",
              padding: "1.5rem",
              width: "min(480px, 95vw)",
              display: "flex", flexDirection: "column", gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="font-pixel glow-amber" style={{ color: "var(--atari-amber)", fontSize: "10px" }}>+ MANUAL JOB ENTRY</span>
              <button onClick={() => setShowManualForm(false)} style={{ background: "none", border: "none", color: "var(--atari-gray)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--atari-gray)", letterSpacing: "0.04em" }}>
              Jobs added here go directly to the <span style={{ color: "var(--atari-cyan)" }}>Applied</span> column and are tagged as manually added by <span style={{ color: "var(--atari-amber)" }}>{user?.name ?? "you"}</span>.
            </p>
            {([
              { label: "JOB TITLE *", value: manualTitle, setter: setManualTitle, ref: titleRef, required: true },
              { label: "COMPANY *", value: manualCompany, setter: setManualCompany, ref: undefined, required: true },
              { label: "LOCATION", value: manualLocation, setter: setManualLocation, ref: undefined, required: false },
              { label: "APPLY URL", value: manualApplyUrl, setter: setManualApplyUrl, ref: undefined, required: false },
            ] as Array<{ label: string; value: string; setter: (v: string) => void; ref: React.RefObject<HTMLInputElement> | undefined; required: boolean }>).map(({ label, value, setter, ref, required }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", letterSpacing: "0.08em" }}>{label}</label>
                <input
                  ref={ref}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  required={required}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--atari-border)",
                    color: "var(--atari-white)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    padding: "6px 8px",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", letterSpacing: "0.08em" }}>NOTES</label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={3}
                style={{
                  background: "transparent",
                  border: "1px solid var(--atari-border)",
                  color: "var(--atari-white)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  padding: "6px 8px",
                  outline: "none",
                  resize: "vertical",
                  width: "100%",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
              <button
                onClick={() => setShowManualForm(false)}
                style={{ background: "transparent", border: "1px solid var(--atari-border)", color: "var(--atari-gray)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em" }}
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  if (!manualTitle.trim() || !manualCompany.trim()) { toast.error("Title and Company are required"); return; }
                  manualAdd.mutate({ title: manualTitle.trim(), company: manualCompany.trim(), location: manualLocation.trim() || undefined, applyUrl: manualApplyUrl.trim() || undefined, notes: manualNotes.trim() || undefined });
                }}
                disabled={manualAdd.isPending}
                style={{ background: "var(--atari-amber)", border: "1px solid var(--atari-amber)", color: "var(--atari-black)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em", fontWeight: 700 }}
              >
                {manualAdd.isPending ? "ADDING..." : "▶ ADD JOB"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOwner={false}
          onClose={() => setSelectedJob(null)}
          onStatusChange={() => {}}
        />
      )}
    </div>
  );
}
