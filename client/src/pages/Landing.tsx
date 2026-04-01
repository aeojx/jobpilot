import { useState } from "react";

const CHECK = "✅";
const CROSS = "❌";

const pricingFeatures = [
  { label: "Swipes per day", free: "10", hustler: "Unlimited", operator: "Unlimited" },
  { label: "AI match scoring", free: CHECK, hustler: CHECK, operator: CHECK },
  { label: "Pipeline tracker", free: CHECK, hustler: CHECK, operator: CHECK },
  { label: "Daily 9 PM email report", free: CROSS, hustler: CHECK, operator: CHECK },
  { label: "Weekly Friday email report", free: CROSS, hustler: CROSS, operator: CHECK },
  { label: "Auto-apply (10 jobs/day)", free: CROSS, hustler: CHECK, operator: CHECK },
  { label: "Priority job fetching (15 min)", free: CROSS, hustler: CHECK, operator: CHECK },
  { label: "Question Bank", free: CROSS, hustler: CHECK, operator: CHECK },
  { label: "Rejection analytics", free: CROSS, hustler: CHECK, operator: CHECK },
  { label: "AI pipeline coaching", free: CROSS, hustler: CROSS, operator: CHECK },
  { label: "Interview signal detection", free: CROSS, hustler: CROSS, operator: CHECK },
  { label: "Onboarding call (30 min)", free: CROSS, hustler: CROSS, operator: CHECK },
  { label: "Salary negotiation playbook", free: CROSS, hustler: CROSS, operator: CHECK },
  { label: "Priority support (4hr)", free: CROSS, hustler: CROSS, operator: CHECK },
];

