import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart2 } from "lucide-react";

export default function Performance() {
  const { user } = useAuth();

  const { data: recentStats = [] } = trpc.stats.recent.useQuery();
  const { data: sourceData } = trpc.stats.sourceBreakdown.useQuery();

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
              {recentStats.slice(0, 14).map((stat) => (
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
                      className="progress-fill"
                      style={{ width: `${Math.min(100, stat.appliedCount * 2)}%` }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      color: stat.appliedCount > 0 ? "var(--atari-green)" : "oklch(0.5 0 0)",
                      width: 40,
                      textAlign: "right",
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    {stat.appliedCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
