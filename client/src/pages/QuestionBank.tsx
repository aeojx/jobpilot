import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CheckCircle, HelpCircle, Loader2, MessageSquare, PlusCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function QuestionBank() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: questions = [], isLoading } = trpc.questions.all.useQuery();
  const [answerMap, setAnswerMap] = useState<Record<number, string>>({});

  // New question form state
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobCompany, setNewJobCompany] = useState("");

  const askMutation = trpc.questions.ask.useMutation({
    onSuccess: () => {
      toast.success("Question submitted!");
      setNewQuestion("");
      setNewJobTitle("");
      setNewJobCompany("");
      setShowForm(false);
      utils.questions.all.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const answerMutation = trpc.questions.answer.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Answer submitted");
      setAnswerMap((prev) => { const next = { ...prev }; delete next[vars.id]; return next; });
      utils.questions.all.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unanswered = questions.filter((q) => !q.answer);
  const answered = questions.filter((q) => q.answer);

  const handleAsk = () => {
    if (!newQuestion.trim()) return;
    askMutation.mutate({
      jobId: 0,
      jobTitle: newJobTitle.trim() || undefined,
      jobCompany: newJobCompany.trim() || undefined,
      question: newQuestion.trim(),
    });
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "Press Start 2P, monospace", letterSpacing: "0.05em" }}
          >
            Question Bank
          </h2>
          <div className="flex items-center gap-3">
            {unanswered.length > 0 && (
              <span
                className="brutal-tag"
                style={{ borderColor: "var(--atari-amber)", color: "var(--atari-amber)", fontSize: "0.75rem" }}
              >
                {unanswered.length} Pending
              </span>
            )}
            {isLoading && <Loader2 size={14} className="animate-spin text-foreground/40" />}
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 font-black text-xs tracking-widest uppercase transition-all"
              style={{
                fontFamily: "Press Start 2P, monospace",
                background: showForm ? "var(--atari-cyan)" : "transparent",
                color: showForm ? "var(--atari-black)" : "var(--atari-cyan)",
                border: "2px solid var(--atari-cyan)",
                letterSpacing: "0.08em",
                fontSize: "0.6rem",
              }}
            >
              <PlusCircle size={12} />
              New Question
            </button>
          </div>
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
          All users can submit and answer questions in the shared question bank
        </p>
      </div>

      {/* New Question Form */}
      {showForm && (
        <div
          className="mx-5 mb-4 p-4 flex-shrink-0"
          style={{
            background: "var(--atari-panel)",
            border: "2px solid var(--atari-cyan)",
          }}
        >
          <p
            className="mb-3"
            style={{
              fontFamily: "Press Start 2P, monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              color: "var(--atari-cyan)",
              textTransform: "uppercase",
            }}
          >
            Submit a New Question
          </p>

          {/* Optional job context row */}
          <div className="flex gap-2 mb-2">
            <input
              className="brutal-input flex-1 text-sm"
              placeholder="Job title (optional)"
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
            />
            <input
              className="brutal-input flex-1 text-sm"
              placeholder="Company (optional)"
              value={newJobCompany}
              onChange={(e) => setNewJobCompany(e.target.value)}
            />
          </div>

          {/* Question text */}
          <textarea
            className="brutal-input w-full text-sm mb-3"
            placeholder="Type your question here..."
            rows={3}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && newQuestion.trim()) {
                handleAsk();
              }
            }}
            style={{ resize: "vertical", minHeight: "72px" }}
          />

          <div className="flex items-center justify-between gap-2">
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                color: "oklch(0.35 0 0)",
              }}
            >
              Submitted as: {user?.name ?? "You"} · Ctrl+Enter to send
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setNewQuestion(""); setNewJobTitle(""); setNewJobCompany(""); }}
                className="px-3 py-2 text-xs uppercase tracking-widest"
                style={{
                  fontFamily: "Press Start 2P, monospace",
                  background: "transparent",
                  color: "oklch(0.4 0 0)",
                  border: "1.5px solid var(--atari-border)",
                  fontSize: "0.55rem",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAsk}
                disabled={!newQuestion.trim() || askMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 font-black text-xs tracking-widest uppercase transition-all"
                style={{
                  fontFamily: "Press Start 2P, monospace",
                  background: newQuestion.trim() ? "var(--atari-cyan)" : "oklch(0.2 0 0)",
                  color: newQuestion.trim() ? "var(--atari-black)" : "oklch(0.35 0 0)",
                  border: `2px solid ${newQuestion.trim() ? "var(--atari-cyan)" : "var(--atari-border)"}`,
                  letterSpacing: "0.08em",
                  fontSize: "0.6rem",
                  cursor: newQuestion.trim() ? "pointer" : "not-allowed",
                }}
              >
                {askMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-5 pb-5 space-y-6">
        {/* Unanswered */}
        {unanswered.length > 0 && (
          <div>
            <p
              className="mb-3"
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                color: "var(--atari-amber)",
                textTransform: "uppercase",
              }}
            >
              Awaiting Answer ({unanswered.length})
            </p>
            <div className="space-y-3">
              {unanswered.map((q) => (
                <div
                  key={q.id}
                  className="p-4"
                  style={{
                    background: "var(--atari-panel)",
                    border: "1.5px solid oklch(0.5 0.22 27 / 0.4)",
                  }}
                >
                  {/* Job context */}
                  {(q.jobTitle || q.jobCompany) && (
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle size={12} style={{ color: "var(--atari-amber)", flexShrink: 0 }} />
                      <span
                        style={{
                          fontFamily: "Press Start 2P, monospace",
                          fontSize: "0.7rem",
                          letterSpacing: "0.08em",
                          color: "var(--atari-amber)",
                          textTransform: "uppercase",
                        }}
                      >
                        {q.jobTitle ?? "Unknown Job"}{q.jobCompany ? ` · ${q.jobCompany}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Question */}
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      color: "var(--atari-gray)",
                      textTransform: "uppercase",
                    }}
                  >
                    Question from {q.askedByName ?? "User"}
                  </p>
                  <p
                    className="mb-3"
                    style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "oklch(0.85 0 0)" }}
                  >
                    {q.question}
                  </p>

                  {/* Answer input — all authenticated users */}
                  <div className="flex gap-2">
                    <input
                      className="brutal-input flex-1 text-sm"
                      placeholder="Type your answer..."
                      value={answerMap[q.id] ?? ""}
                      onChange={(e) => setAnswerMap((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && answerMap[q.id]?.trim()) {
                          answerMutation.mutate({ id: q.id, answer: answerMap[q.id]! });
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (answerMap[q.id]?.trim()) {
                          answerMutation.mutate({ id: q.id, answer: answerMap[q.id]! });
                        }
                      }}
                      disabled={!answerMap[q.id]?.trim() || answerMutation.isPending}
                      className="px-4 py-2 font-black text-xs tracking-widest uppercase flex items-center gap-1 transition-all"
                      style={{
                        fontFamily: "Press Start 2P, monospace",
                        background: "var(--atari-white)",
                        color: "var(--atari-black)",
                        border: "2px solid var(--atari-white)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {answerMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "Answer"}
                    </button>
                  </div>

                  {/* Date */}
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      color: "oklch(0.3 0 0)",
                    }}
                  >
                    Asked {new Date(q.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answered */}
        {answered.length > 0 && (
          <div>
            <p
              className="mb-3"
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                color: "var(--atari-green)",
                textTransform: "uppercase",
              }}
            >
              Answered ({answered.length})
            </p>
            <div className="space-y-3">
              {answered.map((q) => (
                <div
                  key={q.id}
                  className="p-4"
                  style={{
                    background: "oklch(0.06 0 0)",
                    border: "1.5px solid var(--atari-border)",
                  }}
                >
                  {(q.jobTitle || q.jobCompany) && (
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={12} style={{ color: "var(--atari-green)", flexShrink: 0 }} />
                      <span
                        style={{
                          fontFamily: "Press Start 2P, monospace",
                          fontSize: "0.7rem",
                          letterSpacing: "0.08em",
                          color: "oklch(0.5 0 0)",
                          textTransform: "uppercase",
                        }}
                      >
                        {q.jobTitle ?? "Unknown Job"}{q.jobCompany ? ` · ${q.jobCompany}` : ""}
                      </span>
                    </div>
                  )}

                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      color: "oklch(0.35 0 0)",
                      textTransform: "uppercase",
                    }}
                  >
                    Q: <span style={{ color: "oklch(0.45 0 0)" }}>{q.askedByName ?? "User"}</span>
                  </p>
                  <p
                    className="mb-3"
                    style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "oklch(0.65 0 0)" }}
                  >
                    {q.question}
                  </p>

                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "Press Start 2P, monospace",
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      color: "var(--atari-green)",
                      textTransform: "uppercase",
                    }}
                  >
                    A:
                  </p>
                  <p
                    style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "oklch(0.85 0 0)" }}
                  >
                    {q.answer}
                  </p>

                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      color: "var(--atari-border)",
                    }}
                  >
                    Answered {q.answeredAt ? new Date(q.answeredAt).toLocaleString() : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {questions.length === 0 && !isLoading && !showForm && (
          <div
            className="flex flex-col items-center justify-center py-16"
            style={{ border: "1.5px dashed var(--atari-border)" }}
          >
            <MessageSquare size={28} style={{ color: "var(--atari-border)", marginBottom: 12 }} />
            <p
              className="mb-4"
              style={{
                fontFamily: "Press Start 2P, monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.12em",
                color: "oklch(0.3 0 0)",
                textTransform: "uppercase",
              }}
            >
              No questions yet
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 font-black text-xs tracking-widest uppercase"
              style={{
                fontFamily: "Press Start 2P, monospace",
                background: "transparent",
                color: "var(--atari-cyan)",
                border: "2px solid var(--atari-cyan)",
                letterSpacing: "0.08em",
                fontSize: "0.6rem",
              }}
            >
              <PlusCircle size={12} />
              Ask the first question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
