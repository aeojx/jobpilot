import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/apply");
      }
    }
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--atari-black)" }}>
        <p className="font-pixel text-xs glow-amber blink" style={{ color: "var(--atari-amber)", letterSpacing: "0.2em" }}>
          LOADING...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--atari-black)" }}
    >
      {/* CRT corner decorations */}
      <div className="fixed top-4 left-4 text-xs" style={{ color: "var(--atari-border)", fontFamily: "Share Tech Mono" }}>┌─</div>
      <div className="fixed top-4 right-4 text-xs" style={{ color: "var(--atari-border)", fontFamily: "Share Tech Mono" }}>─┐</div>
      <div className="fixed bottom-4 left-4 text-xs" style={{ color: "var(--atari-border)", fontFamily: "Share Tech Mono" }}>└─</div>
      <div className="fixed bottom-4 right-4 text-xs" style={{ color: "var(--atari-border)", fontFamily: "Share Tech Mono" }}>─┘</div>

      <div className="w-full max-w-sm text-center">
        {/* Coin prompt */}
        <div
          className="inline-block px-4 py-2 mb-8 animate-pixel-pulse"
          style={{ border: "2px solid var(--atari-amber)", boxShadow: "0 0 12px rgba(255,176,0,0.3)" }}
        >
          <p className="font-pixel" style={{ color: "var(--atari-amber)", fontSize: "9px", letterSpacing: "0.15em" }}>
            ★ INSERT COIN ★
          </p>
        </div>

        {/* Title */}
        <div className="mb-2">
          <h1 className="font-pixel glow-amber" style={{ color: "var(--atari-amber)", fontSize: "clamp(28px, 8vw, 42px)", lineHeight: 1.3 }}>
            JOB
          </h1>
          <h1 className="font-pixel glow-cyan" style={{ color: "var(--atari-cyan)", fontSize: "clamp(28px, 8vw, 42px)", lineHeight: 1.3 }}>
            PILOT
          </h1>
        </div>

        {/* Animated divider */}
        <div className="atari-divider mb-6" />

        {/* Tagline */}
        <p className="text-xs mb-8" style={{ color: "var(--atari-gray)", letterSpacing: "0.2em", fontFamily: "Share Tech Mono" }}>
          JOB APPLICATION COMMAND CENTER
        </p>

        {/* CTA */}
        <a
          href={getLoginUrl()}
          className="block w-full py-3 text-center transition-all"
          style={{
            fontFamily: "Press Start 2P, monospace",
            fontSize: "10px",
            letterSpacing: "0.15em",
            background: "transparent",
            color: "var(--atari-amber)",
            border: "2px solid var(--atari-amber)",
            boxShadow: "0 0 8px rgba(255,176,0,0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--atari-amber)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--atari-black)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px rgba(255,176,0,0.6)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--atari-amber)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 8px rgba(255,176,0,0.3)";
          }}
        >
          ▶ PRESS START
        </a>

        {/* Feature list */}
        <div className="mt-10 text-left space-y-3">
          {[
            { icon: "◆", label: "API-POWERED JOB INGESTION", color: "var(--atari-amber)" },
            { icon: "◆", label: "LLM SEMANTIC MATCH SCORING", color: "var(--atari-cyan)" },
            { icon: "◆", label: "DRAG-AND-DROP DASHBOARD", color: "var(--atari-magenta)" },
            { icon: "◆", label: "APPLIER WORKFLOW + GAMIFICATION", color: "var(--atari-green)" },
            { icon: "◆", label: "QUESTION BANK + NOTIFICATIONS", color: "var(--atari-orange)" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span style={{ color: f.color, fontSize: "8px", flexShrink: 0 }}>{f.icon}</span>
              <span className="text-xs" style={{ color: "var(--atari-gray)", letterSpacing: "0.1em", fontFamily: "Share Tech Mono" }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs mt-10 animate-pixel-pulse" style={{ color: "var(--atari-border)", fontFamily: "Share Tech Mono" }}>
          © 2025 JOBPILOT SYSTEMS · ALL RIGHTS RESERVED
        </p>
      </div>
    </div>
  );
}
