import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart2, Trophy } from "lucide-react";

const RAMP_SCHEDULE = [
  { label: "Days 1–5", target: 10, days: "1-5" },
  { label: "Week 2", target: 20, days: "6-12" },
  { label: "Week 3", target: 40, days: "13-19" },
  { label: "Week 4+", target: 80, days: "20+" },
];

export default function Performance() {
  const { user } = useAuth();
  const isOwner = user?.role === "admin";

  const { data: todayStats } = trpc.stats.today.useQuery();
  const { data: recentStats = [] } = trpc.stats.recent.useQuery();
  const { data: sourceData } = trpc.stats.sourceBreakdown.useQuery();
  const today = todayStats?.appliedCount ?? 0;
  const target = todayStats?.targetCount ?? 10;
  const pct = Math.min(100, Math.round((today / target) * 100));
  const isComplete = today >= target;

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "Press Start 2P, monospace", letterSpacing: "0.05em" }}
          >
            Performance
          </h2>
        </div>
        <div className="atari-divider" />
      </div>

      <div className="flex-1 px-5 pb-5 space-y-5">
        {/* Today's Progress */}
        <div
          className="p-5"
          style={{
            background: "var(--atari-panel)",
            border: `2px solid ${isComplete ? "var(--atari-green)" : "var(--atari-border)"}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                color: "oklch(0.45 0 0)",
                textTransform: "uppercase",
              }}
            >
              Today's Progress
            </p>
            {isComplete && (
              <span
                className="brutal-tag"
                style={{ borderColor: "var(--atari-green)", color: "var(--atari-green)" }}
              >
                <Trophy size={9} /> Target Met!
              </span>
            )}
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span
              className="font-black"
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "3.5rem",
                lineHeight: 1,
                color: isComplete ? "var(--atari-green)" : "var(--atari-white)",
              }}
            >
              {today}
            </span>
            <span
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "1.5rem",
                color: "oklch(0.35 0 0)",
                marginBottom: 4,
              }}
            >
              / {target}
            </span>
            <span
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                color: "var(--atari-gray)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Applied
            </span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${isComplete ? "complete" : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p
            className="mt-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "oklch(0.35 0 0)",
            }}
          >
            {pct}% complete · {Math.max(0, target - today)} remaining
          </p>
        </div>

        {/* Ramp-Up Schedule */}
        <div>
          <p
            className="mb-3"
            style={{
              fontFamily: "Press Start 2P, monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              color: "oklch(0.45 0 0)",
              textTransform: "uppercase",
            }}
          >
            Ramp-Up Schedule
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RAMP_SCHEDULE.map((phase) => {
              const isCurrent = target === phase.target;
              return (
                <div
                  key={phase.label}
                  className="p-3 text-center"
                  style={{
                    background: isCurrent ? "oklch(0.1 0 0)" : "oklch(0.06 0 0)",
                    border: `1.5px solid ${isCurrent ? "var(--atari-amber)" : "var(--atari-border)"}`,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: isCurrent ? "var(--atari-amber)" : "oklch(0.5 0 0)",
                      lineHeight: 1,
                    }}
                  >
                    {phase.target}
                  </p>
                  <p
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.6rem",
                      color: isCurrent ? "var(--atari-white)" : "oklch(0.35 0 0)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginTop: 2,
                    }}
                  >
                    {phase.label}
                  </p>
                  {isCurrent && (
                    <span
                      className="brutal-tag mt-1"
                      style={{ borderColor: "var(--atari-amber)", color: "var(--atari-amber)", fontSize: "0.55rem" }}
                    >
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Breakdown */}
        {sourceData && sourceData.total > 0 && (
          <div
            className="p-5"
            style={{ background: "var(--atari-panel)", border: "2px solid var(--atari-border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={14} style={{ color: "var(--atari-cyan)" }} />
              <p style={{ fontFamily: "Press Start 2P, monospace", fontSize: "0.7rem", letterSpacing: "0.12em", color: "oklch(0.45 0 0)", textTransform: "uppercase" }}>
                Applied by Source
              </p>
            </div>
            {/* Bar chart */}
            <div className="space-y-3">
              {[
                { label: "LINKEDIN", count: sourceData.linkedin, color: "#0a66c2" },
                { label: "EXTERNAL", count: sourceData.external, color: "var(--atari-cyan)" },
                { label: "MANUAL",   count: sourceData.manual,   color: "var(--atari-amber)" },
              ].map(({ label, count, color }) => {
                const barPct = sourceData.total > 0 ? Math.round((count / sourceData.total) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", width: 64, flexShrink: 0, letterSpacing: "0.06em" }}>
                      {label}
                    </span>
                    <div style={{ flex: 1, height: 14, background: "var(--atari-border)", position: "relative" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${barPct}%`, background: color, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color, width: 40, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>
                      {count}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", width: 36, textAlign: "right", flexShrink: 0 }}>
                      {barPct}%
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Total */}
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--atari-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", letterSpacing: "0.08em" }}>TOTAL APPLIED</span>
              <span style={{ fontFamily: "Press Start 2P, monospace", fontSize: "1rem", color: "var(--atari-white)" }}>{sourceData.total}</span>
            </div>
          </div>
        )}

        {/* Recent History */}
        {recentStats.length > 0 && (
          <div>
            <p
              className="mb-3"
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                color: "oklch(0.45 0 0)",
                textTransform: "uppercase",
              }}
            >
              Recent History
            </p>
            <div className="space-y-2">
              {recentStats.slice(0, 10).map((stat) => {
                const pct = Math.min(100, Math.round((stat.appliedCount / stat.targetCount) * 100));
                const met = stat.appliedCount >= stat.targetCount;
                return (
                  <div key={stat.dateKey} className="flex items-center gap-3">
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        color: "var(--atari-gray)",
                        width: 90,
                        flexShrink: 0,
                      }}
                    >
                      {stat.dateKey}
                    </span>
                    <div className="flex-1 progress-track">
                      <div
                        className={`progress-fill ${met ? "complete" : ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        color: met ? "var(--atari-green)" : "oklch(0.5 0 0)",
                        width: 50,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {stat.appliedCount}/{stat.targetCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
