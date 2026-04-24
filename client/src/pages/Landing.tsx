import { useState } from "react";

const LANDING_STYLE = `
  .lp,
  .lp *,
  .lp *::before,
  .lp *::after {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
    border-radius: revert !important;
  }
  .lp h1, .lp h2, .lp h3, .lp h4, .lp h5, .lp h6 {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    text-transform: none !important;
    letter-spacing: -0.02em !important;
    line-height: 1.15 !important;
  }
  .lp {
    background-image: none !important;
    background-color: #080B14 !important;
    font-size: 16px !important;
  }
  body:has(.lp) {
    background-image: none !important;
    background-color: #080B14 !important;
  }
  .lp button { border-radius: 8px !important; }
  .lp a { text-decoration: none !important; }
  .screenshot-card img { display: block; width: 100%; height: auto; }
  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lp-fade-up  { animation: lp-fade-up 0.7s ease both; }
  .lp-fade-up-2{ animation: lp-fade-up 0.7s 0.15s ease both; }
  .lp-fade-up-3{ animation: lp-fade-up 0.7s 0.3s ease both; }
`;

const WA_URL =
  "https://wa.me/971509410068?text=Hi%2C%20I%27m%20interested%20in%201000Jobs.%20Can%20we%20book%20a%20free%20intake%20call%3F";

const SCREENSHOTS = [
  { src: "/manus-storage/screenshot-swipe-mode_664dce8e.png",     title: "Swipe Mode",        portrait: true  },
  { src: "/manus-storage/screenshot-daily-report_905a0c57.png",   title: "Daily Report",      portrait: true  },
  { src: "/manus-storage/screenshot-skills-profile_d513eac6.png", title: "Skills Profile",    portrait: false },
  { src: "/manus-storage/screenshot-resume-gen_3afb0ef8.png",     title: "Resume Generation", portrait: false },
];

