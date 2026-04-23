import { useState, useEffect } from "react";

/* ─── Scoped style reset ─────────────────────────────────────────────────────
   The app-wide Atari theme forces pixel fonts, zero border-radius, scanlines,
   and monospace everywhere. We inject a scoped override so the landing page
   renders with a clean, modern marketing aesthetic.
   ──────────────────────────────────────────────────────────────────────────── */
const LANDING_STYLE = `
  /* ── Full theme reset for landing page ── */
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
  /* Kill CRT scanlines on body when landing is active */
  body:has(.lp) {
    background-image: none !important;
    background-color: #080B14 !important;
  }
  .lp input, .lp textarea {
    background: #fff !important;
    color: #111 !important;
    font-family: 'Inter', sans-serif !important;
    border-radius: 8px !important;
  }
  .lp button {
    border-radius: 8px !important;
  }
  .lp table {
    border-radius: 0 !important;
  }
  .lp a {
    text-decoration: none !important;
  }
  .screenshot-card img {
    display: block;
    width: 100%;
    height: auto;
  }
`;

const WHATSAPP_URL = "https://wa.me/971509410068?text=Hi%2C%20I%27m%20interested%20in%201000Jobs%20-%20please%20tell%20me%20more.";

/* ─── Animated counter ───────────────────────────────────────────────────── */
function AnimatedNumber({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const dur = 2000;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <span>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ─── FAQ accordion ──────────────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-gray-800 overflow-hidden cursor-pointer"
      style={{ borderRadius: 12 }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-5 bg-[#111827] hover:bg-[#161f33] transition-colors">
        <span className="text-white font-semibold text-base">{q}</span>
        <span className="text-emerald-400 text-2xl ml-4 flex-shrink-0 transition-transform" style={{ transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </div>
      {open && (
        <div className="px-6 py-5 bg-[#0c1220] text-gray-400 text-[15px] leading-relaxed border-t border-gray-800">
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "What's the difference between Mass Application and Customized Resumes?",
    a: "Mass Application uses a single polished resume and applies it across hundreds of relevant jobs — ideal for volume. Customized Resumes generates a unique, ATS-optimized resume tailored to each individual job description — ideal for competitive roles where you need to stand out.",
  },
  {
    q: "How does the AI matching work?",
    a: "Every job is scored across 5 dimensions: skills match, seniority alignment, location fit, industry relevance, and compensation range. Only jobs above your threshold are surfaced for you to swipe on. You review 100 jobs in 5 minutes instead of 5 hours.",
  },
  {
    q: "Where do the jobs come from?",
    a: "We pull from 48+ ATS platforms (Greenhouse, Lever, Workday, Ashby, etc.) plus LinkedIn. These are direct company postings — not recycled job board listings. Less competition, higher response rates.",
  },
  {
    q: "How is this different from LinkedIn Easy Apply?",
    a: "Easy Apply sends a generic resume to jobs you manually find. 1000Jobs AI-scores every job against your profile, generates a tailored resume per application, and applies across 48 platforms — not just LinkedIn. You review 100 jobs in 5 minutes instead of 5 hours.",
  },
  {
    q: "What if I don't get any interviews?",
    a: "Message us on WhatsApp and we'll work with you to review your profile, adjust your targeting, and make it right. We're a small team and we stand behind our results.",
  },
  {
    q: "Can I cancel anytime?",
    a: "There are no subscriptions. You pay once, get your applications, and that's it. No recurring charges, no hidden fees.",
  },
  {
    q: "How long does it take to see results?",
    a: "Our founder landed 4 interviews within the first 3 weeks using this exact system. Most users see their first interview requests within 10–14 days of starting.",
  },
];

const PAIN_POINTS = [
  { action: "Browse LinkedIn for 2 hours", cost: "2 hours wasted, 0 applications sent" },
  { action: "Tailor a resume for one job", cost: "45 minutes per application" },
  { action: "Fill out an ATS form manually", cost: "20 minutes of copy-paste hell" },
  { action: "Wait 3 weeks to hear back", cost: "Anxiety, self-doubt, silence" },
  { action: "Repeat 200+ times to land an offer", cost: "Your entire quarter — gone" },
];

const SCREENSHOTS = [
  {
    src: "/manus-storage/screenshot-swipe-mode_664dce8e.png",
    title: "Swipe Mode",
    desc: "Review AI-scored jobs in seconds. Swipe right to apply, left to reject. Each card shows a 5-dimension match score.",
    portrait: true,
  },
  {
    src: "/manus-storage/screenshot-daily-report_905a0c57.png",
    title: "Daily Report",
    desc: "Track your pipeline at a glance. See matched jobs, applications sent, and your 1,000-job campaign progress.",
    portrait: true,
  },
  {
    src: "/manus-storage/screenshot-skills-profile_d513eac6.png",
    title: "Skills Profile",
    desc: "Configure your profile once. The AI uses every field to score jobs across 5 dimensions and auto-reject dealbreakers.",
    portrait: false,
  },
  {
    src: "/manus-storage/screenshot-resume-gen_3afb0ef8.png",
    title: "Resume Generation",
    desc: "Every application gets a tailored resume. Track status, cost ($0.04–$0.07 each), and download PDFs instantly.",
    portrait: false,
  },
];

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <>
      <style>{LANDING_STYLE}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div className="lp min-h-screen text-white" style={{ background: "#080B14", fontFamily: "'Inter', sans-serif" }}>

        {/* ═══ STICKY NAV ═══ */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5" style={{ background: "rgba(8,11,20,0.85)" }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-extrabold text-xl tracking-tight">1000</span>
              <span className="text-amber-400 font-extrabold text-xl tracking-tight">JOBS</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#pricing" className="text-gray-500 hover:text-white text-sm transition-colors hidden sm:block">Pricing</a>
              <a href="#proof" className="text-gray-500 hover:text-white text-sm transition-colors hidden sm:block">Results</a>
              <a href="#faq" className="text-gray-500 hover:text-white text-sm transition-colors hidden sm:block">FAQ</a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold px-5 py-2.5 transition-all hover:scale-105 flex items-center gap-2"
                style={{ background: "#25D366", color: "#000", borderRadius: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Get Started
              </a>
            </div>
          </div>
        </nav>

        {/* ═══ HERO ═══ */}
        <section className="pt-28 pb-20 px-6 text-center relative overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-20" style={{ background: "radial-gradient(ellipse, #10B981 0%, transparent 70%)" }} />
            <div className="absolute top-40 left-1/4 w-[400px] h-[400px] opacity-10" style={{ background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)" }} />
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide px-4 py-2 mb-8" style={{ borderRadius: 100 }}>
              <span className="w-2 h-2 bg-emerald-400 animate-pulse" style={{ borderRadius: "50%" }} />
              BUILT BY A COO WHO LANDED 4 INTERVIEWS IN 3 WEEKS
            </div>

            <h1 className="text-[2.75rem] sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
              Stop Applying to Jobs.<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #10B981, #34D399, #6EE7B7)" }}>
                Start Landing Interviews.
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-400 mb-3 max-w-2xl mx-auto leading-relaxed font-normal">
              1,000 targeted applications in 100 days.
            </p>
            <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
              AI scores every job against your profile. Generates a tailored resume. Applies for you. You just swipe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold px-10 py-4 text-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
                style={{ background: "#25D366", color: "#000", borderRadius: 12, boxShadow: "0 0 40px rgba(37,211,102,0.3)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Message Us on WhatsApp
              </a>
              <a
                href="#how-it-works"
                className="font-bold px-10 py-4 text-lg border border-gray-700 text-gray-300 hover:border-emerald-500/50 hover:text-white transition-all"
                style={{ borderRadius: 12 }}
              >
                See How It Works
              </a>
            </div>

            {/* Metric strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { value: 3206, label: "Jobs Scored by AI", suffix: "+" },
                { value: 48, label: "ATS Platforms", suffix: "" },
                { value: 351, label: "Applications Sent", suffix: "" },
                { value: 4, label: "Interviews Landed", suffix: "" },
              ].map((m) => (
                <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] px-4 py-4" style={{ borderRadius: 12 }}>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    <AnimatedNumber target={m.value} suffix={m.suffix} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PROBLEM SECTION ═══ */}
        <section className="py-20 px-6" style={{ background: "#060910" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-amber-400 text-sm font-semibold tracking-wide uppercase mb-3">The Problem</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
                You're not unemployable.<br />The process is broken.
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                The average executive spends <strong className="text-amber-400">11 hours per week</strong> on job applications — rewriting resumes, filling ATS forms, crafting cover letters — only to hear nothing back for weeks.
              </p>
            </div>

            <div className="overflow-hidden border border-gray-800" style={{ borderRadius: 16 }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#111827" }}>
                    <th className="text-left px-6 py-4 text-gray-500 uppercase tracking-wider text-xs font-semibold">What you do today</th>
                    <th className="text-left px-6 py-4 text-gray-500 uppercase tracking-wider text-xs font-semibold">What it actually costs you</th>
                  </tr>
                </thead>
                <tbody>
                  {PAIN_POINTS.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-[#0a0f1a]" : "bg-[#0d1320]"}>
                      <td className="px-6 py-4 text-gray-300">{row.action}</td>
                      <td className="px-6 py-4 text-red-400 font-medium">{row.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 text-center">
              <p className="text-xl text-white font-semibold">
                Total cost of doing it yourself: <span className="text-red-400">625+ hours per 1,000 applications</span>
              </p>
              <p className="text-gray-500 mt-2">That's 15 full work weeks. Three and a half months of your life.</p>
            </div>
          </div>
        </section>

        {/* ═══ SOLUTION / HOW IT WORKS ═══ */}
        <section id="how-it-works" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-3">The Solution</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
                What if 1,000 applications took<br />
                <span className="text-emerald-400">5 minutes a day?</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                1000Jobs pulls from 48 ATS platforms, scores every job against your profile, generates a tailored resume, and applies — all while you swipe.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
              {[
                { step: "01", title: "We Hunt", desc: "Our AI scans 48+ ATS platforms and LinkedIn daily. Thousands of jobs, filtered to your exact profile.", color: "#10B981", icon: "🎯" },
                { step: "02", title: "We Score", desc: "Every job is AI-scored against your skills, experience, and preferences. Only high-match jobs reach you.", color: "#F59E0B", icon: "⚡" },
                { step: "03", title: "You Swipe", desc: "Open the app. Swipe right on jobs you like. Swipe left on ones you don't. 5 minutes. Done.", color: "#8B5CF6", icon: "👆" },
                { step: "04", title: "We Apply", desc: "For every right-swipe, we generate a tailored resume and submit the application. You never touch an ATS form again.", color: "#EF4444", icon: "🚀" },
              ].map((item) => (
                <div key={item.step} className="relative bg-white/[0.02] border border-white/[0.06] p-7 group hover:border-emerald-500/30 transition-all" style={{ borderRadius: 16 }}>
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <div className="text-xs font-bold tracking-widest mb-2" style={{ color: item.color }}>STEP {item.step}</div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Before/After comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-500/5 border border-red-500/20 p-8" style={{ borderRadius: 16 }}>
                <h3 className="text-red-400 font-bold text-lg mb-4">Without 1000Jobs</h3>
                <ul className="space-y-3 text-gray-400 text-sm">
                  {["3 applications per week", "Generic resume for every job", "11 hours/week on applications", "Months to land an interview", "Burnout before you get an offer"].map((t) => (
                    <li key={t} className="flex items-start gap-3"><span className="text-red-400 mt-0.5">✕</span>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-8" style={{ borderRadius: 16 }}>
                <h3 className="text-emerald-400 font-bold text-lg mb-4">With 1000Jobs</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  {["10+ applications per day", "Custom-tailored resume per job", "5 minutes/day swiping", "Interviews within 2 weeks", "1,000 applications in 100 days"].map((t) => (
                    <li key={t} className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PRODUCT SCREENSHOTS ═══ */}
        <section className="py-20 px-6" style={{ background: "#060910" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-3">The Platform</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
                See it in action.
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Real screenshots from the live system. No mockups, no stock photos.
              </p>
            </div>

            {/* Portrait screenshots (Swipe Mode, Daily Report) shown side-by-side at full height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              {SCREENSHOTS.filter((s) => s.portrait).map((s) => (
                <div key={s.title} className="screenshot-card bg-white/[0.02] border border-white/[0.06] overflow-hidden hover:border-emerald-500/30 transition-all group" style={{ borderRadius: 16 }}>
                  <div className="overflow-hidden" style={{ borderRadius: "16px 16px 0 0" }}>
                    <img
                      src={s.src}
                      alt={s.title}
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                      style={{ display: "block" }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Landscape screenshots (Skills Profile, Resume Generation) with constrained height */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {SCREENSHOTS.filter((s) => !s.portrait).map((s) => (
                <div key={s.title} className="screenshot-card bg-white/[0.02] border border-white/[0.06] overflow-hidden hover:border-emerald-500/30 transition-all group" style={{ borderRadius: 16 }}>
                  <div className="overflow-hidden" style={{ borderRadius: "16px 16px 0 0" }}>
                    <img
                      src={s.src}
                      alt={s.title}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      style={{ maxHeight: 300, objectPosition: "top" }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SOCIAL PROOF ═══ */}
        <section id="proof" className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-3">Real Results</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
                Built by a founder. Tested on himself.
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                These aren't projections. This is what happened when we ran the system for 21 days.
              </p>
            </div>

            {/* Results dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { metric: "3,206", label: "Jobs Ingested & Scored", sub: "from 48 ATS platforms" },
                { metric: "351", label: "Applications Submitted", sub: "10.9% acceptance rate" },
                { metric: "47s", label: "Avg Resume Generation", sub: "per tailored application" },
                { metric: "4", label: "Interviews Landed", sub: "in first 3 weeks" },
              ].map((m) => (
                <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] p-5 text-center" style={{ borderRadius: 12 }}>
                  <div className="text-2xl font-extrabold text-white">{m.metric}</div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">{m.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Founder quote */}
            <div className="bg-white/[0.03] border border-emerald-500/20 p-8 relative" style={{ borderRadius: 16 }}>
              <div className="text-5xl text-emerald-500/20 absolute top-4 left-6">"</div>
              <p className="text-gray-300 text-lg leading-relaxed pl-8 pt-4">
                I built 1000Jobs because I was tired of spending 40 hours a week on applications and getting silence in return. In the first 21 days, the system scored 3,206 jobs, I swiped through them in minutes each morning, and it submitted 351 tailored applications. I landed 4 interviews — including two for C-suite roles. The total cost of resume generation? <strong className="text-emerald-400">$1.26.</strong>
              </p>
              <div className="mt-4 pl-8">
                <div className="text-white font-bold">Allan Abbas</div>
                <div className="text-gray-500 text-sm">Founder, 1000Jobs — Former COO, Fintech</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ OFFER STACK ═══ */}
        <section className="py-20 px-6" style={{ background: "#060910" }}>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-amber-400 text-sm font-semibold tracking-wide uppercase mb-3">The Offer</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
              Here's everything you get
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-14">
              We don't sell access. We sell applications. You pay for results, not features.
            </p>

            <div className="overflow-hidden border border-gray-800 text-left" style={{ borderRadius: 16 }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#111827" }}>
                    <th className="text-left px-6 py-4 text-gray-500 uppercase tracking-wider text-xs font-semibold">What you get</th>
                    <th className="text-right px-6 py-4 text-gray-500 uppercase tracking-wider text-xs font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["AI job scoring across 48+ ATS platforms", "$2,000"],
                    ["Swipe-based job review (5 min/day)", "$1,000"],
                    ["Mass application with polished resume", "$5,000"],
                    ["Custom-tailored resume per application (Customized tier)", "$25,000"],
                    ["Application tracking & analytics dashboard", "$500"],
                    ["Daily progress reports", "$500"],
                    ["Dedicated WhatsApp support", "$2,000"],
                  ].map(([item, value], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-[#0a0f1a]" : "bg-[#0d1320]"}>
                      <td className="px-6 py-4 text-gray-300">{item}</td>
                      <td className="px-6 py-4 text-right text-gray-500 line-through">{value}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#111827" }}>
                    <td className="px-6 py-5 text-white font-bold text-base">Total value</td>
                    <td className="px-6 py-5 text-right text-gray-400 line-through text-base font-bold">$36,000+</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 px-8 py-5 inline-block" style={{ borderRadius: 12 }}>
              <p className="text-white text-xl font-bold">
                Your price today: <span className="text-emerald-400">starting from $10</span>
              </p>
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-3">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
                Pick your approach.
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Two tiers. Both powered by AI. The question is: how personalised do you want each application?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* TIER 1: Mass Application */}
              <div className="bg-white/[0.02] border-2 border-emerald-500/50 p-8 flex flex-col relative" style={{ borderRadius: 20, boxShadow: "0 0 60px rgba(16,185,129,0.12)" }}>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-5 py-1.5 tracking-wider" style={{ borderRadius: 100 }}>
                  MOST POPULAR
                </div>
                <div className="text-emerald-400 text-xs uppercase tracking-widest font-semibold mb-3">Mass Application</div>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  One polished resume applied across hundreds of AI-matched jobs. Maximum volume, minimum effort.
                </p>

                {/* Pricing table */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] px-5 py-4" style={{ borderRadius: 12 }}>
                    <div>
                      <div className="text-white font-bold text-lg">$10</div>
                      <div className="text-gray-500 text-xs mt-0.5">one-time · test drive</div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-semibold">50 applications</div>
                      <div className="text-gray-600 text-xs mt-0.5">$0.20 per app</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-5 py-4" style={{ borderRadius: 12 }}>
                    <div>
                      <div className="text-white font-bold text-2xl">$199</div>
                      <div className="text-gray-500 text-xs mt-0.5">one-time · best value</div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-lg">1,000 applications</div>
                      <div className="text-gray-500 text-xs mt-0.5">$0.20 per app</div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 text-sm flex-1 mb-8">
                  {[
                    "AI job scoring (48+ platforms)",
                    "Swipe-based job review",
                    "Single polished resume applied",
                    "Application tracking dashboard",
                    "Daily progress reports",
                    "WhatsApp support",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-gray-300">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 font-bold py-3.5 text-black transition-all hover:scale-[1.02]"
                  style={{ background: "#25D366", borderRadius: 10 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Get Started — Message Us
                </a>
                <p className="text-gray-600 text-xs text-center mt-3">We'll confirm your package and get you set up within 24h</p>
              </div>

              {/* TIER 2: Customized Resumes */}
              <div className="bg-white/[0.02] border border-purple-500/30 p-8 flex flex-col relative" style={{ borderRadius: 20 }}>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-5 py-1.5 tracking-wider" style={{ borderRadius: 100 }}>
                  HIGHEST IMPACT
                </div>
                <div className="text-purple-400 text-xs uppercase tracking-widest font-semibold mb-3">Customized Resumes</div>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  A unique, ATS-optimized resume generated for every single application. Maximum relevance, maximum interview rate.
                </p>

                {/* Pricing table */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] px-5 py-4" style={{ borderRadius: 12 }}>
                    <div>
                      <div className="text-white font-bold text-lg">$10</div>
                      <div className="text-gray-500 text-xs mt-0.5">one-time · test drive</div>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-400 font-semibold">10 applications</div>
                      <div className="text-gray-600 text-xs mt-0.5">$1.00 per app</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/30 px-5 py-4" style={{ borderRadius: 12 }}>
                    <div>
                      <div className="text-white font-bold text-2xl">$500</div>
                      <div className="text-gray-500 text-xs mt-0.5">one-time · best value</div>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-400 font-bold text-lg">1,000 applications</div>
                      <div className="text-gray-500 text-xs mt-0.5">$0.50 per app</div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 text-sm flex-1 mb-8">
                  {[
                    "AI job scoring (48+ platforms)",
                    "Swipe-based job review",
                    "Unique tailored resume per application",
                    "90%+ ATS match rate per resume",
                    "Application tracking dashboard",
                    "Daily progress reports",
                    "WhatsApp support",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-gray-300">
                      <span className="text-purple-400 mt-0.5 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 font-bold py-3.5 border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-all"
                  style={{ borderRadius: 10 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Get Started — Message Us
                </a>
                <p className="text-gray-600 text-xs text-center mt-3">Ideal for competitive roles where you need to stand out</p>
              </div>
            </div>

            {/* Price anchoring */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                The average recruiter charges <strong className="text-white">$5,000–$15,000</strong> per placement. A career coach costs <strong className="text-white">$200/hour</strong>. A professional resume writer charges <strong className="text-white">$500–$1,000</strong> per resume.
              </p>
              <p className="text-gray-400 text-sm mt-2 font-medium">
                1000Jobs does all three — for <strong className="text-emerald-400">as little as $0.20 per application</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ URGENCY ═══ */}
        <section className="py-16 px-6" style={{ background: "#060910" }}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-amber-500/5 border border-amber-500/20 px-8 py-8" style={{ borderRadius: 16 }}>
              <h3 className="text-xl font-extrabold text-amber-400 mb-4">Early Access — Limited Spots</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
                We're onboarding the first 100 users at these prices. Once we hit capacity, pricing will increase. Message us on WhatsApp to lock in today's rate.
              </p>
              <p className="text-white text-sm mt-4 font-bold">
                Lock in today's price before we raise it.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section id="faq" className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-3">FAQ</p>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Got questions?</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 px-6 text-center relative overflow-hidden" style={{ background: "#060910" }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-15" style={{ background: "radial-gradient(ellipse, #10B981 0%, transparent 70%)" }} />
          </div>
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
              Every day you wait is a day someone else<br />applies to the role you wanted.
            </h2>
            <p className="text-gray-500 text-lg mb-10">
              Message us on WhatsApp and we'll get you started within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold px-10 py-4 text-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
                style={{ background: "#25D366", color: "#000", borderRadius: 12, boxShadow: "0 0 40px rgba(37,211,102,0.3)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Message Us on WhatsApp
              </a>
              <a
                href="#pricing"
                className="font-bold px-10 py-4 text-lg border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 transition-all"
                style={{ borderRadius: 12 }}
              >
                View Pricing
              </a>
            </div>
            <p className="text-gray-600 text-xs mt-6">No subscriptions. No recurring charges. Pay once, get your applications.</p>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-white/5 py-10 px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-extrabold text-lg tracking-tight">1000</span>
              <span className="text-amber-400 font-extrabold text-lg tracking-tight">JOBS</span>
              <span className="text-gray-700 text-sm ml-2">Smart Job Application Manager</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400 transition-colors flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                +971 50 941 0068
              </a>
              <a href="mailto:info@allanabbas.com" className="hover:text-gray-400 transition-colors">info@allanabbas.com</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
