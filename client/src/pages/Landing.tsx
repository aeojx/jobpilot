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
`;

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
    q: "What exactly do I get for $1?",
    a: "10 AI-matched job applications sent on your behalf. Each one includes a tailored resume optimized for 90%+ ATS match rate. Think of it as a test drive — see the quality before committing.",
  },
  {
    q: "How is the $499 White Glove different from the $100 plan?",
    a: "The $100 plan mass-applies with your existing resume. The $499 White Glove plan generates a custom-tailored resume for every single application, rewrites your LinkedIn profile, and includes a dedicated career strategist. You literally just swipe — we handle everything else.",
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
    a: "The White Glove plan comes with a full money-back guarantee. If you complete the 100-day program and don't land interviews, we refund every dollar. No forms, no hoops, one email.",
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
                href="#pricing"
                className="text-sm font-bold px-5 py-2.5 transition-all hover:scale-105"
                style={{ background: "#10B981", color: "#000", borderRadius: 8 }}
              >
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
                href="#pricing"
                className="font-bold px-10 py-4 text-lg transition-all hover:scale-105"
                style={{ background: "#10B981", color: "#000", borderRadius: 12, boxShadow: "0 0 40px rgba(16,185,129,0.3)" }}
              >
                Start for $1 — 10 Applications
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

        {/* ═══ SOCIAL PROOF ═══ */}
        <section id="proof" className="py-20 px-6" style={{ background: "#060910" }}>
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
        <section className="py-20 px-6">
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
                    ["1,000 targeted job applications over 100 days", "$5,000"],
                    ["Custom-tailored resume per application (White Glove)", "$25,000"],
                    ["LinkedIn profile rewrite (White Glove)", "$500"],
                    ["Dedicated career strategist (White Glove)", "$3,000"],
                    ["Daily progress reports & analytics dashboard", "$500"],
                    ["Full money-back guarantee (White Glove)", "Priceless"],
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
                Your price today: <span className="text-emerald-400">as low as $1</span>
              </p>
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" className="py-20 px-6" style={{ background: "#060910" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-3">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
                Pick your speed.
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                The question isn't whether you can afford this. It's how much is <strong className="text-white">one job offer worth to you?</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TIER 1: Test Drive */}
              <div className="bg-white/[0.02] border border-gray-800 p-8 flex flex-col hover:border-gray-600 transition-all" style={{ borderRadius: 20 }}>
                <div className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">Test Drive</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-white">$1</span>
                </div>
                <div className="text-gray-600 text-sm mb-2">one-time payment</div>
                <div className="text-amber-400 text-sm font-medium mb-6">10 job applications</div>

                <ul className="space-y-3 text-sm flex-1 mb-8">
                  {[
                    "10 AI-matched applications",
                    "AI job scoring (48+ platforms)",
                    "Swipe-based job review",
                    "Application tracking dashboard",
                    "See the quality before committing",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-gray-400">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Stripe checkout coming soon — we'll notify you when payments are live!"); }}
                  className="block text-center font-bold py-3.5 border border-gray-700 text-gray-300 hover:border-emerald-500/50 hover:text-white transition-all"
                  style={{ borderRadius: 10 }}
                >
                  Try for $1
                </a>
              </div>

              {/* TIER 2: Mass Apply */}
              <div className="bg-white/[0.02] border-2 border-emerald-500/50 p-8 flex flex-col relative" style={{ borderRadius: 20, boxShadow: "0 0 60px rgba(16,185,129,0.12)" }}>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-5 py-1.5 tracking-wider" style={{ borderRadius: 100 }}>
                  MOST POPULAR
                </div>
                <div className="text-emerald-400 text-xs uppercase tracking-widest font-semibold mb-3">Mass Apply</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-white">$100</span>
                </div>
                <div className="text-gray-600 text-sm mb-2">one-time · 100 days</div>
                <div className="text-emerald-400 text-sm font-medium mb-6">1,000 job applications</div>

                <ul className="space-y-3 text-sm flex-1 mb-8">
                  {[
                    "1,000 AI-matched applications",
                    "AI job scoring (48+ platforms)",
                    "Swipe-based job review",
                    "Application tracking dashboard",
                    "Daily progress reports",
                    "Priority job fetching",
                    "$0.10 per application",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-gray-300">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Stripe checkout coming soon — we'll notify you when payments are live!"); }}
                  className="block text-center font-bold py-3.5 text-black transition-all hover:scale-[1.02]"
                  style={{ background: "#10B981", borderRadius: 10 }}
                >
                  Get 1,000 Applications — $100
                </a>
                <p className="text-gray-600 text-xs text-center mt-3">That's $0.10 per targeted application</p>
              </div>

              {/* TIER 3: White Glove */}
              <div className="bg-white/[0.02] border border-purple-500/30 p-8 flex flex-col relative" style={{ borderRadius: 20 }}>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-5 py-1.5 tracking-wider" style={{ borderRadius: 100 }}>
                  WHITE GLOVE
                </div>
                <div className="text-purple-400 text-xs uppercase tracking-widest font-semibold mb-3">White Glove</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-white">$499</span>
                </div>
                <div className="text-gray-600 text-sm mb-2">one-time · 100 days</div>
                <div className="text-purple-400 text-sm font-medium mb-6">1,000 custom-tailored applications</div>

                <ul className="space-y-3 text-sm flex-1 mb-8">
                  {[
                    "1,000 custom-tailored applications",
                    "AI resume per application (90%+ ATS)",
                    "LinkedIn profile rewrite",
                    "Dedicated career strategist",
                    "Application tracking + analytics",
                    "Daily & weekly progress reports",
                    "Full money-back guarantee",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-gray-300">
                      <span className="text-purple-400 mt-0.5 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Stripe checkout coming soon — we'll notify you when payments are live!"); }}
                  className="block text-center font-bold py-3.5 border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-all"
                  style={{ borderRadius: 10 }}
                >
                  Get White Glove — $499
                </a>
                <p className="text-gray-600 text-xs text-center mt-3">Money-back guarantee included</p>
              </div>
            </div>

            {/* Price anchoring */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                The average recruiter charges <strong className="text-white">$5,000–$15,000</strong> per placement. A career coach costs <strong className="text-white">$200/hour</strong>. A professional resume writer charges <strong className="text-white">$500–$1,000</strong> per resume.
              </p>
              <p className="text-gray-400 text-sm mt-2 font-medium">
                1000Jobs does all three — for <strong className="text-emerald-400">$0.50 per application</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ GUARANTEE ═══ */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white/[0.03] border border-amber-500/20 p-10" style={{ borderRadius: 20 }}>
              <div className="text-5xl mb-5">🛡</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-5 tracking-tight">
                The "Interviews or Your Money Back" Guarantee
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-6 max-w-xl mx-auto">
                If you purchase the White Glove plan, complete the 100-day program, and don't land any interviews — we'll refund every dollar. No forms, no hoops, one email. We take the risk so you don't have to.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-4 inline-block" style={{ borderRadius: 10 }}>
                <p className="text-amber-400 text-sm font-bold">Why can we offer this?</p>
                <p className="text-gray-500 text-sm mt-1">Because the math works. 1,000 tailored applications with 90%+ ATS match rates statistically guarantee interview callbacks. If they don't, you deserve your money back.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ URGENCY ═══ */}
        <section className="py-16 px-6" style={{ background: "#060910" }}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-amber-500/5 border border-amber-500/20 px-8 py-8" style={{ borderRadius: 16 }}>
              <h3 className="text-xl font-extrabold text-amber-400 mb-4">Early Access Pricing — Won't Last</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
                We're onboarding the first 100 users at these prices. Once we hit capacity, the $100 Mass Apply plan goes to <strong className="text-white">$199</strong> and the $499 White Glove goes to <strong className="text-white">$999</strong>.
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
              Start with $1. See the quality. Then decide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#pricing"
                className="font-bold px-10 py-4 text-lg transition-all hover:scale-105"
                style={{ background: "#10B981", color: "#000", borderRadius: 12, boxShadow: "0 0 40px rgba(16,185,129,0.3)" }}
              >
                Start for $1 — 10 Applications
              </a>
              <a
                href="#pricing"
                className="font-bold px-10 py-4 text-lg border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 transition-all"
                style={{ borderRadius: 12 }}
              >
                Go White Glove — $499
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
              <a href="mailto:info@allanabbas.com" className="hover:text-gray-400 transition-colors">info@allanabbas.com</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
