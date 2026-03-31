import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Job } from "../../../drizzle/schema";
import {
  X,
  Check,
  MapPin,
  Building2,
  Zap,
  AtSign,
  Copy,
  ChevronDown,
  ChevronUp,
  Layers,
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

// ─── Main SwipeView component ─────────────────────────────────────────────────
export default function SwipeView() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Fetch only matched jobs
  const { data: matchedJobs, isLoading } = trpc.jobs.byStatus.useQuery({ status: "matched" });

  const moveStatus = trpc.jobs.moveStatus.useMutation({
    onSuccess: () => {
      utils.jobs.byStatus.invalidate({ status: "matched" });
      utils.jobs.kanban.invalidate();
    },
  });

  // Local queue — we pop from the front as cards are swiped
  const [queue, setQueue] = useState<Job[]>([]);
  const [swipedCount, setSwipedCount] = useState(0);
  const [showDesc, setShowDesc] = useState(false);

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
        setShowDesc(false);
        setDrag({ startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false });
        animatingRef.current = false;
        if (cardRef.current) {
          cardRef.current.style.transition = "";
          cardRef.current.style.transform = "";
          cardRef.current.style.opacity = "";
        }
      }, 350);

      moveStatus.mutate({ id: job.id, status: newStatus });
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
    setShowDesc(false);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.isDragging) return;
    setDrag((d) => ({ ...d, currentX: e.clientX, currentY: e.clientY }));
  }, [drag.isDragging]);

  const onPointerUp = useCallback(() => {
    if (!drag.isDragging || !currentJob) return;
    const dx = drag.currentX - drag.startX;
    const dy = drag.currentY - drag.startY;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      commitSwipe(dx > 0 ? "right" : "left", currentJob);
    } else {
      // Snap back
      setDrag({ startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false });
    }
  }, [drag, currentJob, commitSwipe]);

  // ─── Keyboard support ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!currentJob) return;
      if (e.key === "ArrowRight") commitSwipe("right", currentJob);
      if (e.key === "ArrowLeft") commitSwipe("left", currentJob);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentJob, commitSwipe]);

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
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--atari-gray)",
            }}
          >
            {remaining} / {totalMatched} REMAINING
          </span>
        </div>
        {/* Red divider */}
        <div style={{ height: 2, background: "var(--atari-red)", width: "100%" }} />
        {/* Instruction row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--atari-gray)",
            letterSpacing: "0.08em",
          }}
        >
          <span style={{ color: "var(--atari-red)" }}>← SWIPE LEFT = REJECT</span>
          <span style={{ color: "var(--atari-green)" }}>SWIPE RIGHT = TO APPLY →</span>
        </div>
      </div>

      {/* Card stack area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          height: "clamp(420px, 65dvh, 600px)",
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
          </div>
        ) : (
          <>
            {/* Background card (next job) — static, slightly scaled down */}
            {nextJob && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: "scale(0.95) translateY(12px)",
                  transformOrigin: "bottom center",
                  border: "2px solid var(--atari-border)",
                  background: "var(--atari-surface)",
                  borderRadius: 0,
                  pointerEvents: "none",
                  opacity: 0.6,
                }}
              />
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

              {/* Card content */}
              <div style={{ flex: 1, overflowY: showDesc ? "auto" : "hidden", padding: "1.5rem" }}>
                {/* Match score badge */}
                {(currentJob.matchScore ?? 0) > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-pixel)",
                        fontSize: "0.65rem",
                        color: getScoreColor(Math.round(currentJob.matchScore ?? 0)),
                        border: `1px solid ${getScoreColor(Math.round(currentJob.matchScore ?? 0))}`,
                        padding: "2px 8px",
                        letterSpacing: "0.1em",
                      }}
                    >
                      MATCH: {Math.round(currentJob.matchScore ?? 0)}%
                    </span>
                  </div>
                )}

                {/* Title */}
                <h2
                  style={{
                    fontFamily: "var(--font-pixel)",
                    fontSize: "clamp(0.65rem, 2.5vw, 0.9rem)",
                    color: "var(--atari-white)",
                    lineHeight: 1.6,
                    marginBottom: "0.5rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  {currentJob.title}
                </h2>

                {/* Company */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                  <Building2 size={12} color="var(--atari-gray)" />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--atari-gray)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {currentJob.company}
                  </span>
                </div>

                {/* Location */}
                {currentJob.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
                    <MapPin size={12} color="var(--atari-cyan)" />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        color: "var(--atari-cyan)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {currentJob.location}
                    </span>
                  </div>
                )}

                {/* Tags row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
                  {currentJob.source && (
                    <span className="brutal-tag" style={{ borderColor: "var(--atari-cyan)", color: "var(--atari-cyan)", fontSize: "0.6rem" }}>
                      {currentJob.source}
                    </span>
                  )}
                  {currentJob.hasEmail && (
                    <span className="brutal-tag" style={{ borderColor: "var(--atari-green)", color: "var(--atari-green)", fontSize: "0.6rem", display: "flex", alignItems: "center", gap: "3px" }}>
                      <AtSign size={8} />EMAIL
                    </span>
                  )}
                  {currentJob.isDuplicate && (
                    <span className="brutal-tag" style={{ borderColor: "var(--atari-magenta)", color: "var(--atari-magenta)", fontSize: "0.6rem", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Copy size={8} />DUPE
                    </span>
                  )}
                </div>

                {/* Red divider */}
                <div style={{ height: 1, background: "var(--atari-red)", marginBottom: "0.75rem" }} />

                {/* Description excerpt / full */}
                {currentJob.description && (
                  <>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        color: "var(--atari-gray)",
                        lineHeight: 1.7,
                        overflow: showDesc ? "visible" : "hidden",
                        display: showDesc ? "block" : "-webkit-box",
                        WebkitLineClamp: showDesc ? undefined : 5,
                        WebkitBoxOrient: "vertical" as const,
                      }}
                    >
                      {currentJob.description.slice(0, showDesc ? 2000 : 600)}
                      {!showDesc && currentJob.description.length > 600 && "..."}
                    </p>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setShowDesc((s) => !s); }}
                      style={{
                        marginTop: "0.5rem",
                        background: "transparent",
                        border: "none",
                        color: "var(--atari-amber)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: 0,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {showDesc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {showDesc ? "SHOW LESS" : "READ MORE"}
                    </button>
                  </>
                )}

                {/* Apply URL */}
                {currentJob.applyUrl && (
                  <a
                    href={currentJob.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "inline-block",
                      marginTop: "0.75rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: "var(--atari-amber)",
                      textDecoration: "underline",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ↗ VIEW JOB POSTING
                  </a>
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

          {/* Center: remaining count */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-pixel)", fontSize: "1.2rem", color: "var(--atari-white)", lineHeight: 1 }}>
              {remaining}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", letterSpacing: "0.1em", marginTop: "4px" }}>
              LEFT
            </div>
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
        KEYBOARD: ← REJECT &nbsp;|&nbsp; → TO APPLY
      </div>
    </div>
  );
}
