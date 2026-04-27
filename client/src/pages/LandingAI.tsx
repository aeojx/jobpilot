import { useState } from "react";

/* ─── Scoped styles ─────────────────────────────────────────────────── */
const STYLE = `
  .lai,
  .lai *,
  .lai *::before,
  .lai *::after {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
    border-radius: revert !important;
  }
  .lai h1, .lai h2, .lai h3, .lai h4, .lai h5, .lai h6 {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    text-transform: none !important;
    letter-spacing: -0.02em !important;
    line-height: 1.15 !important;
  }
  .lai {
    background-image: none !important;
    background-color: #050810 !important;
    font-size: 16px !important;
  }
  body:has(.lai) {
    background-image: none !important;
    background-color: #050810 !important;
  }
  .lai button { border-radius: 8px !important; }
  .lai a { text-decoration: none !important; }
  .lai-screenshot img { display: block; width: 100%; height: auto; }
  @keyframes lai-fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lai-fade-1 { animation: lai-fade-up 0.7s ease both; }
  .lai-fade-2 { animation: lai-fade-up 0.7s 0.15s ease both; }
  .lai-fade-3 { animation: lai-fade-up 0.7s 0.3s ease both; }
  @keyframes lai-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .6; }
  }
  .lai-pulse { animation: lai-pulse 2.5s ease-in-out infinite; }
  @media (max-width: 768px) {
    .lai-grid-2 { grid-template-columns: 1fr !important; }
    .lai-grid-3 { grid-template-columns: 1fr !important; }
    .lai-hero-h1 { font-size: 2rem !important; }
    .lai-math-grid { grid-template-columns: 1fr !important; }
    .lai-pricing-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ─── Constants ─────────────────────────────────────────────────────── */
const WA_URL =
  "https://wa.me/971509410068?text=Hi%20Alan%2C%20I%27d%20like%20to%20book%20a%20free%2015-minute%20Salary%20%26%20LinkedIn%20Evaluation%20for%20AI%2FML%20roles%20in%20the%20UAE.";

const CTA_TEXT = "Book Free 15-Min Salary Evaluation →";

const ACCENT = "#8b5cf6"; // violet for AI/ML theme
const ACCENT_BG = "rgba(139,92,246,0.12)";
const ACCENT_BORDER = "rgba(139,92,246,0.35)";
const GREEN = "#10b981";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const BLUE = "#60a5fa";

const SCREENSHOTS = [
  { src: "/manus-storage/screenshot-swipe-mode_664dce8e.png", title: "Swipe Mode — Approve or reject in one swipe", portrait: true },
  { src: "/manus-storage/screenshot-daily-report_905a0c57.png", title: "Daily Report — Full campaign visibility", portrait: true },
  { src: "/manus-storage/screenshot-skills-profile_d513eac6.png", title: "Skills Profile — Your ML stack, mapped", portrait: false },
  { src: "/manus-storage/screenshot-resume-gen_3afb0ef8.png", title: "Resume Generation — Tailored per JD", portrait: false },
];

const FAQS = [
  {
    q: "How does your semantic matching beat standard HR boolean filters?",
    a: "HR teams use keyword matching — if your resume says 'PyTorch' but the JD says 'deep learning framework,' you're filtered out. Our LLM scoring engine understands semantic equivalence. It reads your full stack (TensorFlow, Hugging Face, LangChain, etc.) and scores it against the JD's actual requirements — not just keyword overlap. We score across 5 dimensions: skills match, seniority fit, location, industry, and compensation alignment.",
  },
  {
    q: "I'm a Machine Learning Engineer. Will your system understand my niche?",
    a: "Yes. We built this specifically for technical professionals. Our scoring engine parses ML frameworks (PyTorch, JAX, TensorFlow), NLP tooling (Hugging Face, spaCy, LangChain), MLOps stacks (MLflow, Kubeflow, SageMaker), and data engineering tools (Spark, Airflow, dbt). It doesn't just match keywords — it understands that a 'Senior ML Engineer' with 'transformer architecture experience' is a strong match for an 'NLP Lead' role requiring 'LLM fine-tuning.'",
  },
  {
    q: "What's the UAE AI job market actually like right now?",
    a: "The UAE is aggressively hiring AI talent. Government entities (ADNOC, Mubadala, G42), tech companies (Careem, Noon, Tabby), and international firms with MENA hubs are all scaling their AI/ML teams. ML Lead salaries range from AED 40,000–90,000/month. The gap is that most candidates apply cold through ATS systems that don't understand their stack. We close that gap with volume + precision.",
  },
  {
    q: "What if I'm currently outside the UAE? Can this still work?",
    a: "Absolutely. Many of our clients are relocating to the UAE. We target roles that offer relocation packages and visa sponsorship. Your campaign filters include remote-friendly, hybrid, and on-site preferences. We also flag which companies are known to sponsor visas for AI talent.",
  },
  {
    q: "How is the 'Free 15-Minute Salary Evaluation' different from a sales call?",
    a: "It's not a pitch. We pull real salary data for your exact role and seniority in the UAE market. We audit your LinkedIn headline, summary, and experience section for AI-specific positioning. You walk away with a concrete salary benchmark and 3 actionable fixes for your profile — whether or not you sign up.",
  },
];

/* ─── FAQ Accordion ─────────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "20px 0",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 16, lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: ACCENT, fontSize: 22, flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <p style={{ color: "#94a3b8", marginTop: 12, lineHeight: 1.7, fontSize: 15 }}>{a}</p>
      )}
    </div>
  );
}

/* ─── CTA Button ────────────────────────────────────────────────────── */
function CTAButton({
  text = CTA_TEXT,
  bg = ACCENT,
  color = "#fff",
  size = "md",
  style: extraStyle = {},
}: {
  text?: string;
  bg?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}) {
  const sizes = {
    sm: { fontSize: 14, padding: "12px 24px" },
    md: { fontSize: 16, padding: "16px 36px" },
    lg: { fontSize: 18, padding: "20px 48px" },
  };
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        background: bg,
        color,
        fontWeight: 800,
        borderRadius: 10,
        ...sizes[size],
        ...extraStyle,
      }}
    >
      {text}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function LandingAI() {
  return (
    <div className="lai" style={{ minHeight: "100vh", background: "#050810", color: "#fff" }}>
      <style>{STYLE}</style>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* ═══ 1. NAV ═══════════════════════════════════════════════════ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(5,8,16,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em" }}>
          <span style={{ color: ACCENT }}>1000</span>
          <span style={{ color: AMBER }}>JOBS</span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 10,
              fontWeight: 700,
              color: ACCENT,
              background: ACCENT_BG,
              border: `1px solid ${ACCENT_BORDER}`,
              padding: "2px 8px",
              borderRadius: 4,
              verticalAlign: "middle",
              letterSpacing: "0.08em",
            }}
          >
            AI/ML
          </span>
        </span>
        <CTAButton text="Book Free Evaluation →" size="sm" />
      </nav>

      {/* ═══ 2. HERO ══════════════════════════════════════════════════ */}
      <section
        style={{
          paddingTop: 130,
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
          textAlign: "center",
          maxWidth: 860,
          margin: "0 auto",
        }}
      >
        {/* Niche badge */}
        <div
          className="lai-fade-1"
          style={{
            display: "inline-block",
            background: ACCENT_BG,
            border: `1px solid ${ACCENT_BORDER}`,
            color: ACCENT,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            padding: "6px 16px",
            borderRadius: 100,
            marginBottom: 28,
            textTransform: "uppercase",
          }}
        >
          For AI, ML, NLP &amp; Data Science Professionals in the UAE
        </div>

        <h1
          className="lai-fade-2 lai-hero-h1"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
            fontWeight: 900,
            color: "#fff",
            marginBottom: 24,
            lineHeight: 1.1,
          }}
        >
          Land an AI/ML Role Paying<br />
          <span style={{ color: ACCENT }}>AED 40,000–90,000/Month.</span>
          <br />
          <span style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", color: GREEN }}>
            Without Applying to a Single Job Yourself.
          </span>
        </h1>

        <p
          className="lai-fade-3"
          style={{
            fontSize: "clamp(1rem, 2vw, 1.15rem)",
            color: "#94a3b8",
            maxWidth: 620,
            margin: "0 auto 36px",
            lineHeight: 1.7,
          }}
        >
          ATS bots don't understand your PyTorch stack. HR filters miss your Hugging Face contributions.
          Our <strong style={{ color: "#fff" }}>LLM-powered scoring engine</strong> reads your full
          technical profile and matches it semantically against every JD — then submits{" "}
          <strong style={{ color: "#fff" }}>1,000 tailored applications</strong> in 100 days. You spend{" "}
          <strong style={{ color: "#fff" }}>5 minutes a day</strong>.
        </p>

        <CTAButton size="lg" style={{ marginBottom: 40 }} />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px 28px",
            color: "#64748b",
            fontSize: 13,
          }}
        >
          {[
            "AED 30,000 – 90,000+ roles",
            "UAE AI market",
            "1,000 applications per campaign",
            "Semantic LLM matching",
          ].map((t) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: ACCENT }}>✓</span> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ 3. PAIN AGITATION ════════════════════════════════════════ */}
      <section style={{ background: "#040710", padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p
            style={{
              color: ACCENT,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            The Problem
          </p>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 900,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            ATS Bots Don't Speak Machine Learning.
          </h2>
          <p style={{ color: "#64748b", fontSize: 16, marginBottom: 48, maxWidth: 620 }}>
            You've built production ML pipelines. You've fine-tuned LLMs. But the ATS at your dream
            company just rejected you because it couldn't parse "transformer architecture" as relevant
            to "deep learning." Here's how the two worlds compare:
          </p>

          <div className="lai-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Cold Applying */}
            <div
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 12,
                padding: "28px 32px",
              }}
            >
              <p
                style={{
                  color: RED,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              >
                Cold Applying
              </p>
              {[
                "ATS rejects you on keyword mismatch",
                "HR doesn't know PyTorch from TensorFlow",
                "Same generic resume for every ML role",
                "Your Hugging Face contributions? Invisible",
                "Apply to 200 jobs, hear back from 3",
                "6-month search, zero leverage on salary",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                  <span style={{ color: RED, fontSize: 16, flexShrink: 0, marginTop: 2 }}>✕</span>
                  <span style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* 1000Jobs Way */}
            <div
              style={{
                background: `rgba(139,92,246,0.06)`,
                border: `1px solid ${ACCENT_BORDER}`,
                borderRadius: 12,
                padding: "28px 32px",
              }}
            >
              <p
                style={{
                  color: ACCENT,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              >
                The 1000Jobs Way
              </p>
              {[
                "LLM semantic matching — understands your full stack",
                "Resume rewritten per JD (not just keywords swapped)",
                "1,000 targeted applications across 48+ job boards",
                "Scores every role across 5 technical dimensions",
                "First callbacks in 7–14 days",
                "100-day campaign with daily reporting",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                  <span style={{ color: ACCENT, fontSize: 16, flexShrink: 0, marginTop: 2 }}>✓</span>
                  <span style={{ color: "#e2e8f0", fontSize: 15, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. HOW IT WORKS (THE MECHANISM) ══════════════════════════ */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", textAlign: "center" }}>
          <p
            style={{
              color: ACCENT,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            The Mechanism
          </p>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 900,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Three Steps. One Outcome.
          </h2>
          <p style={{ color: "#64748b", fontSize: 16, marginBottom: 56 }}>
            From intake call to interview callbacks — here's exactly what happens.
          </p>

          <div
            className="lai-grid-3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, textAlign: "left" }}
          >
            {[
              {
                step: "01",
                icon: "📞",
                title: "The Call",
                desc: "Free 15-minute Salary & LinkedIn Evaluation. We benchmark your market value in the UAE AI sector, audit your profile's pull, map your target roles (ML Engineer, NLP Lead, Data Science Manager), and configure your LLM scoring profile. You walk away with a salary benchmark and 3 actionable fixes — whether or not you sign up.",
              },
              {
                step: "02",
                icon: "🤖",
                title: "AI Runs 1,000 Tailored Applications",
                desc: "Our LLM scoring engine scans WellFound, LinkedIn, and 48+ job boards hourly. Every match is scored across 5 dimensions: skills fit, seniority alignment, location, industry, and compensation. Each application gets a resume rewritten to match that specific JD — not a keyword swap, a full semantic rewrite.",
              },
              {
                step: "03",
                icon: "⚡",
                title: "5 Minutes a Day — Swipe Mode",
                desc: "Each morning, open the app. Your top-scored matches appear in a Tinder-style card stack. Swipe right to approve, left to reject. We handle submissions, follow-ups, and daily reporting. You spend 5 minutes. We spend 8 hours.",
              },
            ].map(({ step, icon, title, desc }) => (
              <div
                key={step}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "28px 24px",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <div
                  style={{
                    color: ACCENT,
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  STEP {step}
                </div>
                <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{title}</h3>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48 }}>
            <CTAButton />
          </div>
        </div>
      </section>

      {/* ═══ 5. THE MATH ══════════════════════════════════════════════ */}
      <section style={{ background: "#040710", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p
            style={{
              color: AMBER,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            The No-Brainer Investment
          </p>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 900,
              color: "#fff",
              marginBottom: 24,
            }}
          >
            You Break Even<br />
            <span style={{ color: AMBER }}>In Your First 17 Hours.</span>
          </h2>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 16,
              lineHeight: 1.7,
              marginBottom: 48,
              maxWidth: 600,
              margin: "0 auto 48px",
            }}
          >
            The average ML Lead in the UAE earns{" "}
            <strong style={{ color: "#fff" }}>AED 40,000+/month</strong> — that's roughly{" "}
            <strong style={{ color: "#fff" }}>AED 1,500 per working day</strong>. Our full 1,000-application
            campaign starts at <strong style={{ color: AMBER }}>AED 1,730</strong>. You make that back
            before your first week is over. The ROI isn't 2x. It's{" "}
            <strong style={{ color: AMBER }}>23x</strong> — every single month you're employed.
          </p>

          <div
            className="lai-math-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 48 }}
          >
            {[
              { label: "Campaign cost", value: "AED 1,730", sub: "Starting price", color: AMBER },
              { label: "Avg ML Lead salary", value: "AED 40k+", sub: "Per month in UAE", color: ACCENT },
              { label: "Break-even point", value: "17 hours", sub: "Of your new job", color: BLUE },
              { label: "Monthly ROI", value: "23×", sub: "Return on investment", color: GREEN },
            ].map(({ label, value, sub, color }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "24px 16px",
                }}
              >
                <div
                  style={{
                    color,
                    fontSize: "clamp(1.4rem, 3vw, 2rem)",
                    fontWeight: 900,
                    marginBottom: 4,
                  }}
                >
                  {value}
                </div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{label}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>{sub}</div>
              </div>
            ))}
          </div>

          <CTAButton
            text="See Your Salary Benchmark — Free Call →"
            bg={AMBER}
            color="#000"
          />
        </div>
      </section>

      {/* ═══ 6. SCREENSHOTS ═══════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p
              style={{
                color: ACCENT,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              The Platform
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 900, color: "#fff" }}>
              Built for Technical Professionals
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, marginTop: 12 }}>
              Not another generic job board. A campaign engine that understands your ML stack.
            </p>
          </div>

          <div
            className="lai-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}
          >
            {SCREENSHOTS.filter((s) => s.portrait).map((s) => (
              <div
                key={s.title}
                className="lai-screenshot"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <img src={s.src} alt={s.title} />
                <div style={{ padding: "14px 20px" }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{s.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="lai-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
          >
            {SCREENSHOTS.filter((s) => !s.portrait).map((s) => (
              <div
                key={s.title}
                className="lai-screenshot"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <img
                  src={s.src}
                  alt={s.title}
                  style={{ maxHeight: 280, objectFit: "cover", width: "100%" }}
                />
                <div style={{ padding: "14px 20px" }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{s.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 7. GUARANTEE ═════════════════════════════════════════════ */}
      <section style={{ background: "#040710", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🛡️</div>
            <h2
              style={{
                fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                fontWeight: 900,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Two Guarantees. Zero Risk.
            </h2>
          </div>

          <div className="lai-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Volume Guarantee */}
            <div
              style={{
                background: "rgba(16,185,129,0.06)",
                border: `1px solid rgba(16,185,129,0.3)`,
                borderRadius: 12,
                padding: "28px 28px",
              }}
            >
              <p
                style={{
                  color: GREEN,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Volume Guarantee
              </p>
              <h3 style={{ color: "#fff", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
                1,000 Applications — Or Your Money Back.
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
                If we don't deliver your full 1,000 submitted applications within the campaign window,
                you get a full refund. No questions asked. Applies to the AED 1,730 and AED 2,840
                packages.
              </p>
              {[
                "Complete your 15-minute intake evaluation",
                "Review and approve your shortlist within 48 hours",
                "Refund request within the campaign window",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: GREEN, fontSize: 14, flexShrink: 0, marginTop: 2 }}>✓</span>
                  <span style={{ color: "#e2e8f0", fontSize: 14 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Interview Guarantee */}
            <div
              style={{
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 12,
                padding: "28px 28px",
              }}
            >
              <p
                style={{
                  color: AMBER,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Interview Guarantee
              </p>
              <h3 style={{ color: "#fff", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
                5 Interviews — Or Your Money Back.
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
                The White Glove tier (AED 4,970) guarantees 5 interview callbacks. If we don't deliver,
                you get a full refund. Alan personally manages your campaign, runs recruiter outreach,
                and coaches you through every step.
              </p>
              {[
                "Fully managed by founder (Alan)",
                "Recruiter network blast (50–100 recruiters)",
                "Interview prep + salary negotiation coaching",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: AMBER, fontSize: 14, flexShrink: 0, marginTop: 2 }}>✓</span>
                  <span style={{ color: "#e2e8f0", fontSize: 14 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <CTAButton text="Claim Your Guarantee — Book Free Evaluation →" />
          </div>
        </div>
      </section>

      {/* ═══ 8. PRICING ═══════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p
              style={{
                color: ACCENT,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Pricing
            </p>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                fontWeight: 900,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Choose Your Campaign
            </h2>
            <p style={{ color: "#64748b", fontSize: 16 }}>
              Every package starts with a free 15-minute Salary &amp; LinkedIn Evaluation.
            </p>
          </div>

          <div
            className="lai-pricing-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}
          >
            {/* ── Mass Application ── */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: "36px 28px",
              }}
            >
              <p
                style={{
                  color: BLUE,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Mass Application
              </p>
              <h3 style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 6 }}>
                High-Volume Outreach
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                One AI-optimised resume, applied to 1,000 matching AI/ML roles. Maximum market
                coverage at speed.
              </p>

              <div style={{ marginBottom: 28 }}>
                <span style={{ color: AMBER, fontWeight: 900, fontSize: 32 }}>AED 1,730</span>
                <span style={{ color: "#64748b", fontSize: 14, marginLeft: 8 }}>/ 1,000 apps</span>
              </div>

              {[
                "1 AI-optimised resume",
                "1,000 targeted applications",
                "LLM semantic job scoring",
                "Hourly job scanning (48+ boards)",
                "Daily progress report",
                "Volume guarantee (full refund)",
              ].map((f) => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: GREEN }}>✓</span>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>{f}</span>
                </div>
              ))}

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 28,
                  background: "rgba(96,165,250,0.12)",
                  border: "1px solid rgba(96,165,250,0.4)",
                  color: BLUE,
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "14px 24px",
                  borderRadius: 10,
                }}
              >
                Book Free Evaluation →
              </a>
            </div>

            {/* ── Customized Resumes (RECOMMENDED) ── */}
            <div
              style={{
                background: `rgba(139,92,246,0.05)`,
                border: `2px solid ${ACCENT_BORDER}`,
                borderRadius: 16,
                padding: "36px 28px",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: ACCENT,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 12,
                  padding: "4px 16px",
                  borderRadius: 100,
                  whiteSpace: "nowrap",
                }}
              >
                ★ RECOMMENDED FOR AI LEADS
              </div>
              <p
                style={{
                  color: ACCENT,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Customized Resumes
              </p>
              <h3 style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 6 }}>
                Tailored Per Application
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Every application gets a resume rewritten to match that specific JD. Your PyTorch
                experience framed exactly how that hiring manager needs to see it.
              </p>

              <div style={{ marginBottom: 28 }}>
                <span style={{ color: AMBER, fontWeight: 900, fontSize: 32 }}>AED 2,840</span>
                <span style={{ color: "#64748b", fontSize: 14, marginLeft: 8 }}>/ 1,000 apps</span>
              </div>

              {[
                "Unique resume per JD",
                "1,000 tailored applications",
                "LLM semantic job scoring",
                "Hourly job scanning (48+ boards)",
                "Daily progress report",
                "Volume guarantee (full refund)",
                "Priority campaign manager",
              ].map((f) => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: ACCENT }}>✓</span>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>{f}</span>
                </div>
              ))}

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 28,
                  background: ACCENT,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 15,
                  padding: "14px 24px",
                  borderRadius: 10,
                }}
              >
                Book Free Evaluation →
              </a>
            </div>

            {/* ── White Glove ── */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(251,191,36,0.04) 100%)",
                border: "2px solid rgba(245,158,11,0.5)",
                borderRadius: 16,
                padding: "36px 28px",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                  color: "#000",
                  fontWeight: 800,
                  fontSize: 12,
                  padding: "4px 16px",
                  borderRadius: 100,
                  whiteSpace: "nowrap",
                }}
              >
                👑 WHITE GLOVE
              </div>
              <p
                style={{
                  color: AMBER,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                White Glove
              </p>
              <h3 style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 6 }}>
                Done For You — Fully Managed
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Alan personally runs your entire AI job search. You show up to interviews. We handle
                everything else.
              </p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ color: AMBER, fontWeight: 900, fontSize: 32 }}>AED 4,970</span>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                  Full campaign · One-time investment
                </p>
                <div
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginTop: 12,
                  }}
                >
                  <p style={{ color: GREEN, fontWeight: 700, fontSize: 13, margin: 0 }}>
                    🛡️ 5 interviews guaranteed — or full refund
                  </p>
                </div>
              </div>

              <p
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                Everything in Customized Resumes, plus:
              </p>

              {[
                "Alan personally manages your campaign",
                "LinkedIn profile full rewrite (AI-optimised)",
                "Top 20 target companies — warm referral outreach",
                "Direct recruiter network blast (50–100 recruiters)",
                "Custom portfolio website + domain + email",
                "Salary negotiation coaching session",
                "Weekly 1:1 check-in calls with Alan",
                "Offer letter legal review",
                "Interview preparation (mock interviews + coaching)",
                "5 interviews guaranteed — or full refund",
              ].map((f) => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: AMBER }}>✓</span>
                  <span style={{ color: "#e2e8f0", fontSize: 13 }}>{f}</span>
                </div>
              ))}

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 28,
                  background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                  color: "#000",
                  fontWeight: 800,
                  fontSize: 15,
                  padding: "14px 24px",
                  borderRadius: 10,
                }}
              >
                Apply for White Glove — Talk to Alan →
              </a>
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#475569", fontSize: 13, marginTop: 24 }}>
            Not sure which tier fits your situation? Book the free 15-minute evaluation — we'll
            recommend the right package based on your stack, seniority, and target roles.
          </p>
        </div>
      </section>

      {/* ═══ 9. FAQ ═══════════════════════════════════════════════════ */}
      <section id="faq" style={{ background: "#040710", padding: "80px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 900, color: "#fff" }}>
              Questions from AI/ML Professionals
            </h2>
          </div>
          {FAQS.map((f) => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* ═══ 10. FINAL CTA ════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 900,
              color: "#fff",
              marginBottom: 20,
              lineHeight: 1.1,
            }}
          >
            Stop Sending Cold Applications<br />
            Into the ATS Black Hole.
          </h2>
          <p
            style={{
              color: ACCENT,
              fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Start Getting Interviews.
          </p>
          <p
            style={{
              color: "#64748b",
              fontSize: 17,
              lineHeight: 1.7,
              marginBottom: 40,
              maxWidth: 540,
              margin: "0 auto 40px",
            }}
          >
            Book your free 15-minute Salary &amp; LinkedIn Evaluation. We'll benchmark your market
            value in the UAE AI sector and audit your profile — no strings attached.
          </p>
          <CTAButton
            text="Book Free 15-Min Salary & LinkedIn Evaluation →"
            size="lg"
            style={{ marginBottom: 20 }}
          />
          <p style={{ color: "#475569", fontSize: 13 }}>
            Free 15-minute call · Salary benchmark included · No credit card required
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════ */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "32px 24px",
          textAlign: "center",
          color: "#334155",
          fontSize: 13,
        }}
      >
        © 2025 1000Jobs. Built for AI, ML &amp; Data Science professionals in the UAE.
      </footer>
    </div>
  );
}
