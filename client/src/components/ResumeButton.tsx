import { trpc } from "@/lib/trpc";
import { Download, FileText, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ResumeButtonProps {
  jobId: number;
  compact?: boolean;
}

type ResumeStatus = "none" | "generating" | "completed" | "failed";

export default function ResumeButton({ jobId, compact = false }: ResumeButtonProps) {
  const [polling, setPolling] = useState(false);

  const generateMutation = trpc.resume.generate.useMutation({
    onSuccess: () => {
      setPolling(true);
      toast.success("Resume generation started...");
    },
    onError: (err) => toast.error(err.message),
  });

  const statusQuery = trpc.resume.status.useQuery(
    { jobId },
    {
      refetchInterval: polling ? 2000 : false,
      enabled: true,
    }
  );

  const status: ResumeStatus = (statusQuery.data?.status as ResumeStatus) ?? "none";
  const downloadUrl = statusQuery.data?.url ?? null;

  // Stop polling when completed or failed
  useEffect(() => {
    if (polling && (status === "completed" || status === "failed")) {
      setPolling(false);
      if (status === "completed") {
        toast.success("Resume generated successfully!");
      } else if (status === "failed") {
        toast.error("Resume generation failed. Try again.");
      }
    }
  }, [status, polling]);

  // Start polling when mutation fires
  const isGenerating = status === "generating" || generateMutation.isPending || polling;

  const handleClick = () => {
    if (status === "completed" && downloadUrl) {
      // Download
      window.open(downloadUrl, "_blank");
      return;
    }
    if (isGenerating) return;
    // Generate or retry
    generateMutation.mutate({ jobId });
  };

  const getButtonConfig = () => {
    if (isGenerating) {
      return {
        label: compact ? "..." : "Generating...",
        icon: <Loader2 size={compact ? 10 : 12} className="animate-spin" />,
        bg: "transparent",
        color: "var(--atari-amber)",
        border: "1.5px solid var(--atari-amber)",
        disabled: true,
        opacity: "0.7",
      };
    }
    if (status === "completed") {
      return {
        label: compact ? "PDF" : "Download Resume",
        icon: <Download size={compact ? 10 : 12} />,
        bg: "var(--atari-cyan)",
        color: "var(--atari-black)",
        border: "2px solid var(--atari-cyan)",
        disabled: false,
        opacity: "1",
      };
    }
    if (status === "failed") {
      return {
        label: compact ? "Retry" : "Retry Resume",
        icon: <RefreshCw size={compact ? 10 : 12} />,
        bg: "transparent",
        color: "var(--atari-red)",
        border: "1.5px solid var(--atari-red)",
        disabled: false,
        opacity: "0.8",
      };
    }
    // none
    return {
      label: compact ? "Resume" : "Generate Resume",
      icon: <FileText size={compact ? 10 : 12} />,
      bg: "transparent",
      color: "var(--atari-cyan)",
      border: "1.5px solid var(--atari-cyan)",
      disabled: false,
      opacity: "0.8",
    };
  };

  const config = getButtonConfig();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      disabled={config.disabled}
      className="flex items-center gap-1 px-3 py-2 font-bold text-xs tracking-widest uppercase transition-all"
      style={{
        fontFamily: "Press Start 2P, monospace",
        background: config.bg,
        color: config.color,
        border: config.border,
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
        opacity: config.opacity,
        fontSize: compact ? "0.5rem" : undefined,
        padding: compact ? "4px 8px" : undefined,
      }}
      onMouseEnter={(e) => {
        if (!config.disabled) e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        if (!config.disabled) e.currentTarget.style.opacity = config.opacity;
      }}
    >
      {config.icon}
      {config.label}
    </button>
  );
}
