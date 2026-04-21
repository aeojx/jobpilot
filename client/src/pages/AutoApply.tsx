import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Play,
  Square,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Zap,
} from "lucide-react";

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    applied: { color: "var(--atari-green)", label: "APPLIED" },
    failed: { color: "var(--atari-red)", label: "FAILED" },
    expired: { color: "var(--atari-gray)", label: "EXPIRED" },
    manual: { color: "var(--atari-amber)", label: "MANUAL" },
    captcha: { color: "var(--atari-red)", label: "CAPTCHA" },
    login_issue: { color: "var(--atari-red)", label: "LOGIN" },
  };
  const s = map[status] || { color: "var(--atari-gray)", label: status.toUpperCase() };
  return (
    <span
      className="inline-block px-2 py-0.5 text-xs"
      style={{
        border: `1px solid ${s.color}`,
        color: s.color,
        fontFamily: "Press Start 2P",
        fontSize: "7px",
        letterSpacing: "0.05em",
      }}
    >
      {s.label}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AutoApply() {
  const [minScore, setMinScore] = useState(50);
  const [maxJobs, setMaxJobs] = useState(10);

  const { data: status, isLoading: statusLoading } = trpc.autoApply.status.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const { data: history, isLoading: historyLoading } = trpc.autoApply.history.useQuery(
    { limit: 50 },
    { refetchInterval: 5000 }
  );

  const startMutation = trpc.autoApply.start.useMutation();
  const stopMutation = trpc.autoApply.stop.useMutation();
  const utils = trpc.useUtils();

  const isRunning = status?.isRunning ?? false;

  const handleStart = async () => {
    try {
      const result = await startMutation.mutateAsync({ minScore, maxJobs });
      if (result.started) {
        toast.success(`AutoApply started: ${result.jobsQueued} jobs queued`);
      } else {
        toast.error(result.error || "Failed to start");
      }
      utils.autoApply.status.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to start AutoApply");
    }
  };

  const handleStop = async () => {
    try {
      const result = await stopMutation.mutateAsync();
      if (result.stopped) {
        toast.info("AutoApply stopping after current job...");
      }
      utils.autoApply.status.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to stop");
    }
  };

  const applied = status?.progress?.applied ?? 0;
  const failed = status?.progress?.failed ?? 0;
  const remaining = status?.progress?.remaining ?? 0;
  const total = status?.progress?.total ?? 0;
  const progressPct = total > 0 ? Math.round(((applied + failed) / total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-pixel" style={{ color: "var(--atari-cyan)", fontSize: "16px" }}>
            <Zap size={16} className="inline mr-2" style={{ color: "var(--atari-cyan)" }} />
            AUTO-APPLY
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
            Automated job application engine powered by LLM + Playwright
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <span className="flex items-center gap-1 px-3 py-1" style={{
              border: "1px solid var(--atari-green)",
              color: "var(--atari-green)",
              fontFamily: "Press Start 2P",
              fontSize: "8px",
            }}>
              <Loader2 size={10} className="animate-spin" /> RUNNING
            </span>
          ) : (
            <span className="px-3 py-1" style={{
              border: "1px solid var(--atari-gray)",
              color: "var(--atari-gray)",
              fontFamily: "Press Start 2P",
              fontSize: "8px",
            }}>
              IDLE
            </span>
          )}
        </div>
      </div>

      <div className="atari-divider mb-6" />

      {/* Controls */}
      <div className="mb-6 p-4" style={{ border: "1px solid var(--atari-border)", background: "rgba(0,255,255,0.02)" }}>
        <p className="font-pixel text-xs mb-4" style={{ color: "var(--atari-amber)", fontSize: "9px", letterSpacing: "0.1em" }}>
          LAUNCH CONTROLS
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
              Minimum Match Score
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="flex-1"
                style={{ accentColor: "var(--atari-amber)" }}
                disabled={isRunning}
              />
              <span className="font-pixel" style={{ color: "var(--atari-amber)", fontSize: "10px", minWidth: "30px", textAlign: "right" }}>
                {minScore}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
              Max Jobs to Process
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxJobs}
              onChange={(e) => setMaxJobs(Math.max(1, Math.min(100, Number(e.target.value))))}
              disabled={isRunning}
              className="w-full px-3 py-2 text-xs"
              style={{
                background: "var(--atari-black)",
                border: "1px solid var(--atari-border)",
                color: "var(--atari-white)",
                fontFamily: "Share Tech Mono",
                outline: "none",
              }}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={isRunning || startMutation.isPending}
            className="flex items-center gap-2 px-5 py-2"
            style={{
              background: isRunning ? "var(--atari-border)" : "transparent",
              border: "2px solid var(--atari-green)",
              color: isRunning ? "var(--atari-gray)" : "var(--atari-green)",
              fontFamily: "Press Start 2P",
              fontSize: "9px",
              cursor: isRunning ? "not-allowed" : "pointer",
              letterSpacing: "0.08em",
            }}
          >
            <Play size={12} /> START
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning || stopMutation.isPending}
            className="flex items-center gap-2 px-5 py-2"
            style={{
              background: "transparent",
              border: `2px solid ${isRunning ? "var(--atari-red)" : "var(--atari-border)"}`,
              color: isRunning ? "var(--atari-red)" : "var(--atari-gray)",
              fontFamily: "Press Start 2P",
              fontSize: "9px",
              cursor: !isRunning ? "not-allowed" : "pointer",
              letterSpacing: "0.08em",
            }}
          >
            <Square size={12} /> STOP
          </button>
        </div>
      </div>

      {/* Live Status */}
      {isRunning && (
        <div className="mb-6 p-4" style={{ border: "1px solid var(--atari-green)", background: "rgba(57,255,20,0.03)" }}>
          <p className="font-pixel text-xs mb-3" style={{ color: "var(--atari-green)", fontSize: "9px", letterSpacing: "0.1em" }}>
            <Activity size={12} className="inline mr-1" /> LIVE STATUS
          </p>

          {/* Current Job */}
          {status?.currentJob && (
            <div className="mb-3 px-3 py-2" style={{ background: "rgba(255,176,0,0.06)", border: "1px solid var(--atari-border)" }}>
              <p className="text-xs" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
                Now applying to:
              </p>
              <p className="text-xs font-bold" style={{ color: "var(--atari-amber)", fontFamily: "Share Tech Mono" }}>
                {status.currentJob}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
              <span>Progress: {applied + failed}/{total}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2" style={{ border: "1px solid var(--atari-border)" }}>
              <CheckCircle size={14} className="mx-auto mb-1" style={{ color: "var(--atari-green)" }} />
              <p className="font-pixel" style={{ color: "var(--atari-green)", fontSize: "12px" }}>{applied}</p>
              <p className="text-xs" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono", fontSize: "9px" }}>Applied</p>
            </div>
            <div className="text-center p-2" style={{ border: "1px solid var(--atari-border)" }}>
              <XCircle size={14} className="mx-auto mb-1" style={{ color: "var(--atari-red)" }} />
              <p className="font-pixel" style={{ color: "var(--atari-red)", fontSize: "12px" }}>{failed}</p>
              <p className="text-xs" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono", fontSize: "9px" }}>Failed</p>
            </div>
            <div className="text-center p-2" style={{ border: "1px solid var(--atari-border)" }}>
              <Clock size={14} className="mx-auto mb-1" style={{ color: "var(--atari-amber)" }} />
              <p className="font-pixel" style={{ color: "var(--atari-amber)", fontSize: "12px" }}>{remaining}</p>
              <p className="text-xs" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono", fontSize: "9px" }}>Remaining</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Log */}
      {isRunning && status?.log && status.log.length > 0 && (
        <div className="mb-6 p-4" style={{ border: "1px solid var(--atari-border)" }}>
          <p className="font-pixel text-xs mb-3" style={{ color: "var(--atari-amber)", fontSize: "9px", letterSpacing: "0.1em" }}>
            AGENT LOG
          </p>
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: "200px",
              background: "var(--atari-black)",
              padding: "8px",
              border: "1px solid var(--atari-border)",
              fontFamily: "Share Tech Mono",
              fontSize: "10px",
              color: "var(--atari-gray)",
              lineHeight: "1.6",
            }}
          >
            {status.log.map((line, i) => (
              <div key={i} style={{
                color: line.includes("SUCCESS") ? "var(--atari-green)" :
                       line.includes("FAILED") || line.includes("ERROR") ? "var(--atari-red)" :
                       line.includes("SKIP") ? "var(--atari-amber)" :
                       "var(--atari-gray)",
              }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="p-4" style={{ border: "1px solid var(--atari-border)" }}>
        <p className="font-pixel text-xs mb-3" style={{ color: "var(--atari-amber)", fontSize: "9px", letterSpacing: "0.1em" }}>
          APPLICATION HISTORY
        </p>

        {historyLoading ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
            Loading...
          </p>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle size={20} className="mx-auto mb-2" style={{ color: "var(--atari-gray)" }} />
            <p className="text-xs" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
              No applications yet. Start AutoApply to begin.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: "Share Tech Mono" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--atari-border)" }}>
                  <th className="text-left py-2 px-2" style={{ color: "var(--atari-gray)", fontSize: "9px", letterSpacing: "0.1em" }}>JOB</th>
                  <th className="text-left py-2 px-2" style={{ color: "var(--atari-gray)", fontSize: "9px" }}>COMPANY</th>
                  <th className="text-left py-2 px-2" style={{ color: "var(--atari-gray)", fontSize: "9px" }}>STATUS</th>
                  <th className="text-left py-2 px-2" style={{ color: "var(--atari-gray)", fontSize: "9px" }}>DURATION</th>
                  <th className="text-left py-2 px-2" style={{ color: "var(--atari-gray)", fontSize: "9px" }}>TIME</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid var(--atari-border)" }}>
                    <td className="py-2 px-2" style={{ color: "var(--atari-white)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.jobTitle || `Job #${entry.jobId}`}
                    </td>
                    <td className="py-2 px-2" style={{ color: "var(--atari-gray)" }}>
                      {entry.jobCompany || "—"}
                    </td>
                    <td className="py-2 px-2">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="py-2 px-2" style={{ color: "var(--atari-gray)" }}>
                      {entry.durationMs ? `${Math.round(entry.durationMs / 1000)}s` : "—"}
                    </td>
                    <td className="py-2 px-2" style={{ color: "var(--atari-gray)", fontSize: "9px" }}>
                      {entry.attemptedAt ? new Date(entry.attemptedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
