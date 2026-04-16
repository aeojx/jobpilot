import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Download, FileText, Clock, User, CheckCircle, XCircle, Loader2, Save } from "lucide-react";

type Tab = "log" | "config";

export default function ResumeGeneration() {
  const [activeTab, setActiveTab] = useState<Tab>("log");

  return (
    <div className="p-5" style={{ fontFamily: "var(--font-mono)", color: "var(--atari-text)" }}>
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "var(--font-pixel)", color: "var(--atari-cyan)", letterSpacing: "0.1em" }}
        >
          RESUME GENERATION
        </h1>
        <p style={{ fontSize: "0.75rem", color: "var(--atari-gray)", letterSpacing: "0.05em" }}>
          Track resume generation requests and configure templates
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid var(--atari-border)" }}>
        {([
          { id: "log" as Tab, label: "RESUME LOG" },
          { id: "config" as Tab, label: "CONFIGURATION" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 text-xs transition-all"
            style={{
              fontFamily: "var(--font-pixel)",
              letterSpacing: "0.08em",
              color: activeTab === tab.id ? "var(--atari-cyan)" : "var(--atari-gray)",
              borderBottom: activeTab === tab.id ? "2px solid var(--atari-cyan)" : "2px solid transparent",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "log" ? <ResumeLog /> : <ResumeConfig />}
    </div>
  );
}

function ResumeLog() {
  const { data: logs = [], isLoading } = trpc.jobs.resumeLog.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={24} style={{ color: "var(--atari-cyan)" }} />
        <span className="ml-2" style={{ color: "var(--atari-gray)", fontSize: "0.75rem" }}>Loading resume log...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-20" style={{ color: "var(--atari-gray)" }}>
        <FileText size={40} className="mx-auto mb-3 opacity-40" />
        <p style={{ fontSize: "0.8rem", letterSpacing: "0.05em" }}>No resumes generated yet</p>
        <p style={{ fontSize: "0.65rem", marginTop: "0.5rem" }}>
          Click "Generate Resume" on any job card to get started
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--atari-border)" }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>JOB TITLE</th>
            <th style={thStyle}>COMPANY</th>
            <th style={thStyle}>REQUESTED BY</th>
            <th style={thStyle}>REQUESTED AT</th>
            <th style={thStyle}>STATUS</th>
            <th style={thStyle}>DURATION</th>
            <th style={thStyle}>DOWNLOAD</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr
              key={log.id}
              style={{
                borderBottom: "1px solid var(--atari-border)",
                background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
              }}
            >
              <td style={tdStyle}>{log.id}</td>
              <td style={{ ...tdStyle, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {log.jobTitle}
              </td>
              <td style={tdStyle}>{log.jobCompany}</td>
              <td style={tdStyle}>
                <span className="flex items-center gap-1">
                  <User size={10} />
                  {log.requestedBy}
                </span>
              </td>
              <td style={tdStyle}>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {log.requestedAt ? new Date(log.requestedAt).toLocaleString() : "—"}
                </span>
              </td>
              <td style={tdStyle}>
                <StatusBadge status={log.status} />
              </td>
              <td style={tdStyle}>
                {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "—"}
              </td>
              <td style={tdStyle}>
                {log.status === "completed" && log.filePath ? (
                  <a
                    href={`/api/resume/download/${log.jobId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                    style={{ color: "var(--atari-cyan)", textDecoration: "none" }}
                  >
                    <Download size={12} />
                    PDF
                  </a>
                ) : log.status === "generating" ? (
                  <Loader2 size={12} className="animate-spin" style={{ color: "var(--atari-amber)" }} />
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    completed: { color: "var(--atari-green)", icon: <CheckCircle size={10} />, label: "DONE" },
    generating: { color: "var(--atari-amber)", icon: <Loader2 size={10} className="animate-spin" />, label: "GENERATING" },
    failed: { color: "var(--atari-red)", icon: <XCircle size={10} />, label: "FAILED" },
    pending: { color: "var(--atari-gray)", icon: <Clock size={10} />, label: "PENDING" },
  };
  const c = config[status] || config.pending;
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded"
      style={{
        color: c.color,
        border: `1px solid ${c.color}`,
        fontSize: "0.6rem",
        letterSpacing: "0.06em",
        fontFamily: "var(--font-pixel)",
        whiteSpace: "nowrap",
      }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function ResumeConfig() {
  const { data: config, isLoading } = trpc.jobs.resumeConfig.useQuery();
  const updateConfig = trpc.jobs.updateResumeConfig.useMutation({
    onSuccess: () => toast.success("Configuration saved!"),
    onError: (e) => toast.error(e.message),
  });

  const [promptTemplate, setPromptTemplate] = useState("");
  const [cssTemplate, setCssTemplate] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setPromptTemplate(config.promptTemplate);
      setCssTemplate(config.cssTemplate);
      setHasChanges(false);
    }
  }, [config]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={24} style={{ color: "var(--atari-cyan)" }} />
        <span className="ml-2" style={{ color: "var(--atari-gray)", fontSize: "0.75rem" }}>Loading configuration...</span>
      </div>
    );
  }

  const handleSave = () => {
    updateConfig.mutate({ promptTemplate, cssTemplate });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Prompt Template */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "0.7rem",
              color: "var(--atari-cyan)",
              letterSpacing: "0.08em",
            }}
          >
            PROMPT TEMPLATE
          </label>
          <span style={{ fontSize: "0.6rem", color: "var(--atari-gray)" }}>
            Use {"{{PROFILE_PLACEHOLDER}}"} and {"{{JD_PLACEHOLDER}}"} as placeholders
          </span>
        </div>
        <textarea
          value={promptTemplate}
          onChange={(e) => { setPromptTemplate(e.target.value); setHasChanges(true); }}
          rows={20}
          style={{
            width: "100%",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--atari-text)",
            background: "var(--atari-black)",
            border: "1px solid var(--atari-border)",
            padding: "0.75rem",
            resize: "vertical",
            lineHeight: "1.5",
            letterSpacing: "0.03em",
          }}
        />
      </div>

      {/* CSS Template */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "0.7rem",
              color: "var(--atari-cyan)",
              letterSpacing: "0.08em",
            }}
          >
            CSS STYLING
          </label>
          <span style={{ fontSize: "0.6rem", color: "var(--atari-gray)" }}>
            Applied to the HTML wrapper before PDF conversion
          </span>
        </div>
        <textarea
          value={cssTemplate}
          onChange={(e) => { setCssTemplate(e.target.value); setHasChanges(true); }}
          rows={15}
          style={{
            width: "100%",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--atari-text)",
            background: "var(--atari-black)",
            border: "1px solid var(--atari-border)",
            padding: "0.75rem",
            resize: "vertical",
            lineHeight: "1.5",
            letterSpacing: "0.03em",
          }}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateConfig.isPending}
          className="flex items-center gap-2 px-6 py-2 text-xs transition-all"
          style={{
            fontFamily: "var(--font-pixel)",
            letterSpacing: "0.08em",
            background: hasChanges ? "var(--atari-cyan)" : "transparent",
            color: hasChanges ? "var(--atari-black)" : "var(--atari-gray)",
            border: `1px solid ${hasChanges ? "var(--atari-cyan)" : "var(--atari-border)"}`,
            cursor: hasChanges ? "pointer" : "not-allowed",
            opacity: updateConfig.isPending ? 0.6 : 1,
          }}
        >
          {updateConfig.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          SAVE CONFIGURATION
        </button>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.75rem",
  fontFamily: "var(--font-pixel)",
  fontSize: "0.6rem",
  color: "var(--atari-cyan)",
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  fontFamily: "var(--font-mono)",
  fontSize: "0.65rem",
  color: "var(--atari-text)",
  letterSpacing: "0.03em",
};
