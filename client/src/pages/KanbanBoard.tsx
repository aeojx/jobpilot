import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Job } from "../../../drizzle/schema";
import {
  AtSign,
  CheckCircle,
  Copy,
  Loader2,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import JobDetailModal from "@/components/JobDetailModal";

type KanbanStatus = "ingested" | "matched" | "to_apply" | "applied" | "rejected" | "expired";

const COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: "ingested",  label: "Ingested",     color: "var(--atari-gray)" },
  { id: "matched",   label: "Matched",      color: "var(--atari-green)" },
  { id: "to_apply",  label: "To Apply",     color: "var(--atari-amber)" },
  { id: "applied",   label: "Applied",      color: "var(--atari-cyan)" },
  { id: "rejected",  label: "Rejected",     color: "var(--atari-red)" },
  { id: "expired",   label: "Expired Jobs", color: "#6b6b6b" },
];

function getScoreColor(score: number) {
  if (score >= 70) return "var(--atari-green)";
  if (score >= 40) return "var(--atari-amber)";
  return "var(--atari-red)";
}

function JobCard({
  job,
  isOwner,
  onDragStart,
  onDragEnd,
  onClick,
  onQuickAction,
}: {
  job: Job;
  isOwner: boolean;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onDragEnd: () => void;
  onClick: (job: Job) => void;
  onQuickAction?: (id: number, status: KanbanStatus) => void;
}) {
  const score = Math.round(job.matchScore ?? 0);
  const scoreColor = getScoreColor(score);
  const isToApply = job.status === "to_apply";

  return (
    <div
      className="kanban-card"
      draggable={isOwner}
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(job)}
      style={{ cursor: isOwner ? "grab" : "pointer" }}
    >
      {/* Title */}
      <p
        className="font-bold leading-tight mb-1"
        style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "0.82rem", color: "var(--atari-white)" }}
      >
        {job.title}
      </p>
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

      {/* Match Score — numerical only */}
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
      </div>

      {/* Quick action buttons — only on To Apply cards */}
      {isToApply && onQuickAction && (
        <div
          className="flex gap-2 mt-4 pt-2"
          style={{ borderTop: "1px solid var(--atari-border)", paddingTop: "0.5rem" }}
          onClick={(e) => e.stopPropagation()} // prevent opening modal
        >
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
}: {
  column: (typeof COLUMNS)[0];
  jobs: Job[];
  isOwner: boolean;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onDragEnd: () => void;
  onDrop: (status: KanbanStatus) => void;
  onCardClick: (job: Job) => void;
  onQuickAction?: (id: number, status: KanbanStatus) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

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
          {jobs.length}
        </span>
      </div>
      <div className="kanban-column-body">
        {jobs.length === 0 && (
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
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isOwner={isOwner}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onCardClick}
            onQuickAction={column.id === "to_apply" ? onQuickAction : undefined}
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
  const moveStatus = trpc.jobs.moveStatus.useMutation({
    onSuccess: () => utils.jobs.kanban.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const [draggingJob, setDraggingJob] = useState<Job | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, job: Job) => {
    setDraggingJob(job);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => setDraggingJob(null), []);

  const handleDrop = useCallback(
    (status: KanbanStatus) => {
      if (!draggingJob || draggingJob.status === status) return;
      moveStatus.mutate({ id: draggingJob.id, status });
      setDraggingJob(null);
    },
    [draggingJob, moveStatus]
  );

  const handleQuickAction = useCallback(
    (id: number, status: KanbanStatus) => {
      const label = status === "applied" ? "APPLIED" : "EXPIRED";
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
    [moveStatus, utils]
  );

  const jobsByStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = jobs.filter((j) => j.status === col.id);
      return acc;
    },
    {} as Record<KanbanStatus, Job[]>
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
          </div>
        </div>
        <div className="atari-divider" />
        {isOwner && (
          <p
            className="mt-2"
            style={{
              fontFamily: "Share Tech Mono, monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              color: "var(--atari-gray)",
              textTransform: "uppercase",
            }}
          >
            ▶ DRAG CARDS TO MOVE · USE BUTTONS ON "TO APPLY" CARDS FOR QUICK ACTIONS
          </p>
        )}
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
            />
          ))}
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOwner={isOwner}
          onClose={() => setSelectedJob(null)}
          onStatusChange={(status) => {
            moveStatus.mutate({ id: selectedJob.id, status });
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
}
