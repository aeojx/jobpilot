import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Job } from "../../../drizzle/schema";
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
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import JobDetailModal from "@/components/JobDetailModal";

type KanbanStatus = "ingested" | "matched" | "to_apply" | "applied" | "rejected" | "expired";
type SortKey = "default" | "score_desc" | "score_asc" | "dwell_desc" | "dwell_asc";

const COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: "ingested",  label: "Ingested",     color: "var(--atari-gray)" },
  { id: "matched",   label: "Matched",      color: "var(--atari-green)" },
  { id: "to_apply",  label: "To Apply",     color: "var(--atari-amber)" },
  { id: "applied",   label: "Applied",      color: "var(--atari-cyan)" },
  { id: "rejected",  label: "Rejected",     color: "var(--atari-red)" },
  { id: "expired",   label: "Expired Jobs", color: "#6b6b6b" },
];

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
function getDwellDays(job: Job): number | null {
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

function sortJobs(jobs: Job[], sortKey: SortKey): Job[] {
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
  const isMatched = job.status === "matched";
  const showDwell = isToApply || isMatched;
  const dwellDays = showDwell ? getDwellDays(job) : null;
  const dwellColor = dwellDays !== null ? getDwellColor(dwellDays, job.status as KanbanStatus) : "var(--atari-gray)";

  return (
    <div
      className="kanban-card"
      draggable={isOwner}
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(job)}
      style={{ cursor: isOwner ? "grab" : "pointer" }}
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

      {/* Quick action buttons — only on To Apply cards */}
      {isToApply && onQuickAction && (
        <div
          className="flex gap-2 mt-4 pt-2"
          style={{ borderTop: "1px solid var(--atari-border)", paddingTop: "0.5rem" }}
          onClick={(e) => e.stopPropagation()}
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
  sortKey,
}: {
  column: (typeof COLUMNS)[0];
  jobs: Job[];
  isOwner: boolean;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onDragEnd: () => void;
  onDrop: (status: KanbanStatus) => void;
  onCardClick: (job: Job) => void;
  onQuickAction?: (id: number, status: KanbanStatus) => void;
  sortKey: SortKey;
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
          {jobs.length}
        </span>
      </div>
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
  const [sortKey, setSortKey] = useState<SortKey>("default");

  // Manual Add form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualApplyUrl, setManualApplyUrl] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const manualAdd = trpc.jobs.manualAdd.useMutation({
    onSuccess: () => {
      utils.jobs.kanban.invalidate();
      toast.success("Job added to Applied column");
      setShowManualForm(false);
      setManualTitle(""); setManualCompany(""); setManualLocation(""); setManualApplyUrl(""); setManualNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

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

  const jobsByStatus = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, col) => {
          acc[col.id] = jobs.filter((j) => j.status === col.id);
          return acc;
        },
        {} as Record<KanbanStatus, Job[]>
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
          {isOwner && (
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
          )}
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
              Jobs added here go directly to the <span style={{ color: "var(--atari-cyan)" }}>Applied</span> column and are tagged as manually added by <span style={{ color: "var(--atari-amber)" }}>{user?.name ?? "you"}</span>.
            </p>
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
                  style={{
                    background: "transparent",
                    border: "1px solid var(--atari-border)",
                    color: "var(--atari-white)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    padding: "6px 8px",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--atari-gray)", letterSpacing: "0.08em" }}>NOTES</label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={3}
                style={{
                  background: "transparent",
                  border: "1px solid var(--atari-border)",
                  color: "var(--atari-white)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  padding: "6px 8px",
                  outline: "none",
                  resize: "vertical",
                  width: "100%",
                }}
              />
            </div>
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
                  manualAdd.mutate({ title: manualTitle.trim(), company: manualCompany.trim(), location: manualLocation.trim() || undefined, applyUrl: manualApplyUrl.trim() || undefined, notes: manualNotes.trim() || undefined });
                }}
                disabled={manualAdd.isPending}
                style={{ background: "var(--atari-amber)", border: "1px solid var(--atari-amber)", color: "var(--atari-black)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em", fontWeight: 700 }}
              >
                {manualAdd.isPending ? "ADDING..." : "▶ ADD JOB"}
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
          onStatusChange={(status) => {
            moveStatus.mutate({ id: selectedJob.id, status });
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
}
