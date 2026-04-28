import { trpc } from "@/lib/trpc";
import {
  Download,
  FileText,
  Settings,
  History,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Save,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type Tab = "log" | "config";

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: "var(--atari-amber)", icon: <Clock size={10} />, label: "PENDING" },
    generating: { color: "var(--atari-cyan)", icon: <Loader2 size={10} className="animate-spin" />, label: "GENERATING" },
    completed: { color: "var(--atari-green)", icon: <CheckCircle size={10} />, label: "COMPLETED" },
    failed: { color: "var(--atari-red)", icon: <XCircle size={10} />, label: "FAILED" },
  };
  const c = config[status] ?? config.pending!;
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5"
      style={{
        fontFamily: "Press Start 2P, monospace",
        fontSize: "0.5rem",
        color: c.color,
        border: `1px solid ${c.color}`,
        letterSpacing: "0.06em",
      }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function ResumeLog() {
  const utils = trpc.useUtils();
  const { data: logs = [], isLoading, refetch } = trpc.resume.log.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const deleteMutation = trpc.resume.delete.useMutation({
    onSuccess: (data) => {
      toast.success("Resume deleted — you can regenerate it now");
      // Invalidate both the log and the status for the affected job
      utils.resume.log.invalidate();
      if (data.jobId) {
        utils.resume.status.invalidate({ jobId: data.jobId });
        void utils.resume.statusBatch.invalidate();
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = (logId: number) => {
    if (deletingId) return; // prevent double-click
    setDeletingId(logId);
    deleteMutation.mutate(
      { logId },
      { onSettled: () => setDeletingId(null) }
    );
  };

  const stats = useMemo(() => {
    const total = logs.length;
    const completed = logs.filter((l) => l.status === "completed").length;
    const failed = logs.filter((l) => l.status === "failed").length;
    const inProgress = logs.filter((l) => l.status === "pending" || l.status === "generating").length;
    const avgDuration = completed > 0
      ? Math.round(
          logs
            .filter((l) => l.status === "completed" && l.durationMs)
            .reduce((sum, l) => sum + (l.durationMs ?? 0), 0) /
            completed
        )
      : 0;
    return { total, completed, failed, inProgress, avgDuration };
  }, [logs]);

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Total", value: stats.total, color: "var(--atari-white)" },
          { label: "Completed", value: stats.completed, color: "var(--atari-green)" },
          { label: "Failed", value: stats.failed, color: "var(--atari-red)" },
          { label: "In Progress", value: stats.inProgress, color: "var(--atari-amber)" },
          { label: "Avg Time", value: formatDuration(stats.avgDuration), color: "var(--atari-cyan)" },
        ].map((s) => (
          <div
            key={s.label}
            className="px-3 py-2 flex-1"
            style={{
              background: "var(--atari-panel)",
              border: "1.5px solid var(--atari-border)",
              minWidth: "100px",
            }}
          >
            <p
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.5rem",
                color: "var(--atari-gray)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "1rem",
                color: s.color,
                fontWeight: 800,
              }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1 px-2 py-1"
          style={{
            fontFamily: "Press Start 2P, monospace",
            fontSize: "0.5rem",
            background: "transparent",
            color: "var(--atari-gray)",
            border: "1px solid var(--atari-border)",
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={10} />
          REFRESH
        </button>
      </div>

      {/* Log Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--atari-amber)" }} />
        </div>
      ) : logs.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16"
          style={{ border: "1.5px dashed var(--atari-border)" }}
        >
          <FileText size={28} style={{ color: "var(--atari-border)", marginBottom: 12 }} />
          <p
            style={{
              fontFamily: "Press Start 2P, monospace",
              fontSize: "0.7rem",
              color: "var(--atari-gray)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            No resumes generated yet
          </p>
          <p
            style={{
              fontFamily: "Press Start 2P, monospace",
              fontSize: "0.55rem",
              color: "var(--atari-border)",
              letterSpacing: "0.06em",
              marginTop: 4,
            }}
          >
            Use "Generate Resume" on any job card
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Job", "Company", "Status", "Duration", "Cost", "Requested", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.5rem",
                      color: "var(--atari-gray)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderBottom: "2px solid var(--atari-border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  style={{ borderBottom: "1px solid var(--atari-border)" }}
                >
                  <td
                    style={{
                      fontFamily: "Share Tech Mono, monospace",
                      fontSize: "0.75rem",
                      color: "var(--atari-white)",
                      padding: "8px 10px",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {log.jobTitle ?? `Job #${log.jobId}`}
                  </td>
                  <td
                    style={{
                      fontFamily: "Share Tech Mono, monospace",
                      fontSize: "0.7rem",
                      color: "var(--atari-gray)",
                      padding: "8px 10px",
                      textTransform: "uppercase",
                    }}
                  >
                    {log.jobCompany ?? "—"}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <StatusBadge status={log.status} />
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      color: "var(--atari-cyan)",
                      padding: "8px 10px",
                    }}
                  >
                    {formatDuration(log.durationMs)}
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      padding: "8px 10px",
                    }}
                  >
                    {log.creditCost != null ? (
                      <span
                        title={`Tokens: ${log.totalTokens?.toLocaleString() ?? "—"} (prompt: ${log.promptTokens?.toLocaleString() ?? "—"}, completion: ${log.completionTokens?.toLocaleString() ?? "—"})`}
                        style={{
                          color: "var(--atari-amber)",
                          cursor: "help",
                        }}
                      >
                        ${log.creditCost.toFixed(4)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--atari-border)" }}>—</span>
                    )}
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: "var(--atari-gray)",
                      padding: "8px 10px",
                    }}
                  >
                    {formatDate(log.requestedAt)}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <div className="flex items-center gap-2">
                      {/* Download link for completed resumes */}
                      {log.status === "completed" && log.fileUrl && (
                        <a
                          href={log.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                          style={{
                            fontFamily: "Press Start 2P, monospace",
                            fontSize: "0.5rem",
                            color: "var(--atari-cyan)",
                            letterSpacing: "0.06em",
                            textDecoration: "none",
                          }}
                        >
                          <Download size={10} />
                          PDF
                        </a>
                      )}
                      {/* Error hover for failed resumes */}
                      {log.status === "failed" && log.errorMessage && (
                        <span
                          title={log.errorMessage}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6rem",
                            color: "var(--atari-red)",
                            cursor: "help",
                          }}
                        >
                          Error
                        </span>
                      )}
                      {/* Delete button — always visible for completed and failed entries */}
                      {(log.status === "completed" || log.status === "failed") && (
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={deletingId === log.id}
                          className="flex items-center gap-1 px-1.5 py-0.5 transition-all"
                          style={{
                            fontFamily: "Press Start 2P, monospace",
                            fontSize: "0.45rem",
                            background: "transparent",
                            color: deletingId === log.id ? "var(--atari-gray)" : "var(--atari-red)",
                            border: `1px solid ${deletingId === log.id ? "var(--atari-gray)" : "var(--atari-red)"}`,
                            letterSpacing: "0.06em",
                            cursor: deletingId === log.id ? "not-allowed" : "pointer",
                            opacity: deletingId === log.id ? 0.5 : 1,
                          }}
                          title="Delete this resume and allow regeneration"
                        >
                          {deletingId === log.id ? (
                            <Loader2 size={9} className="animate-spin" />
                          ) : (
                            <Trash2 size={9} />
                          )}
                          DEL
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ResumeConfig() {
  const { data: config, isLoading } = trpc.resume.getConfig.useQuery();
  const updateConfig = trpc.resume.updateConfig.useMutation({
    onSuccess: () => toast.success("Configuration saved"),
    onError: (err) => toast.error(err.message),
  });

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const configItems = [
    {
      key: "profile",
      label: "Master Profile",
      description: "The base resume/profile document used as the source of truth for all resume generation.",
    },
    {
      key: "prompt_template",
      label: "Prompt Template",
      description: "The system prompt sent to the LLM that controls resume formatting, style, and optimization rules.",
    },
    {
      key: "resume_css",
      label: "Resume CSS",
      description: "The CSS stylesheet applied to the generated resume PDF for visual formatting.",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--atari-amber)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="p-3"
        style={{
          background: "rgba(44, 122, 123, 0.1)",
          border: "1px solid var(--atari-cyan)",
        }}
      >
        <p
          style={{
            fontFamily: "Press Start 2P, monospace",
            fontSize: "0.55rem",
            color: "var(--atari-cyan)",
            letterSpacing: "0.08em",
            lineHeight: 1.6,
          }}
        >
          DOCUMENT VAULT — These documents are stored in the database and reused for every resume generation.
          Edit them here to update the base profile, prompt template, or CSS styling.
        </p>
      </div>

      {configItems.map((item) => {
        const value = config?.[item.key] ?? "";
        const isEditing = editingKey === item.key;
        const charCount = value.length;

        return (
          <div
            key={item.key}
            className="p-4"
            style={{
              background: "var(--atari-panel)",
              border: "1.5px solid var(--atari-border)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p
                  style={{
                    fontFamily: "Press Start 2P, monospace",
                    fontSize: "0.7rem",
                    color: "var(--atari-white)",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: "Share Tech Mono, monospace",
                    fontSize: "0.7rem",
                    color: "var(--atari-gray)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: "var(--atari-gray)",
                  }}
                >
                  {charCount.toLocaleString()} chars
                </span>
                {isEditing ? (
                  <button
                    onClick={() => {
                      updateConfig.mutate({ key: item.key, value: editValue });
                      setEditingKey(null);
                    }}
                    disabled={updateConfig.isPending}
                    className="flex items-center gap-1 px-2 py-1"
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.5rem",
                      background: "var(--atari-green)",
                      color: "var(--atari-black)",
                      border: "2px solid var(--atari-green)",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }}
                  >
                    {updateConfig.isPending ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Save size={10} />
                    )}
                    SAVE
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingKey(item.key);
                      setEditValue(value);
                    }}
                    className="flex items-center gap-1 px-2 py-1"
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.5rem",
                      background: "transparent",
                      color: "var(--atari-amber)",
                      border: "1px solid var(--atari-amber)",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }}
                  >
                    <Settings size={10} />
                    EDIT
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={15}
                style={{
                  width: "100%",
                  fontFamily: "Share Tech Mono, monospace",
                  fontSize: "0.75rem",
                  color: "var(--atari-white)",
                  background: "oklch(0.08 0 0)",
                  border: "1px solid var(--atari-amber)",
                  padding: "10px",
                  resize: "vertical",
                  lineHeight: 1.5,
                  letterSpacing: "0.03em",
                }}
              />
            ) : (
              <div
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  fontSize: "0.7rem",
                  color: "var(--atari-gray)",
                  background: "oklch(0.08 0 0)",
                  border: "1px solid var(--atari-border)",
                  padding: "10px",
                  maxHeight: "120px",
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.4,
                }}
              >
                {value.substring(0, 500)}
                {value.length > 500 && (
                  <span style={{ color: "var(--atari-amber)" }}>
                    {" "}... ({(value.length - 500).toLocaleString()} more chars)
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ResumeGeneration() {
  const [tab, setTab] = useState<Tab>("log");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "log", label: "Resume Log", icon: <History size={14} /> },
    { id: "config", label: "Document Vault", icon: <Settings size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-2xl font-black text-foreground"
            style={{
              fontFamily: "Press Start 2P, monospace",
              letterSpacing: "0.05em",
            }}
          >
            Resume Generation
          </h2>
          <FileText size={20} style={{ color: "var(--atari-cyan)" }} />
        </div>
        <div className="atari-divider" />
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-2 flex-shrink-0 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1 px-3 py-2 transition-all"
            style={{
              fontFamily: "Press Start 2P, monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: tab === t.id ? "var(--atari-cyan)" : "transparent",
              color: tab === t.id ? "var(--atari-black)" : "var(--atari-gray)",
              border: `1.5px solid ${tab === t.id ? "var(--atari-cyan)" : "var(--atari-border)"}`,
              cursor: "pointer",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-5">
        {tab === "log" ? <ResumeLog /> : <ResumeConfig />}
      </div>
    </div>
  );
}