const faqs = [
  {
    q: "Is this just a job board?",
    a: "No. 1000Jobs doesn't list jobs — it hunts them. It pulls from 40+ live job sources, scores each one against your profile in real time, and serves only the ones worth your attention. You never browse. You only decide.",
  },
  {
    q: "Do I need to write cover letters?",
    a: "No. Your profile is your cover letter. The AI builds a tailored application from your CV and the job description. You swipe. It applies.",
  },
  {
    q: "What if I get too many interviews?",
    a: "That's the goal. The Operator plan includes interview signal detection so you can prioritize which ones to pursue first.",
  },
  {
    q: "How is this different from Easy Apply on LinkedIn?",
    a: "LinkedIn Easy Apply still requires you to find the jobs, evaluate them, and click through each one. 1000Jobs removes all three steps. You only make one decision: left or right. Also, Easy Apply LinkedIn jobs attract thousands of applicants. We pull directly from ATS systems — less competition, higher signal.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no cancellation fees. Cancel from your dashboard in 10 seconds.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-[#00ff9f22] rounded-lg overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-5 bg-[#111827] hover:bg-[#1a2235] transition-colors">
        <span className="text-[#e2e8f0] font-medium text-base">{q}</span>
        <span className="text-[#00ff9f] text-xl ml-4 flex-shrink-0">{open ? "−" : "+"}</span>
      </div>
      {open && (
        <div className="px-6 py-4 bg-[#0f0f1a] text-[#94a3b8] text-sm leading-relaxed border-t border-[#00ff9f22]">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="bg-[#0a0a12] text-[#e2e8f0] font-mono min-h-screen">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a12cc] backdrop-blur border-b border-[#00ff9f22]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff9f] font-bold text-xl tracking-widest">1000</span>
            <span className="text-[#fbbf24] font-bold text-xl tracking-widest">JOBS</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-[#64748b] hover:text-[#e2e8f0] text-sm transition-colors hidden sm:block">Pricing</a>
            <a href="#faq" className="text-[#64748b] hover:text-[#e2e8f0] text-sm transition-colors hidden sm:block">FAQ</a>
            <a
              href="https://1000jobs.manus.space"
              className="bg-[#00ff9f] text-[#0a0a12] text-sm font-bold px-4 py-2 rounded hover:bg-[#00e68a] transition-colors"
            >
              Start Free →
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ff9f08] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-block bg-[#00ff9f15] border border-[#00ff9f33] text-[#00ff9f] text-xs tracking-widest px-4 py-2 rounded-full mb-8">
            ▶ TINDER FOR JOBS — NOW IN EARLY ACCESS
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
            Swipe Right on Your<br />
            <span className="text-[#00ff9f]">Next Job.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-[#94a3b8] mb-4 max-w-2xl mx-auto leading-relaxed">
            Land 1,000 Applications Without Burning Out.
          </p>
          <p className="text-base text-[#64748b] mb-10 max-w-xl mx-auto leading-relaxed">
            If applying to jobs worked like Tinder — swipe through AI-matched roles, apply in one tap, and get a daily report delivered to your inbox every night at 9 PM.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://1000jobs.manus.space"
              className="bg-[#00ff9f] text-[#0a0a12] font-bold px-8 py-4 rounded-lg text-lg hover:bg-[#00e68a] transition-all hover:scale-105 shadow-[0_0_30px_#00ff9f40]"
            >
              Start Swiping Free →
            </a>
            <a
              href="#how-it-works"
              className="border border-[#00ff9f44] text-[#00ff9f] font-bold px-8 py-4 rounded-lg text-lg hover:bg-[#00ff9f10] transition-colors"
            >
              See How It Works ↓
            </a>
          </div>

          {/* Swipe card visual */}
          <div className="relative w-72 mx-auto mb-12 select-none">
            {/* Back card */}
            <div className="absolute top-3 left-3 right-3 h-36 bg-[#1a1a2e] border border-[#334155] rounded-xl opacity-50 rotate-3" />
            {/* Middle card */}
            <div className="absolute top-1.5 left-1.5 right-1.5 h-36 bg-[#1a1a2e] border border-[#334155] rounded-xl opacity-75 rotate-1" />
            {/* Front card */}
            <div className="relative bg-[#1a1a2e] border border-[#00ff9f44] rounded-xl p-5 shadow-[0_0_40px_#00ff9f15]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[#e2e8f0] font-bold text-sm">Senior Product Manager</div>
                  <div className="text-[#64748b] text-xs mt-0.5">Stripe · Remote · $140k–$180k</div>
                </div>
                <div className="bg-[#00ff9f20] text-[#00ff9f] text-xs font-bold px-2 py-1 rounded">94% match</div>
              </div>
              <div className="text-[#475569] text-xs leading-relaxed mb-4">
                Lead product strategy for our payments infrastructure team. 5+ years PM experience required...
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-[#f8717120] border border-[#f87171] text-[#f87171] text-sm font-bold py-2 rounded-lg">✕ Pass</button>
                <button className="flex-1 bg-[#00ff9f20] border border-[#00ff9f] text-[#00ff9f] text-sm font-bold py-2 rounded-lg">✓ Apply</button>
              </div>
            </div>
          </div>

          {/* Trust quote */}
          <div className="max-w-lg mx-auto bg-[#111827] border border-[#00ff9f22] rounded-xl px-6 py-4">
            <p className="text-[#94a3b8] text-sm italic leading-relaxed">
              "19 applications submitted in the first 24 hours. I've never moved this fast."
            </p>
            <p className="text-[#00ff9f] text-xs mt-2">— Allan A., currently in final rounds at 3 companies</p>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-20 px-6 bg-[#0d0d1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Job searching is broken.</h2>
            <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">
              The average job seeker spends <strong className="text-[#fbbf24]">11 hours per week</strong> writing cover letters, reformatting resumes, and copy-pasting the same information into 47 different ATS portals — only to hear nothing back for weeks.
            </p>
            <p className="text-[#64748b] mt-4 text-base">You're not lazy. The process is ineffective and exhausting.</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#334155]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1e293b]">
                  <th className="text-left px-6 py-4 text-[#64748b] uppercase tracking-widest text-xs">What you do</th>
                  <th className="text-left px-6 py-4 text-[#64748b] uppercase tracking-widest text-xs">What it costs you</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Browse LinkedIn for 2 hours", "2 hours, 0 applications"],
                  ["Write a tailored cover letter", "15 minutes per job"],
                  ["Fill out the ATS form manually", "15 minutes per job"],
                  ["Wait 3 weeks to hear back", "Your sanity"],
                  ["Repeat 200+ times to land an offer", "Your entire quarter"],
                ].map(([action, cost], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-[#0f0f1a]" : "bg-[#111827]"}>
                    <td className="px-6 py-4 text-[#e2e8f0]">{action}</td>
                    <td className="px-6 py-4 text-[#f87171]">{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[#e2e8f0] text-lg">You don't have a motivation problem. <strong className="text-[#fbbf24]">You don't have the right tools.</strong></p>
            <p className="text-[#64748b] mt-3">The companies hiring right now are interviewing candidates who applied 42 minutes ago. If you're not moving fast, you're invisible.</p>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            What if applying to jobs felt like<br />
            <span className="text-[#00ff9f]">swiping on Tinder?</span>
          </h2>
          <p className="text-[#94a3b8] text-lg mb-12 max-w-2xl mx-auto">
            <strong className="text-[#e2e8f0]">1000Jobs</strong> pulls in thousands of live job listings every day, scores each one against your skills and preferences using AI, and presents them to you one at a time. In 5 minutes a day you can match with hundreds of jobs per week.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "👉", action: "Swipe Right", result: "Goes into your Apply queue", color: "#00ff9f" },
              { icon: "👈", action: "Swipe Left", result: "Gone forever — never see it again", color: "#f87171" },
              { icon: "⚡", action: "Tap Apply", result: "AI submits with custom resume & cover letter", color: "#fbbf24" },
            ].map((item) => (
              <div key={item.action} className="bg-[#111827] border border-[#334155] rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="font-bold text-lg mb-2" style={{ color: item.color }}>{item.action}</div>
                <div className="text-[#64748b] text-sm leading-relaxed">{item.result}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#00ff9f10] border border-[#00ff9f33] rounded-xl px-8 py-6 inline-block">
            <p className="text-[#e2e8f0] text-xl font-bold">
              From 3 applications a week → <span className="text-[#00ff9f]">30 a day.</span>
            </p>
            <p className="text-[#64748b] text-sm mt-2">Without working harder. No copy-paste. No ATS hell.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 bg-[#0d0d1a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">Three Steps to 1,000 Applications</h2>
          <p className="text-[#64748b] text-center mb-14 text-base">Set it up once. Swipe daily. Watch the pipeline fill.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Build Your Profile Once",
                body: "Upload your CV, set target roles, locations, and salary range. Tell the AI your dealbreakers. Done. It learns from your swipes and gets sharper every day.",
                color: "#00ff9f",
              },
              {
                step: "02",
                title: "Swipe Every Day",
                body: "Open the app. Jobs are served like cards. Swipe right on anything interesting. Swipe left on anything that doesn't fit. 5 minutes. Done.",
                color: "#fbbf24",
              },
              {
                step: "03",
                title: "Watch the Pipeline Fill",
                body: "Your daily report lands at 9 PM: how many you applied to, how many are queued, how many weeks until you hit 1,000. You stay in control without doing the grunt work.",
                color: "#60a5fa",
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-[#111827] border border-[#334155] rounded-xl p-7">
                <div className="text-5xl font-bold mb-4 opacity-20" style={{ color: item.color }}>{item.step}</div>
                <h3 className="text-lg font-bold mb-3" style={{ color: item.color }}>{item.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What Early Users Are Saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "I hit 100 applications in my first two weeks. My previous record was 12 in a month.", name: "Software Engineer", location: "Dubai" },
              { quote: "The daily email is the best part. I wake up and already know exactly where I stand.", name: "Marketing Manager", location: "London" },
              { quote: "I got 4 interview requests in the first week. I haven't changed anything about my CV.", name: "Product Designer", location: "Toronto" },
            ].map((t) => (
              <div key={t.name} className="bg-[#111827] border border-[#00ff9f22] rounded-xl p-6">
                <p className="text-[#94a3b8] text-sm italic leading-relaxed mb-4">"{t.quote}"</p>
                <div className="text-[#00ff9f] text-xs font-bold">{t.name}</div>
                <div className="text-[#475569] text-xs">{t.location}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6 bg-[#0d0d1a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">Simple, Honest Pricing</h2>
          <p className="text-[#64748b] text-center mb-4 max-w-xl mx-auto">
            The question isn't whether you can afford this. The question is: <strong className="text-[#e2e8f0]">how much is one job offer worth to you?</strong>
          </p>
          <p className="text-[#94a3b8] text-center text-sm mb-14 max-w-xl mx-auto">
            The average salary increase when switching jobs is 15–20%. On a $100,000 salary, that's $15,000–$20,000 per year — every year. 1000Jobs costs less than a single dinner out.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Free */}
            <div className="bg-[#111827] border border-[#334155] rounded-2xl p-8 flex flex-col">
              <div className="text-[#64748b] text-xs uppercase tracking-widest mb-2">Free</div>
              <div className="text-4xl font-bold text-white mb-1">$0</div>
              <div className="text-[#475569] text-xs mb-6">forever</div>
              <div className="text-[#94a3b8] text-sm italic mb-6">"Dip Your Toes In"</div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {["10 swipes per day", "AI match scoring", "Pipeline tracker", "Web app access"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[#64748b]"><span className="text-[#00ff9f]">✓</span>{f}</li>
                ))}
                {["Daily email report", "Auto-apply", "Priority job fetching"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[#334155] line-through"><span className="text-[#334155]">✗</span>{f}</li>
                ))}
              </ul>
              <a href="https://1000jobs.manus.space" className="block text-center border border-[#334155] text-[#64748b] font-bold py-3 rounded-lg hover:border-[#00ff9f44] hover:text-[#e2e8f0] transition-colors text-sm">
                Start Free — No Card Required
              </a>
            </div>

            {/* Hustler */}
            <div className="bg-[#111827] border-2 border-[#00ff9f] rounded-2xl p-8 flex flex-col relative shadow-[0_0_40px_#00ff9f20]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00ff9f] text-[#0a0a12] text-xs font-bold px-4 py-1 rounded-full tracking-widest">
                MOST POPULAR
              </div>
              <div className="text-[#00ff9f] text-xs uppercase tracking-widest mb-2">Hustler</div>
              <div className="text-4xl font-bold text-white mb-1">$29</div>
              <div className="text-[#475569] text-xs mb-6">per month · 7-day free trial</div>
              <div className="text-[#94a3b8] text-sm italic mb-6">"Apply Like It's Your Job"</div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {[
                  "Everything in Free",
                  "Unlimited swipes",
                  "Auto-apply (10 jobs/day)",
                  "Daily 9 PM email report",
                  "Priority job fetching (15 min)",
                  "Question Bank",
                  "Rejection analytics",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[#e2e8f0]"><span className="text-[#00ff9f]">✓</span>{f}</li>
                ))}
              </ul>
              <a href="https://1000jobs.manus.space" className="block text-center bg-[#00ff9f] text-[#0a0a12] font-bold py-3 rounded-lg hover:bg-[#00e68a] transition-colors text-sm">
                Start 7-Day Free Trial →
              </a>
              <p className="text-[#475569] text-xs text-center mt-3 italic">Most users apply to more jobs in their first week than they did in the previous 3 months.</p>
            </div>

            {/* Operator */}
            <div className="bg-[#111827] border border-[#a78bfa44] rounded-2xl p-8 flex flex-col">
              <div className="text-[#a78bfa] text-xs uppercase tracking-widest mb-2">Operator</div>
              <div className="text-4xl font-bold text-white mb-1">$99</div>
              <div className="text-[#475569] text-xs mb-6">per month</div>
              <div className="text-[#94a3b8] text-sm italic mb-6">"Done With You — Maximum Velocity"</div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {[
                  "Everything in Hustler",
                  "Weekly Friday email report",
                  "AI pipeline coaching",
                  "Interview signal detection",
                  "30-min onboarding call",
                  "Salary negotiation playbook",
                  "Priority support (4hr response)",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[#e2e8f0]"><span className="text-[#a78bfa]">✓</span>{f}</li>
                ))}
              </ul>
              <a href="https://1000jobs.manus.space" className="block text-center border border-[#a78bfa] text-[#a78bfa] font-bold py-3 rounded-lg hover:bg-[#a78bfa15] transition-colors text-sm">
                Get Started with Operator →
              </a>
              <p className="text-[#475569] text-xs text-center mt-3 italic">At $99/month, this is less than one hour of a career coach — and it works 24/7.</p>
            </div>
          </div>

          {/* Feature comparison table */}
          <div className="overflow-x-auto rounded-xl border border-[#334155]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1e293b]">
                  <th className="text-left px-5 py-4 text-[#64748b] uppercase tracking-widest text-xs">Feature</th>
                  <th className="text-center px-5 py-4 text-[#64748b] uppercase tracking-widest text-xs">Free</th>
                  <th className="text-center px-5 py-4 text-[#00ff9f] uppercase tracking-widest text-xs">Hustler</th>
                  <th className="text-center px-5 py-4 text-[#a78bfa] uppercase tracking-widest text-xs">Operator</th>
                </tr>
              </thead>
              <tbody>
                {pricingFeatures.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-[#0f0f1a]" : "bg-[#111827]"}>
                    <td className="px-5 py-3 text-[#94a3b8]">{row.label}</td>
                    <td className="px-5 py-3 text-center text-[#64748b]">{row.free}</td>
                    <td className="px-5 py-3 text-center text-[#e2e8f0]">{row.hustler}</td>
                    <td className="px-5 py-3 text-center text-[#e2e8f0]">{row.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-[#111827] border border-[#fbbf2444] rounded-2xl p-10">
            <div className="text-5xl mb-6">🛡️</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              The "1,000 Applications or We Work for Free" Guarantee
            </h2>
            <p className="text-[#94a3b8] text-base leading-relaxed mb-6">
              If you use 1000Jobs on the Hustler or Operator plan for 90 days, follow the daily swipe habit, and don't reach 1,000 applications — we'll refund your last month. No forms. No hoops. One email.
            </p>
            <div className="bg-[#0f0f1a] rounded-xl px-6 py-4 inline-block">
              <p className="text-[#fbbf24] text-sm font-bold">Why can we offer this?</p>
              <p className="text-[#64748b] text-sm mt-1">30 applications per day × 90 days = 2,700 applications. The math works. The only way you don't hit 1,000 is if you stop swiping.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SCARCITY */}
      <section className="py-16 px-6 bg-[#0d0d1a]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-[#fbbf2415] border border-[#fbbf2444] rounded-xl px-8 py-6">
            <h3 className="text-xl font-bold text-[#fbbf24] mb-3">⚡ Early Access Pricing — Locks In Forever</h3>
            <p className="text-[#94a3b8] text-sm leading-relaxed">
              The $29 Hustler and $99 Operator prices are <strong className="text-[#e2e8f0]">early adopter rates</strong>. When we launch publicly, Hustler goes to $49 and Operator goes to $149.
            </p>
            <p className="text-[#e2e8f0] text-sm mt-3 font-bold">
              Sign up today — your price is locked in for life, even as we add features.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 bg-[#0d0d1a] text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#00ff9f08] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            You're one swipe away from your next job.
          </h2>
          <p className="text-[#64748b] text-lg mb-10">
            Every day you wait is a day someone else applies to the role you wanted.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://1000jobs.manus.space"
              className="bg-[#00ff9f] text-[#0a0a12] font-bold px-10 py-4 rounded-lg text-lg hover:bg-[#00e68a] transition-all hover:scale-105 shadow-[0_0_30px_#00ff9f40]"
            >
              Start Swiping Free →
            </a>
            <a
              href="https://1000jobs.manus.space"
              className="border border-[#00ff9f44] text-[#00ff9f] font-bold px-10 py-4 rounded-lg text-lg hover:bg-[#00ff9f10] transition-colors"
            >
              Unlock Hustler — 7 Days Free
            </a>
          </div>
          <p className="text-[#475569] text-xs mt-6">No credit card required for Free · 7-day trial for Hustler · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1e293b] py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff9f] font-bold text-lg tracking-widest">1000</span>
            <span className="text-[#fbbf24] font-bold text-lg tracking-widest">JOBS</span>
            <span className="text-[#334155] text-sm ml-2">· Smart Job Application Manager</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#475569]">
            <a href="#" className="hover:text-[#64748b] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#64748b] transition-colors">Terms of Service</a>
            <a href="mailto:hello@allanabbas.com" className="hover:text-[#64748b] transition-colors">hello@allanabbas.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
