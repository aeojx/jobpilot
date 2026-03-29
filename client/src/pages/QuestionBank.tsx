import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CheckCircle, HelpCircle, Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function QuestionBank() {
  const { user } = useAuth();
  const isOwner = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: questions = [], isLoading } = trpc.questions.all.useQuery();
  const [answerMap, setAnswerMap] = useState<Record<number, string>>({});

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

  return (
    <div className="flex flex-col h-full overflow-auto">
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
          {isOwner ? "Review and answer questions from the Applier" : "Your submitted questions and owner responses"}
        </p>
      </div>

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
                      {q.jobTitle ?? "Unknown Job"} · {q.jobCompany ?? ""}
                    </span>
                  </div>

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
                    Question from {q.askedByName ?? "Applier"}
                  </p>
                  <p
                    className="mb-3"
                    style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "oklch(0.85 0 0)" }}
                  >
                    {q.question}
                  </p>

                  {/* Answer input (Owner only) */}
                  {isOwner && (
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
                  )}

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
                      {q.jobTitle ?? "Unknown Job"} · {q.jobCompany ?? ""}
                    </span>
                  </div>

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
                    Q:
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

        {questions.length === 0 && !isLoading && (
          <div
            className="flex flex-col items-center justify-center py-16"
            style={{ border: "1.5px dashed var(--atari-border)" }}
          >
            <MessageSquare size={28} style={{ color: "var(--atari-border)", marginBottom: 12 }} />
            <p
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
          </div>
        )}
      </div>
    </div>
  );
}
