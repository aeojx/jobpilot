import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PasswordGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const unlock = trpc.gate.unlock.useMutation({
    onSuccess: () => {
      toast.success("ACCESS GRANTED");
      onUnlocked();
    },
    onError: () => {
      setShake(true);
      setPassword("");
      setTimeout(() => setShake(false), 600);
      toast.error("ACCESS DENIED — INCORRECT PASSWORD");
    },
  });

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    unlock.mutate({ password: password.trim() });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: "var(--atari-black)",
        fontFamily: "'Press Start 2P', monospace",
        cursor: "default",
        userSelect: "none",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* CRT scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
          zIndex: 50,
        }}
      />

      {/* Main content */}
      <div
        className="flex flex-col items-center gap-8 w-full max-w-lg px-6"
        style={{ position: "relative", zIndex: 10 }}
      >
        {/* Logo */}
        <div className="text-center">
          <div
            style={{
              fontSize: "clamp(18px, 4vw, 28px)",
              color: "var(--atari-amber)",
              textShadow: "0 0 20px var(--atari-amber), 0 0 40px rgba(255,176,0,0.4)",
              letterSpacing: "0.1em",
              lineHeight: 1.4,
            }}
          >
            JOB
            <span style={{ color: "var(--atari-cyan)", textShadow: "0 0 20px var(--atari-cyan)" }}>
              PILOT
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "2px",
              background: "linear-gradient(90deg, transparent, var(--atari-amber), var(--atari-cyan), transparent)",
              marginTop: "12px",
              boxShadow: "0 0 8px var(--atari-amber)",
            }}
          />
        </div>

        {/* Terminal box */}
        <div
          className={`w-full ${shake ? "animate-shake" : ""}`}
          style={{
            border: "2px solid var(--atari-amber)",
            background: "rgba(255,176,0,0.04)",
            boxShadow: "0 0 20px rgba(255,176,0,0.2), inset 0 0 20px rgba(255,176,0,0.03)",
            padding: "32px 28px",
          }}
        >
          {/* Terminal header */}
          <div
            style={{
              fontSize: "8px",
              color: "var(--atari-amber)",
              marginBottom: "24px",
              letterSpacing: "0.15em",
              opacity: 0.7,
            }}
          >
            ▶ SECURE ACCESS TERMINAL v1.0
          </div>

          {/* Prompt line */}
          <div
            style={{
              fontSize: "9px",
              color: "var(--atari-green)",
              marginBottom: "16px",
              letterSpacing: "0.1em",
            }}
          >
            ENTER ACCESS CODE:
          </div>

          {/* Password input form */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid var(--atari-amber)",
                paddingBottom: "8px",
                marginBottom: "28px",
              }}
            >
              <span style={{ color: "var(--atari-amber)", fontSize: "10px" }}>▶</span>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--atari-amber)",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    width: "100%",
                    caretColor: "transparent",
                  }}
                  placeholder=""
                />
                {/* Custom blinking cursor */}
                <span
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "8px",
                    height: "14px",
                    background: showCursor ? "var(--atari-amber)" : "transparent",
                    display: "inline-block",
                    boxShadow: showCursor ? "0 0 6px var(--atari-amber)" : "none",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={unlock.isPending || !password.trim()}
              style={{
                width: "100%",
                padding: "14px",
                background: unlock.isPending ? "var(--atari-border)" : "var(--atari-amber)",
                color: "var(--atari-black)",
                border: "none",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                cursor: unlock.isPending ? "not-allowed" : "pointer",
                boxShadow: unlock.isPending ? "none" : "0 0 16px rgba(255,176,0,0.5)",
                transition: "all 0.15s",
              }}
            >
              {unlock.isPending ? "VERIFYING..." : "▶ UNLOCK ACCESS"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: "7px",
            color: "var(--atari-border)",
            letterSpacing: "0.1em",
            textAlign: "center",
            lineHeight: 2,
          }}
        >
          AUTHORIZED PERSONNEL ONLY
          <br />
          SESSION VALID FOR 30 DAYS
        </div>
      </div>

      {/* Shake animation style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.6s ease-in-out; }
      `}</style>
    </div>
  );
}
