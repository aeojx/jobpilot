import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Skills() {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.skills.get.useQuery();
  const [content, setContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.content) setContent(profile.content);
  }, [profile]);

  const upsert = trpc.skills.upsert.useMutation({
    onSuccess: () => {
      toast.success("Skills profile saved");
      utils.skills.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const rescore = trpc.skills.rescoreAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Re-scored ${data.updated} jobs`);
      utils.jobs.kanban.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith(".md") && file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      toast.error("Please upload a .md or .txt file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      toast.success("File loaded — click Save to apply");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "Press Start 2P, monospace", letterSpacing: "0.05em" }}
          >
            Skills Profile
          </h2>
          {profile && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "oklch(0.35 0 0)",
              }}
            >
              Updated {new Date(profile.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="atari-divider" />
        <p
          className="mt-2"
          style={{
            fontFamily: "Press Start 2P, monospace",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            color: "var(--atari-gray)",
            textTransform: "uppercase",
          }}
        >
          Upload your skills document — the LLM will use it to score all ingested jobs
        </p>
      </div>

      <div className="flex-1 px-5 pb-5 space-y-4">
        {/* File Drop Zone */}
        <div
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed cursor-pointer transition-all"
          style={{
            borderColor: isDragging ? "var(--atari-amber)" : "var(--atari-border)",
            background: isDragging ? "oklch(0.08 0 0)" : "transparent",
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={24} style={{ color: "var(--atari-gray)", marginBottom: 8 }} />
          <p
            style={{
              fontFamily: "Press Start 2P, monospace",
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.5 0 0)",
            }}
          >
            Drop .md or .txt file here, or click to browse
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>

        {/* Text Area */}
        <div>
          <label
            className="block mb-1"
            style={{
              fontFamily: "Press Start 2P, monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              color: "oklch(0.45 0 0)",
              textTransform: "uppercase",
            }}
          >
            Skills Document Content
          </label>
          <textarea
            className="brutal-input font-mono text-sm"
            rows={16}
            placeholder={`# My Skills Profile\n\n## Technical Skills\n- React, TypeScript, Node.js\n- Python, SQL, AWS\n\n## Experience\n- 5 years full-stack development\n- Team leadership\n\n## Industries\n- FinTech, SaaS, E-commerce`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", resize: "vertical" }}
          />
          <p
            className="mt-1"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "oklch(0.3 0 0)",
            }}
          >
            {content.length} characters · {content.split(/\s+/).filter(Boolean).length} words
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => upsert.mutate({ content })}
            disabled={upsert.isPending || !content.trim()}
            className="flex-1 py-3 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
            style={{
              fontFamily: "Press Start 2P, monospace",
              letterSpacing: "0.15em",
              background: "var(--atari-white)",
              color: "var(--atari-black)",
              border: "2px solid var(--atari-white)",
            }}
          >
            {upsert.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={14} /> Save Profile</>
            )}
          </button>

          <button
            onClick={() => rescore.mutate()}
            disabled={rescore.isPending || !profile}
            className="py-3 px-4 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
            style={{
              fontFamily: "Press Start 2P, monospace",
              letterSpacing: "0.1em",
              background: "transparent",
              color: "var(--atari-amber)",
              border: "2px solid var(--atari-amber)",
            }}
            title="Re-score all existing jobs with current skills profile"
          >
            {rescore.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Scoring...</>
            ) : (
              <><RefreshCw size={14} /> Re-score All</>
            )}
          </button>
        </div>

        {rescore.isPending && (
          <div
            className="p-3"
            style={{
              background: "oklch(0.08 0 0)",
              border: "1px solid oklch(0.5 0.22 27 / 0.3)",
            }}
          >
            <p
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                color: "var(--atari-amber)",
                textTransform: "uppercase",
              }}
            >
              LLM is scoring all jobs... this may take a moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
