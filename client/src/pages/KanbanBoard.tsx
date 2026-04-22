import { useAuth } from "@/_core/hooks/useAuth";
import { trpc, KanbanJob } from "@/lib/trpc";
import {
  AtSign,
  CheckCircle,
  Copy,
  Loader2,
  XCircle,
  Clock,
  ArrowUpDown,
  Zap,
  PlusCircle,
  User,
  Pencil,
  ClipboardList,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import JobDetailModal from "@/components/JobDetailModal";
import ResumeButton from "@/components/ResumeButton";

type KanbanStatus = "ingested" | "matched" | "to_apply" | "blocked" | "applied" | "nextsteps" | "rejected" | "expired";
type SortKey = "default" | "score_desc" | "score_asc" | "dwell_desc" | "dwell_asc";

const COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: "matched",    label: "Matched",      color: "var(--atari-green)" },
  { id: "to_apply",   label: "To Apply",     color: "var(--atari-amber)" },
  { id: "blocked",    label: "Blocked",      color: "var(--atari-magenta)" },
  { id: "applied",    label: "Applied",      color: "var(--atari-cyan)" },
  { id: "nextsteps",  label: "Next Steps",   color: "#a78bfa" },
  { id: "rejected",   label: "Rejected",     color: "var(--atari-red)" },
  { id: "expired",    label: "Expired Jobs", color: "#6b6b6b" },
];

/** Columns the Applier role is allowed to drag into */
const APPLIER_DROP_TARGETS: KanbanStatus[] = ["to_apply", "blocked", "applied", "nextsteps", "expired"];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default",    label: "DEFAULT" },
  { value: "score_desc", label: "MATCH ↓" },
  { value: "score_asc",  label: "MATCH ↑" },
  { value: "dwell_desc", label: "DWELL ↓" },
  { value: "dwell_asc",  label: "DWELL ↑" },
];

function getScoreColor(score: number) {
  if (score >= 70) return "var(--atari-green)";
  if (score >= 40) return "var(--atari-amber)";
  return "var(--atari-red)";
}

/** Returns dwell in days.
 *  - Matched: days since ingestedAt (how long the posting has been in the system)
 *  - To Apply: days since statusChangedAt (how long it's been waiting to be applied to)
 *  - Other statuses: days since statusChangedAt or createdAt
 */
function getDwellDays(job: KanbanJob): number | null {
  const now = Date.now();
  if (job.status === "matched") {
    const ref = job.ingestedAt ? new Date(job.ingestedAt).getTime() : null;
    if (!ref) return null;
    return Math.floor((now - ref) / 86_400_000);
  }
  if (job.status === "to_apply") {
    const ref = job.statusChangedAt
      ? new Date(job.statusChangedAt).getTime()
      : job.createdAt
      ? new Date(job.createdAt).getTime()
      : null;
    if (!ref) return null;
    return Math.floor((now - ref) / 86_400_000);
  }
  return null;
}

function getDwellColor(days: number, status: KanbanStatus): string {
  if (status === "to_apply") {
    if (days >= 7) return "var(--atari-red)";
    if (days >= 3) return "var(--atari-amber)";
    return "var(--atari-green)";
  }
  // matched: older = more urgent
  if (days >= 14) return "var(--atari-red)";
  if (days >= 7)  return "var(--atari-amber)";
  return "var(--atari-gray)";
}

function sortJobs(jobs: KanbanJob[], sortKey: SortKey): KanbanJob[] {
  if (sortKey === "default") return jobs;
  return [...jobs].sort((a, b) => {
    if (sortKey === "score_desc") return (b.matchScore ?? 0) - (a.matchScore ?? 0);
    if (sortKey === "score_asc")  return (a.matchScore ?? 0) - (b.matchScore ?? 0);
    const da = getDwellDays(a) ?? -1;
    const db = getDwellDays(b) ?? -1;
    if (sortKey === "dwell_desc") return db - da;
    if (sortKey === "dwell_asc")  return da - db;
    return 0;
  });
}

