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
        navigate("/kanban");
      } else {
        navigate("/apply");
      }
    }
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="brutal-divider mb-6 w-32 mx-auto" />
          <p
            style={{
              fontFamily: "var(--font-condensed)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "oklch(0.4 0 0)",
              fontSize: "0.75rem",
            }}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      {/* Top accent line */}
      <div className="w-full max-w-md mb-12">
        <div className="brutal-divider" />
      </div>

      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <h1
          className="font-black text-foreground mb-1"
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "clamp(4rem, 12vw, 7rem)",
            letterSpacing: "-0.01em",
            lineHeight: 0.9,
          }}
        >
          JOB
          <br />
          <span style={{ color: "oklch(0.5 0.22 27)" }}>PILOT</span>
        </h1>

        {/* Tagline */}
        <p
          className="mt-4 mb-8"
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "0.75rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "oklch(0.4 0 0)",
          }}
        >
          Job Application Command Center
        </p>

        {/* CTA */}
        <a
          href={getLoginUrl()}
          className="block w-full py-4 text-center font-black text-sm tracking-widest uppercase transition-all duration-100"
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "1rem",
            letterSpacing: "0.2em",
            background: "oklch(0.98 0 0)",
            color: "oklch(0.04 0 0)",
            border: "2px solid oklch(0.98 0 0)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "oklch(0.5 0.22 27)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "oklch(0.5 0.22 27)";
            (e.currentTarget as HTMLAnchorElement).style.color = "oklch(0.98 0 0)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "oklch(0.98 0 0)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "oklch(0.98 0 0)";
            (e.currentTarget as HTMLAnchorElement).style.color = "oklch(0.04 0 0)";
          }}
        >
          Enter System
        </a>

        {/* Feature list */}
        <div className="mt-10 text-left space-y-2">
          {[
            "API-powered job ingestion",
            "LLM semantic match scoring",
            "Drag-and-drop Kanban pipeline",
            "Applier workflow & gamification",
            "Question bank & owner notifications",
          ].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div
                style={{
                  width: 6,
                  height: 6,
                  background: "oklch(0.5 0.22 27)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontSize: "0.8rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "oklch(0.5 0 0)",
                }}
              >
                {f}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="w-full max-w-md mt-12">
        <div className="brutal-divider" />
      </div>
    </div>
  );
}
