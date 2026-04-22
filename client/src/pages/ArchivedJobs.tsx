import { useState } from "react";
import { ExternalLink, ChevronLeft, ChevronRight, Archive, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PAGE_SIZE = 50;

function getScoreColor(score: number) {
  if (score >= 70) return "var(--atari-green)";
  if (score >= 40) return "var(--atari-amber)";
  return "var(--atari-red)";
}

export default function ArchivedJobs() {
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.jobs.archive.useQuery(
    { page, pageSize: PAGE_SIZE },
    { staleTime: 30_000 }
  );

  const moveStatus = trpc.jobs.moveStatus.useMutation({
    onSuccess: () => {
      toast.success("Job restored to Matched queue");
      utils.jobs.archive.invalidate();
      utils.jobs.archiveCount.invalidate();
      utils.jobs.kanban.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--atari-bg)",
        padding: "1.5rem",
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <Archive size={18} style={{ color: "var(--atari-amber)" }} />
        <h1
          style={{
            fontFamily: "Press Start 2P, monospace",
            fontSize: "0.85rem",
            color: "var(--atari-amber)",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          JOB ARCHIVE
        </h1>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--atari-gray)",
            letterSpacing: "0.04em",
            marginLeft: "0.5rem",
          }}
        >
          {total.toLocaleString()} rejected/expired jobs hidden from the Dashboard to improve load times
        </span>
      </div>

      {/* Info banner */}
      <div
        style={{
          background: "oklch(0.12 0.02 60)",
          border: "1px solid oklch(0.25 0.05 60)",
          padding: "0.75rem 1rem",
          marginBottom: "1.25rem",
          fontSize: "0.68rem",
          color: "var(--atari-gray)",
          letterSpacing: "0.04em",
          lineHeight: 1.6,
        }}
      >
        These jobs were excluded from the Kanban board to keep load times fast. You can restore any job back to the
        <span style={{ color: "var(--atari-green)", fontWeight: 700 }}> Matched</span> queue using the Restore button.
      </div>

      {isLoading ? (
        <div style={{ color: "var(--atari-gray)", fontSize: "0.7rem", letterSpacing: "0.06em", padding: "2rem 0" }}>
          LOADING ARCHIVE...
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ color: "var(--atari-gray)", fontSize: "0.7rem", letterSpacing: "0.06em", padding: "2rem 0" }}>
          NO ARCHIVED JOBS FOUND
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.72rem",
                letterSpacing: "0.03em",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--atari-border)",
                    color: "var(--atari-gray)",
                    textTransform: "uppercase",
                    fontSize: "0.6rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  <th style={{ textAlign: "left", padding: "6px 10px", whiteSpace: "nowrap" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "6px 10px", whiteSpace: "nowrap" }}>Company</th>
                  <th style={{ textAlign: "left", padding: "6px 10px", whiteSpace: "nowrap" }}>Location</th>
                  <th style={{ textAlign: "center", padding: "6px 10px", whiteSpace: "nowrap" }}>Score</th>
                  <th style={{ textAlign: "center", padding: "6px 10px", whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "6px 10px", whiteSpace: "nowrap" }}>Source</th>
                  <th style={{ textAlign: "left", padding: "6px 10px", whiteSpace: "nowrap" }}>Date</th>
                  <th style={{ textAlign: "center", padding: "6px 10px", whiteSpace: "nowrap" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => {
                  const score = Math.round(job.matchScore ?? 0);
                  const isRejected = job.status === "rejected";
                  const date = job.statusChangedAt ?? job.createdAt;
                  return (
                    <tr
                      key={job.id}
                      style={{
                        borderBottom: "1px solid oklch(0.1 0 0)",
                        background: idx % 2 === 0 ? "transparent" : "oklch(0.055 0 0)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.09 0.01 60)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "oklch(0.055 0 0)")}
                    >
                      <td style={{ padding: "7px 10px", color: "var(--atari-white)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {job.applyUrl ? (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--atari-cyan)", textDecoration: "none" }}
                            title={job.title}
                          >
                            {job.title}
                          </a>
                        ) : (
                          <span title={job.title}>{job.title}</span>
                        )}
                      </td>
                      <td style={{ padding: "7px 10px", color: "oklch(0.7 0 0)", whiteSpace: "nowrap" }}>{job.company}</td>
                      <td style={{ padding: "7px 10px", color: "oklch(0.55 0 0)", whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {job.location ?? "—"}
                      </td>
                      <td style={{ padding: "7px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {score > 0 ? (
                          <span style={{ color: getScoreColor(score), fontWeight: 700 }}>{score}%</span>
                        ) : (
                          <span style={{ color: "oklch(0.35 0 0)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "7px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: "0.58rem",
                            padding: "2px 6px",
                            border: `1px solid ${isRejected ? "var(--atari-red)" : "var(--atari-amber)"}`,
                            color: isRejected ? "var(--atari-red)" : "var(--atari-amber)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          {job.status}
                          {job.autoRejected ? " (auto)" : ""}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", color: "oklch(0.45 0 0)", whiteSpace: "nowrap" }}>
                        {job.source ?? "—"}
                      </td>
                      <td style={{ padding: "7px 10px", color: "oklch(0.45 0 0)", whiteSpace: "nowrap", fontSize: "0.65rem" }}>
                        {date ? new Date(date).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "7px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
                          {job.applyUrl && (
                            <a
                              href={job.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open job posting"
                              style={{ color: "var(--atari-cyan)", display: "flex", alignItems: "center" }}
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          <button
                            onClick={() => moveStatus.mutate({ id: job.id, status: "matched" })}
                            disabled={moveStatus.isPending}
                            title="Restore to Matched queue"
                            style={{
                              background: "transparent",
                              border: "1px solid var(--atari-green)",
                              color: "var(--atari-green)",
                              cursor: "pointer",
                              padding: "2px 6px",
                              fontSize: "0.58rem",
                              letterSpacing: "0.05em",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <RotateCcw size={10} />
                            RESTORE
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                marginTop: "1.25rem",
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  background: "transparent",
                  border: "1px solid var(--atari-border)",
                  color: page === 1 ? "oklch(0.3 0 0)" : "var(--atari-amber)",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  padding: "4px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.65rem",
                  letterSpacing: "0.06em",
                }}
              >
                <ChevronLeft size={12} /> PREV
              </button>
              <span style={{ color: "var(--atari-gray)", fontSize: "0.65rem", letterSpacing: "0.06em" }}>
                PAGE {page} / {totalPages} · {total.toLocaleString()} TOTAL
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  background: "transparent",
                  border: "1px solid var(--atari-border)",
                  color: page === totalPages ? "oklch(0.3 0 0)" : "var(--atari-amber)",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  padding: "4px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.65rem",
                  letterSpacing: "0.06em",
                }}
              >
                NEXT <ChevronRight size={12} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
