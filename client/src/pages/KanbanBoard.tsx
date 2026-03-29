import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Job } from "../../../drizzle/schema";
import {
  AlertCircle,
  AtSign,
  Copy,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import JobDetailModal from "@/components/JobDetailModal";

type KanbanStatus = "ingested" | "matched" | "to_apply" | "applied" | "rejected";

const COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: "ingested", label: "Job Ingested", color: "oklch(0.4 0 0)" },
  { id: "matched", label: "Matched", color: "oklch(0.65 0.18 145)" },
  { id: "to_apply", label: "To Apply", color: "oklch(0.75 0.18 65)" },
  { id: "applied", label: "Applied", color: "oklch(0.6 0.15 200)" },
  { id: "rejected", label: "Rejected", color: "oklch(0.5 0.22 27)" },
];

function getScoreColor(score: number) {
  if (score >= 70) return "oklch(0.65 0.18 145)";
  if (score >= 40) return "oklch(0.75 0.18 65)";
  return "oklch(0.5 0.22 27)";
}

function JobCard({
  job,
  isOwner,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  job: Job;
  isOwner: boolean;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onDragEnd: () => void;
  onClick: (job: Job) => void;
}) {
  const score = Math.round(job.matchScore ?? 0);
  const scoreColor = getScoreColor(score);

  return (
    <div
      className="kanban-card"
      draggable={isOwner}
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(job)}
    >
      {/* Title */}
      <p
        className="text-foreground font-bold leading-tight mb-1"
        style={{ fontFamily: "var(--font-condensed)", fontSize: "0.9rem", letterSpacing: "0.03em" }}
      >
        {job.title}
      </p>
      {/* Company */}
      <p
        className="mb-2"
        style={{
          fontFamily: "var(--font-condensed)",
          fontSize: "0.75rem",
          letterSpacing: "0.05em",
          color: "oklch(0.55 0 0)",
          textTransform: "uppercase",
        }}
      >
        {job.company}
      </p>

      {/* Score bar */}
      {score > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: scoreColor,
              }}
            >
              MATCH
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: scoreColor,
                fontWeight: "bold",
              }}
            >
              {score}%
            </span>
          </div>
          <div className="score-bar-track">
            <div
              className={`score-bar-fill ${score >= 70 ? "high" : score >= 40 ? "mid" : ""}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-2">
        {job.source && (
          <span
            className="brutal-tag"
            style={{ borderColor: "oklch(0.6 0.15 200)", color: "oklch(0.6 0.15 200)" }}
          >
            {job.source}
          </span>
        )}
        {job.hasEmail && (
          <span
            className="brutal-tag"
            style={{ borderColor: "oklch(0.75 0.18 65)", color: "oklch(0.75 0.18 65)" }}
          >
            <AtSign size={8} />
            Email
          </span>
        )}
        {job.isDuplicate && (
          <span
            className="brutal-tag"
            style={{ borderColor: "oklch(0.5 0.22 27)", color: "oklch(0.5 0.22 27)" }}
          >
            <Copy size={8} />
            Dupe
          </span>
        )}
      </div>
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
}: {
  column: (typeof COLUMNS)[0];
  jobs: Job[];
  isOwner: boolean;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onDragEnd: () => void;
  onDrop: (status: KanbanStatus) => void;
  onCardClick: (job: Job) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className="kanban-column"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => {
        setIsDragOver(false);
        onDrop(column.id);
      }}
      style={{
        borderColor: isDragOver ? column.color : undefined,
        boxShadow: isDragOver ? `0 0 0 1px ${column.color}` : undefined,
      }}
    >
      <div className="kanban-column-header" style={{ borderBottomColor: column.color }}>
        <span style={{ color: column.color }}>{column.label}</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "oklch(0.4 0 0)",
          }}
        >
          {jobs.length}
        </span>
      </div>
      <div className="kanban-column-body">
        {jobs.length === 0 && (
          <div
            className="flex items-center justify-center h-16 border border-dashed"
            style={{ borderColor: "oklch(0.15 0 0)" }}
          >
            <span
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                color: "oklch(0.25 0 0)",
                textTransform: "uppercase",
              }}
            >
              Empty
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

  const handleDragEnd = useCallback(() => {
    setDraggingJob(null);
  }, []);

  const handleDrop = useCallback(
    (status: KanbanStatus) => {
      if (!draggingJob || draggingJob.status === status) return;
      moveStatus.mutate({ id: draggingJob.id, status });
      setDraggingJob(null);
    },
    [draggingJob, moveStatus]
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
          <h2
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.05em" }}
          >
            Kanban Pipeline
          </h2>
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "oklch(0.4 0 0)",
              }}
            >
              {jobs.length} jobs
            </span>
            {isLoading && <Loader2 size={14} className="animate-spin text-foreground/40" />}
          </div>
        </div>
        <div className="brutal-divider" />
        {isOwner && (
          <p
            className="mt-2"
            style={{
              fontFamily: "var(--font-condensed)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              color: "oklch(0.4 0 0)",
              textTransform: "uppercase",
            }}
          >
            Drag cards to move them between stages
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
