import { trpc, type ResumeStatusPayload } from "@/lib/trpc";
import { Download, FileText, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ResumeButtonProps {
  jobId: number;
  compact?: boolean;
  /** From parent batch query — avoids per-card tRPC GET batching (414 URI too large) */
  resumeStatus?: ResumeStatusPayload;
  /** While parent batch is loading */
  statusLoading?: boolean;
  /** Parent refetches batch on an interval while this is true for this job */
  isResumePolling?: boolean;
  /** Called after generate mutation succeeds so parent can poll batch */
  onGenerationStarted?: (jobId: number) => void;
}

type ResumeStatus = "none" | "generating" | "completed" | "failed";

export default function ResumeButton({
  jobId,
  compact = false,
  resumeStatus,
  statusLoading = false,
  isResumePolling = false,
  onGenerationStarted,
}: ResumeButtonProps) {
  const [awaitingCompletion, setAwaitingCompletion] = useState(false);
  const utils = trpc.useUtils();

  const generateMutation = trpc.resume.generate.useMutation({
    onSuccess: () => {
      setAwaitingCompletion(true);
      onGenerationStarted?.(jobId);
      void utils.resume.statusBatch.invalidate();
      toast.success("Resume generation started...");
    },
    onError: (err) => toast.error(err.message),
  });

  const status: ResumeStatus = (resumeStatus?.status as ResumeStatus) ?? "none";
  const downloadUrl = resumeStatus?.url ?? null;

  useEffect(() => {
    if (!awaitingCompletion) return;
    if (status === "completed") {
      setAwaitingCompletion(false);
      toast.success("Resume generated successfully!");
    } else if (status === "failed") {
      setAwaitingCompletion(false);
      toast.error("Resume generation failed. Try again.");
    }
  }, [awaitingCompletion, status]);

  const isGenerating =
    generateMutation.isPending || status === "generating" || isResumePolling;

  const handleClick = () => {
    if (status === "completed" && downloadUrl) {
      window.open(downloadUrl, "_blank");
      return;
    }
    if (isGenerating || statusLoading) return;
    generateMutation.mutate({ jobId });
  };

  const getButtonConfig = () => {
    if (statusLoading && !resumeStatus) {
      return {
        label: compact ? "..." : "Loading...",
        icon: <Loader2 size={compact ? 10 : 12} className="animate-spin" />,
        bg: "transparent",
        color: "var(--atari-gray)",
        border: "1.5px solid var(--atari-border)",
        disabled: true,
        opacity: "0.7",
      };
    }
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
