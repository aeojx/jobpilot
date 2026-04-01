import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Job } from "../../../drizzle/schema";
import {
  X,
  Check,
  MapPin,
  Building2,
  AtSign,
  Copy,
  ChevronDown,
  ChevronUp,
  Layers,
  BarChart2,
  ExternalLink,
  Briefcase,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ─── Constants ────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 80; // px before a swipe is committed
const ROTATION_FACTOR = 0.08; // degrees per px of horizontal drag

// ─── Types ────────────────────────────────────────────────────────────────────
type SwipeDirection = "left" | "right" | null;

interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

// ─── Score color helper ───────────────────────────────────────────────────────
function getScoreColor(score: number) {
  if (score >= 70) return "var(--atari-green)";
  if (score >= 40) return "var(--atari-amber)";
  return "var(--atari-red)";
}

// ─── Stats Panel Component ────────────────────────────────────────────────────
function StatsPanel({ onClose }: { onClose: () => void }) {
  const { data: stats, isLoading } = trpc.jobs.swipeStats.useQuery({ days: 7 });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--atari-surface)",
          border: "2px solid var(--atari-amber)",
          width: "100%",
          maxWidth: 420,
          padding: "1.5rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.7rem", color: "var(--atari-amber)", letterSpacing: "0.1em" }}>
            ▶ SWIPE STATS
          </h2>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--atari-gray)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
          >
            ✕
          </button>
        </div>
        <div style={{ height: 2, background: "var(--atari-red)", marginBottom: "1.25rem" }} />

        {isLoading ? (
          <div style={{ textAlign: "center", fontFamily: "var(--font-pixel)", fontSize: "0.6rem", color: "var(--atari-amber)", padding: "2rem 0" }}>
            LOADING...
          </div>
        ) : stats ? (
          <>
            {/* Today */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: "var(--font-pixel)", fontSize: "0.6rem", color: "var(--atari-cyan)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                TODAY
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <StatBox label="TOTAL" value={stats.today.total} color="var(--atari-white)" />
                <StatBox label="APPROVED" value={stats.today.approved} color="var(--atari-green)" />
                <StatBox label="REJECTED" value={stats.today.rejected} color="var(--atari-red)" />
              </div>
              {/* Approval rate bar */}
              {stats.today.total > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", marginBottom: "4px", letterSpacing: "0.05em" }}>
                    APPROVAL RATE: {Math.round((stats.today.approved / stats.today.total) * 100)}%
                  </div>
                  <div style={{ height: 6, background: "var(--atari-border)", position: "relative" }}>
                    <div style={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      width: `${(stats.today.approved / stats.today.total) * 100}%`,
                      background: "var(--atari-green)",
                      transition: "width 0.4s",
                    }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: "var(--atari-border)", marginBottom: "1.25rem" }} />

            {/* This Week */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: "var(--font-pixel)", fontSize: "0.6rem", color: "var(--atari-cyan)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                THIS WEEK (7 DAYS)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <StatBox label="TOTAL" value={stats.week.total} color="var(--atari-white)" />
                <StatBox label="APPROVED" value={stats.week.approved} color="var(--atari-green)" />
                <StatBox label="REJECTED" value={stats.week.rejected} color="var(--atari-red)" />
              </div>
              {stats.week.total > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", marginBottom: "4px", letterSpacing: "0.05em" }}>
                    APPROVAL RATE: {Math.round((stats.week.approved / stats.week.total) * 100)}%
                  </div>
                  <div style={{ height: 6, background: "var(--atari-border)", position: "relative" }}>
                    <div style={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      width: `${(stats.week.approved / stats.week.total) * 100}%`,
                      background: "var(--atari-green)",
                      transition: "width 0.4s",
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Daily breakdown */}
            {stats.history.length > 0 && (
              <>
                <div style={{ height: 1, background: "var(--atari-border)", marginBottom: "1.25rem" }} />
                <div>
                  <div style={{ fontFamily: "var(--font-pixel)", fontSize: "0.6rem", color: "var(--atari-cyan)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                    DAILY BREAKDOWN
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {[...stats.history]
                      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
                      .slice(0, 7)
                      .map((row) => (
                        <div key={row.dateKey} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", width: "5.5rem", flexShrink: 0 }}>
                            {row.dateKey}
                          </span>
                          <div style={{ flex: 1, height: 12, background: "var(--atari-border)", position: "relative", display: "flex" }}>
                            {(row.approved + row.rejected) > 0 && (
                              <>
                                <div style={{
                                  height: "100%",
                                  width: `${(row.approved / (row.approved + row.rejected)) * 100}%`,
                                  background: "var(--atari-green)",
                                }} />
                                <div style={{
                                  height: "100%",
                                  width: `${(row.rejected / (row.approved + row.rejected)) * 100}%`,
                                  background: "var(--atari-red)",
                                }} />
                              </>
                            )}
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-white)", width: "3rem", textAlign: "right", flexShrink: 0 }}>
                            {row.approved + row.rejected}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <div style={{ width: 10, height: 10, background: "var(--atari-green)" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--atari-gray)" }}>APPROVED</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <div style={{ width: 10, height: 10, background: "var(--atari-red)" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--atari-gray)" }}>REJECTED</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--atari-gray)", padding: "2rem 0" }}>
            NO SWIPE DATA YET
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ border: "1px solid var(--atari-border)", padding: "0.75rem 0.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-pixel)", fontSize: "1.1rem", color, lineHeight: 1, marginBottom: "0.4rem" }}>
        {value}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--atari-gray)", letterSpacing: "0.08em" }}>
        {label}
      </div>
    </div>
  );
}

// ─── Main SwipeView component ─────────────────────────────────────────────────
export default function SwipeView() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Fetch only matched jobs — sorted by matchScore DESC server-side
  const { data: matchedJobs, isLoading } = trpc.jobs.byStatus.useQuery({ status: "matched" });

  const moveStatus = trpc.jobs.moveStatus.useMutation({
    onSuccess: () => {
      utils.jobs.byStatus.invalidate({ status: "matched" });
      utils.jobs.kanban.invalidate();
      utils.jobs.swipeStats.invalidate();
    },
  });

  // Local queue — we pop from the front as cards are swiped
  const [queue, setQueue] = useState<Job[]>([]);
  const [swipedCount, setSwipedCount] = useState(0);
  const [showStats, setShowStats] = useState(false);
  // Undo stack: stores the last swiped job and the status it was moved to
  const [undoStack, setUndoStack] = useState<{ job: Job; previousStatus: "to_apply" | "rejected" }[]>([]);

  // Populate queue once data loads
  useEffect(() => {
    if (matchedJobs && queue.length === 0 && swipedCount === 0) {
      setQueue([...matchedJobs]);
    }
  }, [matchedJobs]);

  // Drag state for the top card
  const [drag, setDrag] = useState<DragState>({
    startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false,
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  const currentJob = queue[0] ?? null;
  const nextJob = queue[1] ?? null;

  // Derived drag values
  const deltaX = drag.isDragging ? drag.currentX - drag.startX : 0;
  const deltaY = drag.isDragging ? drag.currentY - drag.startY : 0;
  const rotation = deltaX * ROTATION_FACTOR;
  const swipeDir: SwipeDirection =
    deltaX > SWIPE_THRESHOLD ? "right" : deltaX < -SWIPE_THRESHOLD ? "left" : null;
  const swipeProgress = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1);

  // ─── Commit a swipe ──────────────────────────────────────────────────────
  const commitSwipe = useCallback(
    (dir: "left" | "right", job: Job) => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      const newStatus = dir === "right" ? "to_apply" : "rejected";
      const label = dir === "right" ? "TO APPLY ✓" : "REJECTED ✗";
      const color = dir === "right" ? "var(--atari-green)" : "var(--atari-red)";

      // Animate card off-screen
      if (cardRef.current) {
        const flyX = dir === "right" ? "120vw" : "-120vw";
        cardRef.current.style.transition = "transform 0.35s cubic-bezier(0.55, 0, 1, 0.45), opacity 0.35s";
        cardRef.current.style.transform = `translateX(${flyX}) rotate(${dir === "right" ? 30 : -30}deg)`;
        cardRef.current.style.opacity = "0";
      }

      setTimeout(() => {
        setQueue((prev) => prev.slice(1));
        setSwipedCount((c) => c + 1);
        setDrag({ startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false });
        // Push to undo stack (keep last 1 for simplicity)
        const previousStatus = dir === "right" ? "to_apply" : "rejected";
        setUndoStack([{ job, previousStatus }]);
        animatingRef.current = false;
        if (cardRef.current) {
          cardRef.current.style.transition = "";
          cardRef.current.style.transform = "";
          cardRef.current.style.opacity = "";
        }
      }, 350);

      moveStatus.mutate({ id: job.id, status: newStatus, fromSwipe: true });
      toast(label, {
        style: { background: "var(--atari-black)", border: `2px solid ${color}`, color },
        duration: 1200,
      });
    },
    [moveStatus]
  );

  // ─── Pointer events (mouse + touch) ─────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (animatingRef.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY, isDragging: true });
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.isDragging) return;
    setDrag((d) => ({ ...d, currentX: e.clientX, currentY: e.clientY }));
  }, [drag.isDragging]);

  const onPointerUp = useCallback(() => {
    if (!drag.isDragging || !currentJob) return;
    const dx = drag.currentX - drag.startX;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      commitSwipe(dx > 0 ? "right" : "left", currentJob);
    } else {
      // Snap back
      setDrag({ startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false });
    }
  }, [drag, currentJob, commitSwipe]);

  // ─── Undo last swipe ─────────────────────────────────────────────────────
  const undoSwipeMutation = trpc.jobs.undoSwipe.useMutation({
    onSuccess: () => {
      utils.jobs.byStatus.invalidate({ status: "matched" });
      utils.jobs.kanban.invalidate();
      utils.jobs.swipeStats.invalidate();
    },
  });

  const undoSwipe = useCallback(() => {
    if (undoStack.length === 0 || animatingRef.current) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setQueue((prev) => [last.job, ...prev]);
    setSwipedCount((c) => Math.max(0, c - 1));
    // Restore job to 'matched' and roll back swipe stat
    undoSwipeMutation.mutate({ id: last.job.id, previousStatus: last.previousStatus });
    toast("UNDO ↩ RESTORED", {
      style: { background: "var(--atari-black)", border: "2px solid var(--atari-amber)", color: "var(--atari-amber)" },
      duration: 1200,
    });
  }, [undoStack, undoSwipeMutation]);

  // ─── Keyboard support ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showStats) return;
      if (e.key === "ArrowRight" && currentJob) commitSwipe("right", currentJob);
      if (e.key === "ArrowLeft" && currentJob) commitSwipe("left", currentJob);
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) undoSwipe();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentJob, commitSwipe, showStats, undoSwipe]);

  // ─── Redirect non-owners ─────────────────────────────────────────────────
  if (user && user.role !== "admin") {
    navigate("/applier");
    return null;
  }

  const totalMatched = (matchedJobs?.length ?? 0) + swipedCount;
  const remaining = queue.length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--atari-black)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
        paddingBottom: "2rem",
        overflowX: "hidden",
      }}
    >
      {/* Stats modal */}
      {showStats && <StatsPanel onClose={() => setShowStats(false)} />}

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 480, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(0.7rem, 3vw, 1rem)",
              color: "var(--atari-amber)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            ▶ SWIPE MODE
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--atari-gray)",
              }}
            >
              {remaining} / {totalMatched} LEFT
            </span>
            {/* Stats button */}
            <button
              onClick={() => setShowStats(true)}
              title="View swipe statistics"
              style={{
                background: "transparent",
                border: "1px solid var(--atari-border)",
                color: "var(--atari-cyan)",
                cursor: "pointer",
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.05em",
              }}
            >
              <BarChart2 size={12} />
              STATS
            </button>
          </div>
        </div>
        {/* Red divider */}
        <div style={{ height: 2, background: "var(--atari-red)", width: "100%" }} />
        {/* Instruction row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.06em",
          }}
        >
          <span style={{ color: "var(--atari-red)", flexShrink: 0 }}>← REJECT</span>
          <span style={{ color: "var(--atari-border)", fontSize: "0.55rem", textAlign: "center", padding: "0 0.5rem" }}>MATCH SCORE ORDER</span>
          <span style={{ color: "var(--atari-green)", flexShrink: 0 }}>TO APPLY →</span>
        </div>
      </div>

      {/* Card stack area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          height: "clamp(460px, 68dvh, 640px)",
          marginBottom: "1.5rem",
        }}
      >
        {isLoading ? (
          <div
            style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid var(--atari-border)", background: "var(--atari-surface)",
            }}
          >
            <span style={{ fontFamily: "var(--font-pixel)", fontSize: "0.7rem", color: "var(--atari-amber)" }}>
              LOADING...
            </span>
          </div>
        ) : queue.length === 0 ? (
          /* Empty state */
          <div
            style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "1rem",
              border: "2px solid var(--atari-border)", background: "var(--atari-surface)",
            }}
          >
            <Layers size={48} color="var(--atari-gray)" />
            <p style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--atari-amber)", textAlign: "center", lineHeight: 2 }}>
              {swipedCount > 0
                ? `ALL ${swipedCount} JOBS REVIEWED!\nFETCH MORE TO CONTINUE.`
                : "NO MATCHED JOBS.\nFETCH JOBS FIRST."}
            </p>
            {swipedCount > 0 && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--atari-gray)", textAlign: "center" }}>
                <div>✓ {swipedCount} jobs processed</div>
              </div>
            )}
            <button
              onClick={() => setShowStats(true)}
              style={{
                marginTop: "0.5rem",
                background: "transparent",
                border: "1px solid var(--atari-cyan)",
                color: "var(--atari-cyan)",
                cursor: "pointer",
                padding: "6px 14px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <BarChart2 size={12} />
              VIEW STATS
            </button>
          </div>
        ) : (
          <>
            {/* Background card (next job) — silhouette only, NO text so it never bleeds through */}
            {nextJob && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: "scale(0.95) translateY(14px)",
                  transformOrigin: "bottom center",
                  border: "2px solid var(--atari-border)",
                  background: "var(--atari-surface)",
                  pointerEvents: "none",
                  opacity: 0.45,
                  overflow: "hidden",
                }}
              >
                {/* Only show score badge — no title/company/location text */}
                {(nextJob.matchScore ?? 0) > 0 && (
                  <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}>
                    <span style={{
                      fontFamily: "var(--font-pixel)",
                      fontSize: "0.5rem",
                      color: getScoreColor(Math.round(nextJob.matchScore ?? 0)),
                      border: `1px solid ${getScoreColor(Math.round(nextJob.matchScore ?? 0))}`,
                      padding: "2px 5px",
                      display: "inline-block",
                    }}>
                      {Math.round(nextJob.matchScore ?? 0)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Top card — draggable */}
            <div
              ref={cardRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                position: "absolute",
                inset: 0,
                transform: drag.isDragging
                  ? `translateX(${deltaX}px) translateY(${deltaY * 0.15}px) rotate(${rotation}deg)`
                  : "none",
                transition: drag.isDragging ? "none" : "transform 0.2s ease",
                border: `2px solid ${
                  swipeDir === "right"
                    ? "var(--atari-green)"
                    : swipeDir === "left"
                    ? "var(--atari-red)"
                    : "var(--atari-border)"
                }`,
                background: "var(--atari-surface)",
                cursor: drag.isDragging ? "grabbing" : "grab",
                userSelect: "none",
                touchAction: "none",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow:
                  swipeDir === "right"
                    ? "0 0 30px rgba(0,255,128,0.25)"
                    : swipeDir === "left"
                    ? "0 0 30px rgba(255,60,60,0.25)"
                    : "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              {/* Swipe direction overlay labels */}
              {swipeDir === "right" && (
                <div
                  style={{
                    position: "absolute", top: 24, left: 20, zIndex: 10,
                    border: "3px solid var(--atari-green)", padding: "4px 12px",
                    transform: "rotate(-15deg)",
                    opacity: swipeProgress,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-pixel)", fontSize: "0.75rem", color: "var(--atari-green)", letterSpacing: "0.1em" }}>
                    TO APPLY ✓
                  </span>
                </div>
              )}
              {swipeDir === "left" && (
                <div
                  style={{
                    position: "absolute", top: 24, right: 20, zIndex: 10,
                    border: "3px solid var(--atari-red)", padding: "4px 12px",
                    transform: "rotate(15deg)",
                    opacity: swipeProgress,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-pixel)", fontSize: "0.75rem", color: "var(--atari-red)", letterSpacing: "0.1em" }}>
                    REJECT ✗
                  </span>
                </div>
              )}

              {/* ── Card content: strict top-to-bottom, no overlap ── */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* ── ZONE 1: Match score badge (full-width top bar) ── */}
                {(currentJob.matchScore ?? 0) > 0 && (
                  <div style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    padding: "0.5rem 1.25rem 0",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-pixel)",
                      fontSize: "0.65rem",
                      color: getScoreColor(Math.round(currentJob.matchScore ?? 0)),
                      border: `1px solid ${getScoreColor(Math.round(currentJob.matchScore ?? 0))}`,
                      padding: "3px 8px",
                      letterSpacing: "0.1em",
                    }}>
                      MATCH: {Math.round(currentJob.matchScore ?? 0)}%
                    </span>
                  </div>
                )}

                {/* ── ZONE 2: Job title ── */}
                <div style={{ flexShrink: 0, padding: "0.6rem 1.25rem 0" }}>
                  <h2 style={{
                    fontFamily: "var(--font-pixel)",
                    fontSize: "clamp(0.8rem, 2.8vw, 1rem)",
                    color: "var(--atari-white)",
                    lineHeight: 1.5,
                    letterSpacing: "0.05em",
                    margin: 0,
                    wordBreak: "break-word",
                  }}>
                    {currentJob.title}
                  </h2>
                </div>

                {/* ── ZONE 3: Company ── */}
                <div style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 1.25rem 0",
                }}>
                  <Building2 size={13} color="var(--atari-amber)" style={{ flexShrink: 0 }} />
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    color: "var(--atari-amber)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: "bold",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {currentJob.company}
                  </span>
                </div>

                {/* ── ZONE 4: Location ── */}
                <div style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.3rem 1.25rem 0",
                }}>
                  <MapPin size={12} color={currentJob.location ? "var(--atari-cyan)" : "var(--atari-border)"} style={{ flexShrink: 0 }} />
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    color: currentJob.location ? "var(--atari-cyan)" : "var(--atari-border)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {currentJob.location ?? "LOCATION NOT SPECIFIED"}
                  </span>
                </div>

                {/* ── ZONE 5: Tags row ── */}
                <div style={{
                  flexShrink: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.35rem",
                  padding: "0.5rem 1.25rem 0",
                }}>
                  {currentJob.source && (
                    <span className="brutal-tag" style={{ borderColor: "var(--atari-cyan)", color: "var(--atari-cyan)", fontSize: "0.58rem" }}>
                      <Briefcase size={8} style={{ display: "inline", marginRight: 3 }} />
                      {currentJob.source}
                    </span>
                  )}
                  {currentJob.hasEmail && (
                    <span className="brutal-tag" style={{ borderColor: "var(--atari-green)", color: "var(--atari-green)", fontSize: "0.58rem", display: "flex", alignItems: "center", gap: "3px" }}>
                      <AtSign size={8} />EMAIL
                    </span>
                  )}
                  {currentJob.isDuplicate && (
                    <span className="brutal-tag" style={{ borderColor: "var(--atari-magenta)", color: "var(--atari-magenta)", fontSize: "0.58rem", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Copy size={8} />DUPE
                    </span>
                  )}
                </div>

                {/* ── Divider ── */}
                <div style={{ flexShrink: 0, height: 1, background: "var(--atari-red)", margin: "0.6rem 1.25rem" }} />

                {/* ── ZONE 6: Description (scrollable, takes remaining space) ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0 1.25rem" }}>
                  {currentJob.description ? (
                    <>
                      <p style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.67rem",
                        color: "#ffffff",
                        lineHeight: 1.75,
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}>
                        {currentJob.description}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.67rem", color: "var(--atari-border)", fontStyle: "italic", margin: 0 }}>
                      No description available.
                    </p>
                  )}
                </div>

                {/* ── ZONE 7: Apply link (pinned to bottom of card) ── */}
                {currentJob.applyUrl && (
                  <div style={{ flexShrink: 0, borderTop: "1px solid var(--atari-border)", padding: "0.5rem 1.25rem" }}>
                    <a
                      href={currentJob.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.63rem",
                        color: "var(--atari-amber)",
                        textDecoration: "none",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <ExternalLink size={11} />
                      VIEW FULL JOB POSTING
                    </a>
                  </div>
                )}
              </div>

              {/* Bottom progress bar */}
              <div
                style={{
                  height: 4,
                  background: "var(--atari-border)",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${totalMatched > 0 ? ((swipedCount / totalMatched) * 100) : 0}%`,
                    background: "var(--atari-amber)",
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      {queue.length > 0 && !isLoading && (
        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            maxWidth: 480,
          }}
        >
          {/* Reject button */}
          <button
            onClick={() => currentJob && commitSwipe("left", currentJob)}
            disabled={animatingRef.current}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "3px solid var(--atari-red)",
              background: "transparent",
              color: "var(--atari-red)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              boxShadow: "0 0 16px rgba(255,60,60,0.2)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,60,60,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <X size={28} strokeWidth={3} />
          </button>

          {/* Center: remaining count + undo button */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ fontFamily: "var(--font-pixel)", fontSize: "1.2rem", color: "var(--atari-white)", lineHeight: 1 }}>
              {remaining}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", letterSpacing: "0.1em" }}>
              LEFT
            </div>
            {/* Undo button */}
            <button
              onClick={undoSwipe}
              disabled={undoStack.length === 0}
              title="Undo last swipe (Ctrl+Z)"
              style={{
                background: "transparent",
                border: `1px solid ${undoStack.length > 0 ? "var(--atari-amber)" : "var(--atari-border)"}`,
                color: undoStack.length > 0 ? "var(--atari-amber)" : "var(--atari-border)",
                cursor: undoStack.length > 0 ? "pointer" : "not-allowed",
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                letterSpacing: "0.05em",
                transition: "all 0.15s",
              }}
            >
              <Undo2 size={11} />
              UNDO
            </button>
          </div>

          {/* Apply button */}
          <button
            onClick={() => currentJob && commitSwipe("right", currentJob)}
            disabled={animatingRef.current}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "3px solid var(--atari-green)",
              background: "transparent",
              color: "var(--atari-green)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              boxShadow: "0 0 16px rgba(0,255,128,0.2)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,255,128,0.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Check size={28} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Keyboard hint — desktop only */}
      <div
        style={{
          marginTop: "1rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "var(--atari-border)",
          letterSpacing: "0.08em",
          textAlign: "center",
        }}
        className="hidden md:block"
      >
        KEYBOARD: ← REJECT &nbsp;|&nbsp; → TO APPLY &nbsp;|&nbsp; CTRL+Z UNDO
      </div>
    </div>
  );
}