const FAQS = [
  {
    q: "What happens in the 30-minute intake call?",
    a: "We map your target roles, salary expectations, and dealbreakers. We configure your profile, set your scoring weights, and launch your first campaign — all in one session. After that, you only need 5 minutes a day.",
  },
  {
    q: "How is this different from just applying on LinkedIn?",
    a: "LinkedIn applications are cold. 1000Jobs runs targeted, tailored applications — each with a resume customised to the specific JD. Our AI scores every job across 5 dimensions before you see it, so you only review the best matches.",
  },
  {
    q: "What does the money-back guarantee cover?",
    a: "If we don't deliver your full 1,000 applications within the campaign window, you get a full refund. No questions asked. The guarantee applies to the AED 1,730 and AED 2,840 packages.",
  },
  {
    q: "How quickly can I start getting callbacks?",
    a: "Most clients see their first callbacks within 7–14 days of launch. Volume and speed of response depend on your target market, seniority, and how competitive the roles are.",
  },
  {
    q: "Is my data safe?",
    a: "Your resume and profile are used only to generate applications on your behalf. We never share your data with third parties.",
  },
];

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
        <span style={{ color: "#10b981", fontSize: 22, flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <p style={{ color: "#94a3b8", marginTop: 12, lineHeight: 1.7, fontSize: 15 }}>{a}</p>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="lp" style={{ minHeight: "100vh", background: "#080B14", color: "#fff" }}>
      <style>{LANDING_STYLE}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* 1. NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(8,11,20,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em" }}>
          <span style={{ color: "#10b981" }}>1000</span>
          <span style={{ color: "#f59e0b" }}>JOBS</span>
        </span>
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#10b981", color: "#000", fontWeight: 700,
            fontSize: 14, padding: "10px 20px", borderRadius: 8,
          }}
        >
          Book Free Intake Call →
        </a>
      </nav>

      {/* 2. HERO */}
      <section style={{
        paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24,
        textAlign: "center", maxWidth: 820, margin: "0 auto",
      }}>
        <div className="lp-fade-up" style={{
          display: "inline-block",
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
          color: "#10b981", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
          padding: "6px 16px", borderRadius: 100, marginBottom: 28,
          textTransform: "uppercase",
        }}>
          For Tech Professionals in UAE &amp; KSA
        </div>

        <h1 className="lp-fade-up-2" style={{
          fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 900,
          color: "#fff", marginBottom: 24, lineHeight: 1.1,
        }}>
          Land a High-Paying Tech Job<br />
          <span style={{ color: "#10b981" }}>in 100 Days.</span>{" "}
          <span style={{ color: "#f59e0b" }}>Or Your Money Back.</span>
        </h1>

        <p className="lp-fade-up-3" style={{
          fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "#94a3b8",
          maxWidth: 580, margin: "0 auto 36px", lineHeight: 1.7,
        }}>
          One 30-minute intake call. Then{" "}
          <strong style={{ color: "#fff" }}>5 minutes a day.</strong>{" "}
          Our AI runs 1,000 tailored applications on your behalf — so you can focus on showing up to interviews.
        </p>

        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            background: "#10b981", color: "#000", fontWeight: 800,
            fontSize: 18, padding: "18px 40px", borderRadius: 10,
            marginBottom: 40,
          }}
        >
          Book Your Free Intake Call →
        </a>

        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 28px",
          color: "#64748b", fontSize: 13,
        }}>
          {["AED 30,000 – AED 300,000 roles", "UAE & KSA market", "1,000 applications per campaign", "Tailored resume per JD"].map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#10b981" }}>✓</span> {t}
            </span>
          ))}
        </div>
      </section>

      {/* 3. PAIN AGITATION */}
      <section style={{ background: "#060910", padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ color: "#10b981", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            The Shift
          </p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#fff", marginBottom: 16 }}>
            Cold Applying Is a Lottery.
          </h2>
          <p style={{ color: "#64748b", fontSize: 16, marginBottom: 48, maxWidth: 560 }}>
            A referred candidate is 14× more likely to get hired than a cold applicant. 1000Jobs puts you on the right side of that stat.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 12, padding: "28px 32px",
            }}>
              <p style={{ color: "#ef4444", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
                Most Candidates
              </p>
              {[
                "Apply to 200+ jobs on LinkedIn",
                "Same generic resume for every role",
                "Wait weeks for recruiters to respond",
                "Cold DM with 'open to opportunities'",
                "6-month average job search",
                "Burn out before landing anything",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                  <span style={{ color: "#ef4444", fontSize: 16, flexShrink: 0, marginTop: 2 }}>✕</span>
                  <span style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{
              background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 12, padding: "28px 32px",
            }}>
              <p style={{ color: "#10b981", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
                1000Jobs
              </p>
              {[
                "AI scores every job across 5 dimensions",
                "Resume tailored per JD in 90 seconds",
                "1,000 targeted applications per campaign",
                "New roles detected and applied to hourly",
                "100-day campaign with full accountability",
                "5 minutes a day — we handle the rest",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                  <span style={{ color: "#10b981", fontSize: 16, flexShrink: 0, marginTop: 2 }}>✓</span>
                  <span style={{ color: "#e2e8f0", fontSize: 15, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#10b981", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            The Mechanism
          </p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: "#fff", marginBottom: 16 }}>
            How It Works
          </h2>
          <p style={{ color: "#64748b", fontSize: 16, marginBottom: 56 }}>
            Three steps. One outcome.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, textAlign: "left" }}>
            {[
              {
                step: "01", icon: "📞", title: "30-Minute Intake Call",
                desc: "We map your target roles, salary range, and dealbreakers. We configure your AI scoring profile and launch your first campaign — all in one session.",
              },
              {
                step: "02", icon: "🤖", title: "AI Runs 1,000 Applications",
                desc: "Our system scans WellFound, LinkedIn, and 48+ job boards hourly. Every match gets a tailored resume. Every application is tracked.",
              },
              {
                step: "03", icon: "⚡", title: "5 Minutes a Day",
                desc: "Each morning, review your top matches in Swipe Mode. Approve or reject. We handle submissions, follow-ups, and daily reporting.",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "28px 24px",
              }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <div style={{ color: "#10b981", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", marginBottom: 8 }}>
                  STEP {step}
                </div>
                <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{title}</h3>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. THE MATH */}
      <section style={{ background: "#060910", padding: "80px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            The No-Brainer Investment
          </p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: "#fff", marginBottom: 24 }}>
            You Make It Back<br />
            <span style={{ color: "#f59e0b" }}>In Your First Week.</span>
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.7, marginBottom: 48 }}>
            The average tech professional in UAE earns{" "}
            <strong style={{ color: "#fff" }}>AED 30,000/month</strong> — that's AED 1,000 per day.
Our full 1,000-application campaign costs less than{" "}
                  <strong style={{ color: "#f59e0b" }}>AED 1,730</strong>.
            You make that back in your first 17 hours on the job.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 48 }}>
            {[
              { label: "Cost of campaign", value: "AED 1,730", sub: "Full 1,000 applications", color: "#f59e0b" },
              { label: "Average monthly salary", value: "AED 30k+", sub: "Tech roles in UAE/KSA", color: "#10b981" },
              { label: "Break-even point", value: "17 hours", sub: "Of your first week at work", color: "#60a5fa" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "24px 16px",
              }}>
                <div style={{ color, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, marginBottom: 4 }}>{value}</div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{label}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>{sub}</div>
              </div>
            ))}
          </div>

          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#f59e0b", color: "#000", fontWeight: 800,
              fontSize: 16, padding: "16px 36px", borderRadius: 10,
            }}
          >
            Start Your Campaign — Book Free Call →
          </a>
        </div>
      </section>

      {/* 6. PRODUCT SCREENSHOTS */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ color: "#10b981", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              The Platform
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 900, color: "#fff" }}>
              See It in Action
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {SCREENSHOTS.filter(s => s.portrait).map(s => (
              <div key={s.title} className="screenshot-card" style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, overflow: "hidden",
              }}>
                <img src={s.src} alt={s.title} />
                <div style={{ padding: "14px 20px" }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{s.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {SCREENSHOTS.filter(s => !s.portrait).map(s => (
              <div key={s.title} className="screenshot-card" style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, overflow: "hidden",
              }}>
                <img src={s.src} alt={s.title} style={{ maxHeight: 280, objectFit: "cover", width: "100%" }} />
                <div style={{ padding: "14px 20px" }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{s.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. GUARANTEE */}
      <section style={{ background: "#060910", padding: "80px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🛡️</div>
          <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 900, color: "#fff", marginBottom: 16 }}>
            If We Don't Deliver 1,000 Applications,<br />
            <span style={{ color: "#10b981" }}>You Get a Full Refund.</span>
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            We stand behind our work. If your campaign doesn't reach 1,000 submitted applications within the agreed window, we refund you in full — no questions asked.
          </p>

          <div style={{ textAlign: "left", marginBottom: 32 }}>
            {[
              "Complete your 30-minute profile intake call",
              "Review and approve your shortlist within 48 hours",
              "Request your refund within the campaign window",
              "Applies to the AED 1,730 and AED 2,840 packages",
            ].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <span style={{ color: "#10b981", fontSize: 16, flexShrink: 0, marginTop: 2 }}>✓</span>
                <span style={{ color: "#e2e8f0", fontSize: 15 }}>{item}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 16 }}>
              <span style={{ color: "#f59e0b", fontSize: 16, flexShrink: 0, marginTop: 2 }}>⚠</span>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>
                Guarantee covers application volume, not interview outcomes. Results depend on your profile strength, target market, and role availability.
              </span>
            </div>
          </div>

          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#10b981", color: "#000", fontWeight: 800,
              fontSize: 15, padding: "14px 32px", borderRadius: 10,
            }}
          >
            Claim Your Guarantee — Message Us →
          </a>
        </div>
      </section>

      {/* 8. PRICING */}
      <section id="pricing" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ color: "#10b981", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Pricing
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 900, color: "#fff", marginBottom: 12 }}>
              Choose Your Campaign
            </h2>
            <p style={{ color: "#64748b", fontSize: 16 }}>
              All packages include a free 30-minute intake call and a dedicated campaign manager.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {/* Mass Application */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: "36px 32px",
            }}>
              <p style={{ color: "#60a5fa", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                Mass Application
              </p>
              <h3 style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 6 }}>
                High-Volume Outreach
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                One optimised resume, applied to 1,000 matching roles. Best for professionals who want maximum market coverage fast.
              </p>

              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 900, fontSize: 32 }}>AED 1,730</span>
                  <span style={{ color: "#64748b", fontSize: 14 }}>/ 1,000 applications</span>
                </div>
              </div>

              {["1 AI-optimised resume", "1,000 targeted applications", "Hourly job scanning", "Daily progress report", "Full refund guarantee"].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: "#10b981" }}>✓</span>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>{f}</span>
                </div>
              ))}

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", textAlign: "center", marginTop: 28,
                  background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.4)",
                  color: "#60a5fa", fontWeight: 700, fontSize: 15, padding: "14px 24px", borderRadius: 10,
                }}
              >
                Get Started — WhatsApp Us →
              </a>
            </div>

            {/* Customized Resumes */}
            <div style={{
              background: "rgba(16,185,129,0.05)", border: "2px solid rgba(16,185,129,0.4)",
              borderRadius: 16, padding: "36px 32px", position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                background: "#10b981", color: "#000", fontWeight: 800, fontSize: 12,
                padding: "4px 16px", borderRadius: 100, whiteSpace: "nowrap",
              }}>
                ★ RECOMMENDED
              </div>
              <p style={{ color: "#10b981", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                Customized Resumes
              </p>
              <h3 style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 6 }}>
                Tailored Per Application
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Every application gets a resume rewritten to match that specific JD. Higher callback rate. Best for competitive senior roles.
              </p>

              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 900, fontSize: 32 }}>AED 2,840</span>
                  <span style={{ color: "#64748b", fontSize: 14 }}>/ 1,000 applications</span>
                </div>
              </div>

              {["Unique resume per JD", "1,000 tailored applications", "Hourly job scanning", "Daily progress report", "Full refund guarantee", "Priority campaign manager"].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: "#10b981" }}>✓</span>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>{f}</span>
                </div>
              ))}

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", textAlign: "center", marginTop: 28,
                  background: "#10b981", color: "#000", fontWeight: 800,
                  fontSize: 15, padding: "14px 24px", borderRadius: 10,
                }}
              >
                Get Started — WhatsApp Us →
              </a>
            </div>

            {/* White Glove */}
            <div style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(251,191,36,0.04) 100%)",
              border: "2px solid rgba(245,158,11,0.5)",
              borderRadius: 16, padding: "36px 32px", position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                background: "linear-gradient(90deg, #f59e0b, #fbbf24)", color: "#000", fontWeight: 800, fontSize: 12,
                padding: "4px 16px", borderRadius: 100, whiteSpace: "nowrap",
              }}>
                👑 WHITE GLOVE
              </div>
              <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                White Glove
              </p>
              <h3 style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 6 }}>
                Done For You — Fully Managed
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Alan personally runs your entire job search. You show up to interviews. We handle everything else.
              </p>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ color: "#f59e0b", fontWeight: 900, fontSize: 32 }}>AED 4,970</span>
                </div>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Full campaign · One-time investment</p>
                <div style={{
                  background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 8, padding: "10px 14px", marginTop: 12,
                }}>
                  <p style={{ color: "#10b981", fontWeight: 700, fontSize: 13, margin: 0 }}>
                    🛡️ Guarantee: 5 interviews or full refund
                  </p>
                </div>
              </div>

              <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Everything in Customized Resumes, plus:</p>

              {[
                "Alan personally manages your campaign",
                "LinkedIn profile full rewrite",
                "Top 20 target companies — warm referral outreach",
                "Direct recruiter network blast (50–100 recruiters)",
                "Custom portfolio website + domain + email",
                "Salary negotiation coaching session",
                "Weekly 1:1 check-in calls with Alan",
                "Offer letter legal review before you sign",
                "Interview preparation (mock interviews + coaching)",
                "5 interviews guaranteed — or full refund",
              ].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: "#f59e0b" }}>✓</span>
                  <span style={{ color: "#e2e8f0", fontSize: 13 }}>{f}</span>
                </div>
              ))}

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", textAlign: "center", marginTop: 28,
                  background: "linear-gradient(90deg, #f59e0b, #fbbf24)", color: "#000", fontWeight: 800,
                  fontSize: 15, padding: "14px 24px", borderRadius: 10,
                }}
              >
                Apply for White Glove — WhatsApp Alan →
              </a>
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#475569", fontSize: 13, marginTop: 24 }}>
            Not sure which plan is right for you? Message us on WhatsApp — we'll recommend the right package for your situation.
          </p>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" style={{ background: "#060910", padding: "80px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 900, color: "#fff" }}>
              Common Questions
            </h2>
          </div>
          {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: "#fff", marginBottom: 20, lineHeight: 1.1 }}>
            Stop Applying.<br />
            <span style={{ color: "#10b981" }}>Start Getting Hired.</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: 17, lineHeight: 1.7, marginBottom: 40 }}>
            One call. 1,000 applications. 100 days. If it doesn't work, you don't pay.
          </p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#10b981", color: "#000", fontWeight: 800,
              fontSize: 18, padding: "20px 48px", borderRadius: 12,
              marginBottom: 20,
            }}
          >
            Book Your Free Intake Call →
          </a>
          <p style={{ color: "#475569", fontSize: 13 }}>
            Free 30-minute call · No credit card required · Full refund guarantee
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 24px", textAlign: "center",
        color: "#334155", fontSize: 13,
      }}>
        © 2025 1000Jobs. Built for tech professionals in UAE &amp; KSA.
      </footer>
    </div>
  );
}