function JobCard({
  job,
  isOwner,
  onDragStart,
  onDragEnd,
  onClick,
  onQuickAction,
}: {
  job: KanbanJob;
  isOwner: boolean;
  onDragStart: (e: React.DragEvent, job: KanbanJob) => void;
  onDragEnd: () => void;
  onClick: (job: KanbanJob) => void;
  onQuickAction?: (id: number, status: KanbanStatus) => void;
}) {
  const score = Math.round(job.matchScore ?? 0);
  const scoreColor = getScoreColor(score);
  const isToApply = job.status === "to_apply";
  const isMatched = job.status === "matched";
  const showDwell = isToApply || isMatched;
  const dwellDays = showDwell ? getDwellDays(job) : null;
  const dwellColor = dwellDays !== null ? getDwellColor(dwellDays, job.status as KanbanStatus) : "var(--atari-gray)";

  return (
    <div
      className="kanban-card"
      draggable={true}
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(job)}
      style={{ cursor: "grab" }}
    >
      {/* Title + Dwell badge row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.4rem", marginBottom: "0.25rem" }}>
        <p
          className="font-bold leading-tight"
          style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "0.82rem", color: "var(--atari-white)", flex: 1, minWidth: 0 }}
        >
          {job.title}
        </p>
        {dwellDays !== null && (
          <span
            title={isToApply ? "Days in To Apply queue" : "Days since ingested"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              color: dwellColor,
              border: `1px solid ${dwellColor}`,
              padding: "1px 5px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              letterSpacing: "0.04em",
            }}
          >
            <Clock size={8} />
            {dwellDays}d
          </span>
        )}
      </div>

      {/* Company */}
      <p
        className="mb-2"
        style={{
          fontFamily: "Share Tech Mono, monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.05em",
          color: "var(--atari-gray)",
          textTransform: "uppercase",
        }}
      >
        {job.company}
      </p>

      {/* Location */}
      {job.location && (
        <p
          className="mb-2"
          style={{
            fontFamily: "Share Tech Mono, monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.05em",
            color: "var(--atari-gray)",
            textTransform: "uppercase",
          }}
        >
          📍 {job.location}
        </p>
      )}

      {/* Match Score */}
      {score > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--atari-gray)" }}>MATCH:</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: scoreColor, fontWeight: "bold" }}>
            {score}%
          </span>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-3">
        {job.source && job.source.toLowerCase().includes("linkedin") && (
          <span className="brutal-tag" style={{ borderColor: "#0a66c2", color: "#0a66c2", background: "rgba(10,102,194,0.12)", fontWeight: 700, letterSpacing: "0.08em" }}>
            LI
          </span>
        )}
        {job.source && (
          <span className="brutal-tag" style={{ borderColor: "var(--atari-cyan)", color: "var(--atari-cyan)" }}>
            {job.source}
          </span>
        )}
        {job.hasEmail && (
          <span className="brutal-tag" style={{ borderColor: "var(--atari-green)", color: "var(--atari-green)" }}>
            <AtSign size={8} />Email
          </span>
        )}
        {job.isDuplicate && (
          <span className="brutal-tag" style={{ borderColor: "var(--atari-magenta)", color: "var(--atari-magenta)" }}>
            <Copy size={8} />Dupe
          </span>
        )}
        {job.autoRejected && (
          <span className="brutal-tag" style={{ borderColor: "var(--atari-red)", color: "var(--atari-red)", fontWeight: 700 }}>
            <Zap size={8} />Auto-Rejected
          </span>
        )}
        {job.manuallyAdded && (
          <span className="brutal-tag" style={{ borderColor: "var(--atari-amber)", color: "var(--atari-amber)", fontWeight: 700 }}>
            <User size={8} />Manual
          </span>
        )}
      </div>

      {/* Manual attribution */}
      {job.manuallyAdded && job.addedBy && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", marginTop: "0.35rem", letterSpacing: "0.04em" }}>
          Added by {job.addedBy}
        </p>
      )}

      {/* Blocked reason */}
      {job.status === "blocked" && job.blockedReason && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-magenta)", marginTop: "0.35rem", letterSpacing: "0.04em", fontStyle: "italic" }}>
          🚫 {job.blockedReason}
        </p>
      )}

      {/* Next step note */}
      {job.status === "nextsteps" && job.nextStepNote && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            color: "#a78bfa",
            marginTop: "0.35rem",
            letterSpacing: "0.04em",
            fontStyle: "italic",
            display: "flex",
            alignItems: "flex-start",
            gap: "4px",
          }}
        >
          <ClipboardList size={10} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>{job.nextStepNote}</span>
        </div>
      )}

      {/* Resume button — on To Apply, Applied, and Next Steps cards */}
      {(isToApply || job.status === "applied" || job.status === "nextsteps") && (
        <div
          className="mt-3 pt-2"
          style={{ borderTop: "1px solid var(--atari-border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <ResumeButton jobId={job.id} compact />
        </div>
      )}

      {/* Quick action buttons — on To Apply, Blocked, Applied, and Next Steps cards */}
      {(isToApply || job.status === "blocked" || job.status === "applied" || job.status === "nextsteps") && onQuickAction && (
        <div
          className="flex gap-2 mt-3 pt-2 flex-wrap"
          style={{ borderTop: "1px solid var(--atari-border)", paddingTop: "0.5rem" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Applied button — on To Apply and Blocked */}
          {(isToApply || job.status === "blocked") && (
            <button
              className="flex items-center gap-1 flex-1 justify-center py-1 px-2 text-xs font-pixel transition-all"
              style={{
                background: "transparent",
                border: "1px solid var(--atari-cyan)",
                color: "var(--atari-cyan)",
                fontSize: "7px",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
              onClick={() => onQuickAction(job.id, "applied")}
              title="Mark as Applied"
            >
              <CheckCircle size={10} />
              APPLIED
            </button>
          )}
          {/* Blocked button — on To Apply */}
          {isToApply && (
            <button
              className="flex items-center gap-1 flex-1 justify-center py-1 px-2 text-xs font-pixel transition-all"
              style={{
                background: "transparent",
                border: "1px solid var(--atari-magenta)",
                color: "var(--atari-magenta)",
                fontSize: "7px",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
              onClick={() => onQuickAction(job.id, "blocked")}
              title="Can't apply to this job"
            >
              🚫 BLOCKED
            </button>
          )}
          {/* Next Steps button — on Applied cards */}
          {job.status === "applied" && (
            <button
              className="flex items-center gap-1 flex-1 justify-center py-1 px-2 text-xs font-pixel transition-all"
              style={{
                background: "transparent",
                border: "1px solid #a78bfa",
                color: "#a78bfa",
                fontSize: "7px",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
              onClick={() => onQuickAction(job.id, "nextsteps")}
              title="Move to Next Steps"
            >
              <ClipboardList size={10} />
              NEXT STEPS
            </button>
          )}
          {/* Edit note button — on Next Steps cards */}
          {job.status === "nextsteps" && (
            <button
              className="flex items-center gap-1 flex-1 justify-center py-1 px-2 text-xs font-pixel transition-all"
              style={{
                background: "transparent",
                border: "1px solid #a78bfa",
                color: "#a78bfa",
                fontSize: "7px",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
              onClick={() => onQuickAction(job.id, "nextsteps")}
              title="Edit next step note"
            >
              <Pencil size={10} />
              EDIT NOTE
            </button>
          )}
          {/* Expired button — on To Apply, Blocked, Applied */}
          {(isToApply || job.status === "blocked" || job.status === "applied") && (
            <button
              className="flex items-center gap-1 flex-1 justify-center py-1 px-2 text-xs font-pixel transition-all"
              style={{
                background: "transparent",
                border: "1px solid #6b6b6b",
                color: "#9b9b9b",
                fontSize: "7px",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
              onClick={() => onQuickAction(job.id, "expired")}
              title="Job no longer available"
            >
              <XCircle size={10} />
              EXPIRED
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  jobs,
  isOwner,
  onDragStart,
  onDragEnd,
  onDrop,
  onCardClick,
  onQuickAction,
  sortKey,
  archiveCount,
}: {
  column: (typeof COLUMNS)[0];
  jobs: KanbanJob[];
  isOwner: boolean;
  onDragStart: (e: React.DragEvent, job: KanbanJob) => void;
  onDragEnd: () => void;
  onDrop: (status: KanbanStatus) => void;
  onCardClick: (job: KanbanJob) => void;
  onQuickAction?: (id: number, status: KanbanStatus) => void;
  sortKey: SortKey;
  archiveCount?: number;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const sorted = useMemo(() => sortJobs(jobs, sortKey), [jobs, sortKey]);

  return (
    <div
      className="kanban-column"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => { setIsDragOver(false); onDrop(column.id); }}
      style={{
        borderColor: isDragOver ? column.color : undefined,
        boxShadow: isDragOver ? `0 0 0 1px ${column.color}` : undefined,
        opacity: column.id === "expired" ? 0.8 : 1,
      }}
    >
      <div className="kanban-column-header" style={{ borderBottomColor: column.color }}>
        <span className="font-pixel" style={{ color: column.color, fontSize: "8px" }}>{column.label}</span>
        <span
          className="font-pixel"
          style={{
            fontSize: "8px",
            color: column.color,
            background: `${column.color}22`,
            padding: "2px 6px",
            border: `1px solid ${column.color}`,
          }}
        >
          {(column.id === "rejected" || column.id === "expired") && archiveCount != null
            ? archiveCount.toLocaleString()
            : jobs.length}
        </span>
      </div>
      {column.id === "rejected" && archiveCount != null && archiveCount > 0 && (
        <div
          style={{
            padding: "0.45rem 0.6rem",
            borderBottom: "1px solid var(--atari-border)",
            background: "oklch(0.07 0.01 20)",
            display: "flex",
            flexDirection: "column",
            gap: "3px",
          }}
        >
          <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "0.6rem", color: "var(--atari-gray)", letterSpacing: "0.04em", lineHeight: 1.4 }}>
            ⚡ {archiveCount.toLocaleString()} rejected/expired jobs have been hidden to improve load times.
          </span>
          <a
            href="/archive"
            style={{
              fontFamily: "Share Tech Mono, monospace",
              fontSize: "0.6rem",
              color: "var(--atari-amber)",
              letterSpacing: "0.04em",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            View the Job Archive →
          </a>
        </div>
      )}
      <div className="kanban-column-body">
        {sorted.length === 0 && (
          <div
            className="flex items-center justify-center h-16 border border-dashed"
            style={{ borderColor: "var(--atari-border)" }}
          >
            <span
              className="blink"
              style={{
                fontFamily: "Share Tech Mono, monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                color: "var(--atari-border)",
                textTransform: "uppercase",
              }}
            >
              EMPTY_
            </span>
          </div>
        )}
        {sorted.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isOwner={isOwner}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onCardClick}
            onQuickAction={(column.id === "to_apply" || column.id === "blocked" || column.id === "applied" || column.id === "nextsteps") ? onQuickAction : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { user } = useAuth();
  const isOwner = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: jobs = [], isLoading } = trpc.jobs.kanban.useQuery();
  const { data: archivedCount } = trpc.jobs.archiveCount.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const moveStatus = trpc.jobs.moveStatus.useMutation({
    onSuccess: () => utils.jobs.kanban.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const [draggingJob, setDraggingJob] = useState<KanbanJob | null>(null);
  const [selectedJob, setSelectedJob] = useState<KanbanJob | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("default");

  // Blocked reason prompt state
  const [blockingJobId, setBlockingJobId] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const blockReasonRef = useRef<HTMLInputElement>(null);

  // Next Steps note prompt state
  const [nextStepsJobId, setNextStepsJobId] = useState<number | null>(null);
  const [nextStepNote, setNextStepNote] = useState("");
  const nextStepNoteRef = useRef<HTMLInputElement>(null);

  const updateNextStepNote = trpc.jobs.updateNextStepNote.useMutation({
    onSuccess: () => utils.jobs.kanban.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  // Manual Add form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualApplyUrl, setManualApplyUrl] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualQueue, setManualQueue] = useState<"matched" | "to_apply" | "applied" | "nextsteps">("applied");
  const [manualNextStepNote, setManualNextStepNote] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const QUEUE_OPTIONS: { value: "matched" | "to_apply" | "applied" | "nextsteps"; label: string; color: string; hint: string }[] = [
    { value: "matched",   label: "Matched",    color: "var(--atari-green)",   hint: "Runs matching algorithm to score this job" },
    { value: "to_apply",  label: "To Apply",   color: "var(--atari-amber)",   hint: "Queued for the Applier to action" },
    { value: "applied",   label: "Applied",    color: "var(--atari-cyan)",    hint: "Already applied to this job" },
    { value: "nextsteps", label: "Next Steps", color: "#a78bfa",              hint: "Awaiting a next step (interview, test, etc.)" },
  ];

  const manualAdd = trpc.jobs.manualAdd.useMutation({
    onSuccess: (data) => {
      utils.jobs.kanban.invalidate();
      const queueLabel = QUEUE_OPTIONS.find((q) => q.value === manualQueue)?.label ?? manualQueue;
      const scoreMsg = manualQueue === "matched" && data.matchScore > 0 ? ` · Score: ${data.matchScore}` : "";
      toast.success(`Job added to ${queueLabel}${scoreMsg}`);
      setShowManualForm(false);
      setManualTitle(""); setManualCompany(""); setManualLocation(""); setManualApplyUrl(""); setManualNotes(""); setManualNextStepNote(""); setManualQueue("applied");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDragStart = useCallback((e: React.DragEvent, job: KanbanJob) => {
    setDraggingJob(job);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => setDraggingJob(null), []);

  const handleDrop = useCallback(
    (status: KanbanStatus) => {
      if (!draggingJob || draggingJob.status === status) return;
      // Appliers can only drop into their allowed columns
      if (!isOwner && !APPLIER_DROP_TARGETS.includes(status)) return;
      // If dropping into nextsteps, show the note prompt
      if (status === "nextsteps") {
        setNextStepsJobId(draggingJob.id);
        setNextStepNote(draggingJob.nextStepNote ?? "");
        setDraggingJob(null);
        setTimeout(() => nextStepNoteRef.current?.focus(), 50);
        return;
      }
      moveStatus.mutate({ id: draggingJob.id, status });
      setDraggingJob(null);
    },
    [draggingJob, moveStatus, isOwner]
  );

  const handleQuickAction = useCallback(
    (id: number, status: KanbanStatus) => {
      if (status === "blocked") {
        // Show reason prompt instead of immediately blocking
        setBlockingJobId(id);
        setBlockReason("");
        setTimeout(() => blockReasonRef.current?.focus(), 50);
        return;
      }
      if (status === "nextsteps") {
        // Show next step note prompt
        const existingJob = jobs.find((j) => j.id === id);
        setNextStepsJobId(id);
        setNextStepNote(existingJob?.nextStepNote ?? "");
        setTimeout(() => nextStepNoteRef.current?.focus(), 50);
        return;
      }
      const label = status === "applied" ? "APPLIED" : status === "expired" ? "EXPIRED" : status.toUpperCase();
      moveStatus.mutate(
        { id, status },
        {
          onSuccess: () => {
            toast.success(`Job marked as ${label}`);
            utils.jobs.kanban.invalidate();
          },
        }
      );
    },
    [moveStatus, utils, jobs]
  );

  const confirmBlock = useCallback(() => {
    if (blockingJobId === null) return;
    moveStatus.mutate(
      { id: blockingJobId, status: "blocked", blockedReason: blockReason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Job moved to Blocked");
          utils.jobs.kanban.invalidate();
          setBlockingJobId(null);
          setBlockReason("");
        },
      }
    );
  }, [blockingJobId, blockReason, moveStatus, utils]);

  const confirmNextStep = useCallback(() => {
    if (nextStepsJobId === null) return;
    const note = nextStepNote.trim();
    // Check if the job is already in nextsteps — if so, just update the note
    const existingJob = jobs.find((j) => j.id === nextStepsJobId);
    if (existingJob?.status === "nextsteps") {
      updateNextStepNote.mutate(
        { id: nextStepsJobId, nextStepNote: note || "(no note)" },
        {
          onSuccess: () => {
            toast.success("Next step note updated");
            setNextStepsJobId(null);
            setNextStepNote("");
          },
        }
      );
    } else {
      moveStatus.mutate(
        { id: nextStepsJobId, status: "nextsteps", nextStepNote: note || undefined },
        {
          onSuccess: () => {
            toast.success("Job moved to Next Steps");
            utils.jobs.kanban.invalidate();
            setNextStepsJobId(null);
            setNextStepNote("");
          },
        }
      );
    }
  }, [nextStepsJobId, nextStepNote, moveStatus, updateNextStepNote, utils, jobs]);

  const jobsByStatus = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, col) => {
          acc[col.id] = jobs.filter((j) => j.status === col.id);
          return acc;
        },
        {} as Record<KanbanStatus, KanbanJob[]>
      ),
    [jobs]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-pixel glow-amber" style={{ color: "var(--atari-amber)", fontSize: "12px" }}>
            DASHBOARD
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-pixel" style={{ fontSize: "8px", color: "var(--atari-cyan)" }}>
              {jobs.length} JOBS
            </span>
            {isLoading && <Loader2 size={14} className="animate-spin" style={{ color: "var(--atari-amber)" }} />}
            {isOwner && (
              <button
                onClick={() => { setShowManualForm(true); setTimeout(() => titleRef.current?.focus(), 50); }}
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
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
            )}
          </div>
        </div>
        <div className="atari-divider" />

        {/* Sort controls */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1" style={{ color: "var(--atari-gray)" }}>
            <ArrowUpDown size={10} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>SORT:</span>
          </div>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortKey(opt.value)}
              style={{
                background: sortKey === opt.value ? "var(--atari-amber)" : "transparent",
                border: `1px solid ${sortKey === opt.value ? "var(--atari-amber)" : "var(--atari-border)"}`,
                color: sortKey === opt.value ? "var(--atari-black)" : "var(--atari-gray)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                letterSpacing: "0.06em",
                padding: "2px 7px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
          <span
            style={{
              fontFamily: "Share Tech Mono, monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.08em",
              color: "var(--atari-gray)",
              marginLeft: "auto",
              textTransform: "uppercase",
            }}
          >
            ▶ DRAG TO MOVE · <Clock size={8} style={{ display: "inline" }} /> = DWELL DAYS
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto px-5 pb-5">
        <div className="kanban-board-scroll flex gap-3 h-full" style={{ minWidth: "max-content" }}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              jobs={jobsByStatus[col.id] ?? []}
              isOwner={isOwner}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onCardClick={setSelectedJob}
              onQuickAction={handleQuickAction}
              sortKey={sortKey}
              archiveCount={archivedCount}
            />
          ))}
        </div>
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
              Manually add a job to any queue. Tagged as added by <span style={{ color: "var(--atari-amber)" }}>{user?.name ?? "you"}</span>.
            </p>

            {/* Queue Selector — MANDATORY */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-amber)", letterSpacing: "0.08em" }}>QUEUE *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {QUEUE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setManualQueue(opt.value)}
                    title={opt.hint}
                    style={{
                      background: manualQueue === opt.value ? opt.color + "22" : "transparent",
                      border: `1.5px solid ${manualQueue === opt.value ? opt.color : "var(--atari-border)"}`,
                      color: manualQueue === opt.value ? opt.color : "var(--atari-gray)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      padding: "5px 8px",
                      cursor: "pointer",
                      letterSpacing: "0.06em",
                      fontWeight: manualQueue === opt.value ? 700 : 400,
                      textAlign: "center",
                      transition: "all 0.1s",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--atari-gray)", letterSpacing: "0.04em", marginTop: 2 }}>
                {QUEUE_OPTIONS.find((q) => q.value === manualQueue)?.hint}
              </p>
            </div>

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
                  style={{ background: "transparent", border: "1px solid var(--atari-border)", color: "var(--atari-white)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: "6px 8px", outline: "none", width: "100%" }}
                />
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", letterSpacing: "0.08em" }}>
                {manualQueue === "matched" ? "JOB DESCRIPTION (used for scoring)" : "NOTES"}
              </label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={manualQueue === "matched" ? 5 : 3}
                placeholder={manualQueue === "matched" ? "Paste the job description here to run the matching algorithm..." : ""}
                style={{ background: "transparent", border: `1px solid ${manualQueue === "matched" ? "var(--atari-green)" : "var(--atari-border)"}`, color: "var(--atari-white)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: "6px 8px", outline: "none", resize: "vertical", width: "100%" }}
              />
            </div>

            {/* Next Step Note — only shown when queue is Next Steps */}
            {manualQueue === "nextsteps" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#a78bfa", letterSpacing: "0.08em" }}>NEXT STEP NOTE</label>
                <input
                  value={manualNextStepNote}
                  onChange={(e) => setManualNextStepNote(e.target.value)}
                  placeholder="e.g. Phone screen Apr 25, Technical test due May 1..."
                  style={{ background: "transparent", border: "1px solid #a78bfa", color: "var(--atari-white)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: "6px 8px", outline: "none", width: "100%" }}
                />
              </div>
            )}

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
                  manualAdd.mutate({
                    title: manualTitle.trim(),
                    company: manualCompany.trim(),
                    location: manualLocation.trim() || undefined,
                    applyUrl: manualApplyUrl.trim() || undefined,
                    notes: manualNotes.trim() || undefined,
                    status: manualQueue,
                    nextStepNote: manualQueue === "nextsteps" ? (manualNextStepNote.trim() || undefined) : undefined,
                  });
                }}
                disabled={manualAdd.isPending}
                style={{ background: QUEUE_OPTIONS.find((q) => q.value === manualQueue)?.color ?? "var(--atari-amber)", border: "1px solid transparent", color: "var(--atari-black)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em", fontWeight: 700 }}
              >
                {manualAdd.isPending ? (manualQueue === "matched" ? "SCORING..." : "ADDING...") : `▶ ADD TO ${QUEUE_OPTIONS.find((q) => q.value === manualQueue)?.label.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Reason Prompt */}
      {blockingJobId !== null && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setBlockingJobId(null); setBlockReason(""); } }}
        >
          <div style={{ background: "var(--atari-bg)", border: "1px solid var(--atari-magenta)", boxShadow: "0 0 20px var(--atari-magenta)33", padding: "1.5rem", width: "min(420px, 95vw)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="font-pixel" style={{ color: "var(--atari-magenta)", fontSize: "10px" }}>🚫 BLOCK JOB</span>
              <button onClick={() => { setBlockingJobId(null); setBlockReason(""); }} style={{ background: "none", border: "none", color: "var(--atari-gray)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--atari-gray)", letterSpacing: "0.04em" }}>
              Why can't you apply? <span style={{ color: "var(--atari-gray)" }}>(optional — helps track patterns)</span>
            </p>
            <input
              ref={blockReasonRef}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmBlock(); if (e.key === "Escape") { setBlockingJobId(null); setBlockReason(""); } }}
              placeholder="e.g. portal broken, requires UAE national, referral needed..."
              style={{ background: "transparent", border: "1px solid var(--atari-border)", color: "var(--atari-white)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: "6px 8px", outline: "none", width: "100%" }}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => { setBlockingJobId(null); setBlockReason(""); }} style={{ background: "transparent", border: "1px solid var(--atari-border)", color: "var(--atari-gray)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em" }}>CANCEL</button>
              <button onClick={confirmBlock} disabled={moveStatus.isPending} style={{ background: "var(--atari-magenta)", border: "1px solid var(--atari-magenta)", color: "var(--atari-black)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em", fontWeight: 700 }}>
                {moveStatus.isPending ? "BLOCKING..." : "▶ CONFIRM BLOCK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps Note Prompt */}
      {nextStepsJobId !== null && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setNextStepsJobId(null); setNextStepNote(""); } }}
        >
          <div style={{ background: "var(--atari-bg)", border: "1px solid #a78bfa", boxShadow: "0 0 20px #a78bfa33", padding: "1.5rem", width: "min(420px, 95vw)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="font-pixel" style={{ color: "#a78bfa", fontSize: "10px" }}>📋 NEXT STEPS</span>
              <button onClick={() => { setNextStepsJobId(null); setNextStepNote(""); }} style={{ background: "none", border: "none", color: "var(--atari-gray)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--atari-gray)", letterSpacing: "0.04em" }}>
              What's the next step for this application? <span style={{ color: "var(--atari-gray)" }}>(e.g. interview, technical test, follow-up)</span>
            </p>
            <input
              ref={nextStepNoteRef}
              value={nextStepNote}
              onChange={(e) => setNextStepNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmNextStep(); if (e.key === "Escape") { setNextStepsJobId(null); setNextStepNote(""); } }}
              placeholder="e.g. Phone screen Apr 25, Technical assessment due May 1..."
              style={{ background: "transparent", border: "1px solid var(--atari-border)", color: "var(--atari-white)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: "6px 8px", outline: "none", width: "100%" }}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => { setNextStepsJobId(null); setNextStepNote(""); }} style={{ background: "transparent", border: "1px solid var(--atari-border)", color: "var(--atari-gray)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em" }}>CANCEL</button>
              <button onClick={confirmNextStep} disabled={moveStatus.isPending || updateNextStepNote.isPending} style={{ background: "#a78bfa", border: "1px solid #a78bfa", color: "var(--atari-black)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em", fontWeight: 700 }}>
                {(moveStatus.isPending || updateNextStepNote.isPending) ? "SAVING..." : "▶ CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOwner={isOwner}
          onClose={() => setSelectedJob(null)}
          onStatusChange={(status, blockedReason) => {
            moveStatus.mutate({ id: selectedJob.id, status, blockedReason });
            setSelectedJob(null);
          }}
        />
      )}


    </div>
  );
}
