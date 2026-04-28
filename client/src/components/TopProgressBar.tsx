import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * TopProgressBar — shows a slim animated bar at the very top of the viewport
 * when jobs are being ingested or scored in the background.
 *
 * States:
 *  - Hidden: nothing happening
 *  - "INGESTING JOBS…" (amber): _isIngesting = true, pendingScoring = 0
 *  - "SCORING N JOBS…" (blue): _isIngesting = false, pendingScoring > 0
 *  - "INGESTING + SCORING N JOBS…" (purple): both active
 */
export function TopProgressBar() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState<"amber" | "blue" | "purple">("blue");
  // Fake progress: animates from 0→85% while active, then snaps to 100% on done
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data } = trpc.stats.scoringStatus.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: (query) => {
      // Poll every 3s while active, every 10s when idle
      const d = query.state.data;
      return d?.isIngesting || (d?.pendingScoring ?? 0) > 0 ? 3000 : 10000;
    },
    staleTime: 0,
  });

  useEffect(() => {
    const isIngesting = data?.isIngesting ?? false;
    const pending = data?.pendingScoring ?? 0;
    const active = isIngesting || pending > 0;

    if (active) {
      setVisible(true);
      if (isIngesting && pending > 0) {
        setColor("purple");
        setLabel(`INGESTING + SCORING ${pending} JOBS…`);
      } else if (isIngesting) {
        setColor("amber");
        setLabel("INGESTING JOBS…");
      } else {
        setColor("blue");
        setLabel(`SCORING ${pending} JOB${pending === 1 ? "" : "S"}…`);
      }
      // Animate progress bar from current position toward 85%
      if (!animRef.current) {
        animRef.current = setInterval(() => {
          progressRef.current = Math.min(85, progressRef.current + 0.4);
          setProgress(progressRef.current);
        }, 100);
      }
    } else if (visible) {
      // Snap to 100% then hide
      if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
      progressRef.current = 100;
      setProgress(100);
      const t = setTimeout(() => {
        setVisible(false);
        progressRef.current = 0;
        setProgress(0);
      }, 600);
      return () => clearTimeout(t);
    }

    return () => {
      if (!active && animRef.current) { clearInterval(animRef.current); animRef.current = null; }
    };
  }, [data, visible]);

  if (!visible) return null;

  const barColor =
    color === "amber"
      ? "bg-amber-400"
      : color === "purple"
      ? "bg-purple-500"
      : "bg-blue-500";

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
      {/* Track */}
      <div className="absolute inset-0 bg-black/10" />
      {/* Animated fill */}
      <div
        className={`absolute left-0 top-0 h-full transition-all duration-300 ease-out ${barColor}`}
        style={{ width: `${progress}%` }}
      />
      {/* Label pill */}
      <div
        className={`absolute top-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-b text-[10px] font-mono font-bold tracking-widest text-white shadow-lg ${
          color === "amber" ? "bg-amber-500" : color === "purple" ? "bg-purple-600" : "bg-blue-600"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
