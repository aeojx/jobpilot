import { trpc } from "@/lib/trpc";

/**
 * CampaignBar — persistent top bar showing 1,000-job campaign progress.
 * Uses publicProcedure so it works for all users (owner + applier).
 */
export default function CampaignBar() {
  const { data } = trpc.stats.campaign.useQuery(undefined, {
    refetchInterval: 60_000, // refresh every minute
    staleTime: 30_000,
  });

  if (!data) return null;

  const { totalApplied, remaining, pct } = data;
  const isComplete = remaining === 0;

  return (
    <div
      style={{
        background: "oklch(0.08 0.01 240)",
        borderBottom: "1px solid var(--atari-border, oklch(0.2 0 0))",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily: "Press Start 2P, monospace",
          fontSize: "0.55rem",
          letterSpacing: "0.12em",
          color: isComplete ? "var(--atari-green, #00ff88)" : "var(--atari-amber, #ffb300)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        🎯 1000 Jobs
      </span>

      {/* Progress bar */}
      <div
        style={{
          flex: 1,
          height: "6px",
          background: "oklch(0.15 0 0)",
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
              ? "var(--atari-green, #00ff88)"
              : "linear-gradient(90deg, var(--atari-amber, #ffb300), var(--atari-cyan, #00e5ff))",
            borderRadius: "3px",
            transition: "width 0.6s ease",
          }}
        />
      </div>

      {/* Stats */}
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.7rem",
          color: "oklch(0.7 0 0)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "var(--atari-cyan, #00e5ff)", fontWeight: 700 }}>{totalApplied.toLocaleString()}</span>
        {" / 1,000"}
      </span>

      {/* Remaining badge */}
      <span
        style={{
          fontFamily: "Press Start 2P, monospace",
          fontSize: "0.55rem",
          letterSpacing: "0.08em",
          color: isComplete ? "var(--atari-green, #00ff88)" : "oklch(0.55 0 0)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {isComplete ? "✅ GOAL MET!" : `${remaining.toLocaleString()} left`}
      </span>
    </div>
  );
}
