import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart2, Flame, Star, Trophy, Zap } from "lucide-react";

const TIERS = [
  { name: "Rookie", minXp: 0, color: "oklch(0.55 0 0)" },
  { name: "Grinder", minXp: 100, color: "oklch(0.75 0.18 65)" },
  { name: "Machine", minXp: 500, color: "oklch(0.6 0.15 200)" },
  { name: "Legend", minXp: 2000, color: "oklch(0.5 0.22 27)" },
];

function getTier(xp: number) {
  return [...TIERS].reverse().find((t) => xp >= t.minXp) ?? TIERS[0];
}

function getNextTier(xp: number) {
  return TIERS.find((t) => xp < t.minXp);
}

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
  const { data: gami } = trpc.stats.gamification.useQuery();

  const today = todayStats?.appliedCount ?? 0;
  const target = todayStats?.targetCount ?? 10;
  const pct = Math.min(100, Math.round((today / target) * 100));
  const isComplete = today >= target;

  const tier = getTier(gami?.totalXp ?? 0);
  const nextTier = getNextTier(gami?.totalXp ?? 0);
  const xpToNext = nextTier ? nextTier.minXp - (gami?.totalXp ?? 0) : 0;

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.05em" }}
          >
            Performance
          </h2>
        </div>
        <div className="brutal-divider" />
      </div>

      <div className="flex-1 px-5 pb-5 space-y-5">
        {/* Today's Progress */}
        <div
          className="p-5"
          style={{
            background: "oklch(0.07 0 0)",
            border: `2px solid ${isComplete ? "oklch(0.65 0.18 145)" : "oklch(0.2 0 0)"}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              style={{
                fontFamily: "var(--font-condensed)",
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
                style={{ borderColor: "oklch(0.65 0.18 145)", color: "oklch(0.65 0.18 145)" }}
              >
                <Trophy size={9} /> Target Met!
              </span>
            )}
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span
              className="font-black"
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "3.5rem",
                lineHeight: 1,
                color: isComplete ? "oklch(0.65 0.18 145)" : "oklch(0.98 0 0)",
              }}
            >
              {today}
            </span>
            <span
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "1.5rem",
                color: "oklch(0.35 0 0)",
                marginBottom: 4,
              }}
            >
              / {target}
            </span>
            <span
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                color: "oklch(0.4 0 0)",
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

        {/* Gamification */}
        {gami && (
          <div
            className="p-5"
            style={{ background: "oklch(0.07 0 0)", border: "1.5px solid oklch(0.2 0 0)" }}
          >
            <p
              className="mb-4"
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                color: "oklch(0.45 0 0)",
                textTransform: "uppercase",
              }}
            >
              Applier Stats
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Tier */}
              <div
                className="p-3 text-center"
                style={{ background: "oklch(0.1 0 0)", border: `1.5px solid ${tier.color}` }}
              >
                <Trophy size={18} style={{ color: tier.color, margin: "0 auto 4px" }} />
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: tier.color,
                    letterSpacing: "0.05em",
                  }}
                >
                  {tier.name}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "0.6rem",
                    color: "oklch(0.35 0 0)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Tier
                </p>
              </div>

              {/* XP */}
              <div
                className="p-3 text-center"
                style={{ background: "oklch(0.1 0 0)", border: "1.5px solid oklch(0.5 0.22 27)" }}
              >
                <Zap size={18} style={{ color: "oklch(0.5 0.22 27)", margin: "0 auto 4px" }} />
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "oklch(0.98 0 0)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {gami.totalXp}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "0.6rem",
                    color: "oklch(0.35 0 0)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Total XP
                </p>
              </div>

              {/* Streak */}
              <div
                className="p-3 text-center"
                style={{ background: "oklch(0.1 0 0)", border: "1.5px solid oklch(0.75 0.18 65)" }}
              >
                <Flame size={18} style={{ color: "oklch(0.75 0.18 65)", margin: "0 auto 4px" }} />
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "oklch(0.98 0 0)",
                  }}
                >
                  {gami.currentStreak}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "0.6rem",
                    color: "oklch(0.35 0 0)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Day Streak
                </p>
              </div>

              {/* Best Streak */}
              <div
                className="p-3 text-center"
                style={{ background: "oklch(0.1 0 0)", border: "1.5px solid oklch(0.6 0.15 200)" }}
              >
                <Star size={18} style={{ color: "oklch(0.6 0.15 200)", margin: "0 auto 4px" }} />
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "oklch(0.98 0 0)",
                  }}
                >
                  {gami.longestStreak}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "0.6rem",
                    color: "oklch(0.35 0 0)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Best Streak
                </p>
              </div>
            </div>

            {/* XP to next tier */}
            {nextTier && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <p
                    style={{
                      fontFamily: "var(--font-condensed)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      color: "oklch(0.4 0 0)",
                      textTransform: "uppercase",
                    }}
                  >
                    Progress to {nextTier.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: "oklch(0.4 0 0)",
                    }}
                  >
                    {xpToNext} XP needed
                  </p>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.round(((gami.totalXp - tier.minXp) / (nextTier.minXp - tier.minXp)) * 100)}%`,
                      background: nextTier.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ramp-Up Schedule */}
        <div>
          <p
            className="mb-3"
            style={{
              fontFamily: "var(--font-condensed)",
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
                    border: `1.5px solid ${isCurrent ? "oklch(0.5 0.22 27)" : "oklch(0.15 0 0)"}`,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-condensed)",
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: isCurrent ? "oklch(0.5 0.22 27)" : "oklch(0.5 0 0)",
                      lineHeight: 1,
                    }}
                  >
                    {phase.target}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-condensed)",
                      fontSize: "0.6rem",
                      color: isCurrent ? "oklch(0.98 0 0)" : "oklch(0.35 0 0)",
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
                      style={{ borderColor: "oklch(0.5 0.22 27)", color: "oklch(0.5 0.22 27)", fontSize: "0.55rem" }}
                    >
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent History */}
        {recentStats.length > 0 && (
          <div>
            <p
              className="mb-3"
              style={{
                fontFamily: "var(--font-condensed)",
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
                        color: "oklch(0.4 0 0)",
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
                        color: met ? "oklch(0.65 0.18 145)" : "oklch(0.5 0 0)",
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
