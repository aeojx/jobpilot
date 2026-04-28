import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

/**
 * CampaignBar — sticky top bar visible on all pages showing 1,000-job campaign progress.
 * Shows: applied today, total applied, progress bar, and remaining to hit 1,000.
 */
export default function CampaignBar() {
  const { data } = trpc.stats.campaign.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (!data) return null;

  const { totalApplied, remaining, pct, appliedToday } = data;
  const isComplete = remaining === 0;

  return (
    <Link href="/performance">
      <div
        style={{
          background: "oklch(0.07 0.015 240)",
          borderBottom: "1px solid oklch(0.18 0.02 240)",
          padding: "5px 16px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexShrink: 0,
          cursor: "pointer",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* 🎯 Label */}
        <span
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "0.5rem",
            letterSpacing: "0.1em",
            color: isComplete ? "#00ff88" : "#ffb300",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          🎯 1000 JOBS
        </span>

        {/* Applied today pill */}
        <span
          style={{
            background: "oklch(0.15 0.04 200)",
            border: "1px solid oklch(0.25 0.06 200)",
            borderRadius: "4px",
            padding: "2px 8px",
            fontFamily: "monospace",
            fontSize: "0.7rem",
            color: "#00e5ff",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          ✅ <strong>{appliedToday}</strong> applied today
        </span>

        {/* Progress bar */}
        <div
          style={{
            flex: 1,
            height: "5px",
            background: "oklch(0.14 0 0)",
            borderRadius: "3px",
            overflow: "hidden",
            minWidth: "60px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: isComplete
                ? "#00ff88"
                : "linear-gradient(90deg, #ffb300, #00e5ff)",
              borderRadius: "3px",
              transition: "width 0.6s ease",
            }}
          />
        </div>

        {/* Total applied */}
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.7rem",
            color: "oklch(0.65 0 0)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "#00e5ff", fontWeight: 700 }}>{totalApplied.toLocaleString()}</span>
          {" / 1,000"}
        </span>

        {/* Remaining badge */}
        <span
          style={{
            background: isComplete ? "oklch(0.15 0.06 145)" : "oklch(0.12 0.02 30)",
            border: `1px solid ${isComplete ? "oklch(0.3 0.1 145)" : "oklch(0.22 0.04 30)"}`,
            borderRadius: "4px",
            padding: "2px 8px",
            fontFamily: "monospace",
            fontSize: "0.7rem",
            color: isComplete ? "#00ff88" : "#ff8c42",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {isComplete ? "✅ GOAL MET!" : `🎯 ${remaining.toLocaleString()} remaining`}
        </span>
      </div>
    </Link>
  );
}
