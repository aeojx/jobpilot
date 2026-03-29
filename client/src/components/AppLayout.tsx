import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  BookOpen,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Menu,
  Radar,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const ownerNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/ingest", label: "Ingest Jobs", icon: Radar },
  { href: "/skills", label: "Skills Profile", icon: BookOpen },
  { href: "/questions", label: "Question Bank", icon: HelpCircle },
  { href: "/performance", label: "Performance", icon: BarChart3 },
];

const applierNav = [
  { href: "/apply", label: "My Queue", icon: Zap },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { href: "/questions", label: "Questions", icon: HelpCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: apiUsage } = trpc.ingestion.getUsage.useQuery(undefined, {
    enabled: user?.role === "admin",
    refetchInterval: 30000,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--atari-black)" }}>
        <div className="text-center">
          <p className="font-pixel text-xs glow-amber" style={{ color: "var(--atari-amber)", letterSpacing: "0.2em" }}>
            LOADING<span className="blink">_</span>
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--atari-black)" }}>
        <div className="text-center max-w-sm w-full">
          {/* Atari-style logo */}
          <div className="mb-6">
            <div className="inline-block px-4 py-2 mb-4" style={{ border: "2px solid var(--atari-amber)" }}>
              <p className="font-pixel text-xs" style={{ color: "var(--atari-amber)", letterSpacing: "0.15em" }}>
                ★ INSERT COIN ★
              </p>
            </div>
            <h1 className="font-pixel glow-amber mb-0" style={{ color: "var(--atari-amber)", fontSize: "22px" }}>
              JOB
            </h1>
            <h1 className="font-pixel glow-cyan mb-0" style={{ color: "var(--atari-cyan)", fontSize: "22px" }}>
              PILOT
            </h1>
          </div>

          <div className="atari-divider mb-6" />

          <p className="text-xs mb-8" style={{ color: "var(--atari-gray)", letterSpacing: "0.15em", fontFamily: "Share Tech Mono" }}>
            DUAL-ROLE JOB APPLICATION SYSTEM
          </p>

          <a
            href={getLoginUrl()}
            className="block w-full py-3 text-center text-xs tracking-widest uppercase transition-all"
            style={{
              fontFamily: "Press Start 2P, monospace",
              fontSize: "10px",
              background: "transparent",
              color: "var(--atari-amber)",
              border: "2px solid var(--atari-amber)",
              boxShadow: "0 0 8px rgba(255,176,0,0.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--atari-amber)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--atari-black)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--atari-amber)";
            }}
          >
            ▶ PRESS START
          </a>

          <p className="text-xs mt-8 animate-pixel-pulse" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
            © 2025 JOBPILOT SYSTEMS
          </p>
        </div>
      </div>
    );
  }

  const isOwner = user?.role === "admin";
  const navItems = isOwner ? ownerNav : applierNav;

  // Quota info
  const jobsRemaining = apiUsage && "jobsRemaining" in apiUsage ? apiUsage.jobsRemaining : null;
  const jobsLimit = apiUsage && "jobsLimit" in apiUsage ? apiUsage.jobsLimit : null;
  const quotaPct = jobsLimit && jobsRemaining != null ? Math.round((jobsRemaining / jobsLimit) * 100) : null;
  const quotaWarning = quotaPct !== null && quotaPct < 20;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3">
        <Link href={isOwner ? "/dashboard" : "/apply"} onClick={() => setMobileOpen(false)}>
          <div className="mb-1">
            <span className="font-pixel glow-amber" style={{ color: "var(--atari-amber)", fontSize: "14px" }}>JOB</span>
            <span className="font-pixel glow-cyan" style={{ color: "var(--atari-cyan)", fontSize: "14px" }}>PILOT</span>
          </div>
        </Link>
        <div className="atari-divider" />
      </div>

      {/* Role badge */}
      <div className="px-4 pb-3">
        <span
          className="inline-block text-xs px-2 py-1"
          style={{
            fontFamily: "Press Start 2P, monospace",
            fontSize: "8px",
            border: `1px solid ${isOwner ? "var(--atari-amber)" : "var(--atari-green)"}`,
            color: isOwner ? "var(--atari-amber)" : "var(--atari-green)",
            background: isOwner ? "rgba(255,176,0,0.08)" : "rgba(57,255,20,0.08)",
            letterSpacing: "0.1em",
          }}
        >
          {isOwner ? "★ OWNER" : "▶ APPLIER"}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/kanban");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* API Quota (Owner only) */}
      {isOwner && apiUsage && (
        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--atari-border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--atari-gray)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Share Tech Mono" }}>
            API CALLS / MONTH
          </p>
          <p className="font-pixel mb-1" style={{ color: quotaWarning ? "var(--atari-red)" : "var(--atari-amber)", fontSize: "10px" }}>
            {apiUsage.callCount}
          </p>
          {jobsRemaining != null && (
            <>
              <p className="text-xs mb-1" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
                {jobsRemaining.toLocaleString()} jobs left
                {quotaWarning && <span style={{ color: "var(--atari-red)" }}> ⚠</span>}
              </p>
              {quotaPct !== null && (
                <div className="progress-track">
                  <div
                    className={`progress-fill ${quotaPct >= 100 ? "complete" : ""}`}
                    style={{
                      width: `${quotaPct}%`,
                      background: quotaWarning ? "var(--atari-red)" : undefined,
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--atari-border)" }}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--atari-white)", fontFamily: "Share Tech Mono" }}>
              {user?.name ?? "USER"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--atari-gray)" }}>{user?.email ?? ""}</p>
          </div>
          <button
            onClick={() => logout()}
            className="transition-colors p-1 ml-2"
            style={{ color: "var(--atari-gray)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--atari-red)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--atari-gray)")}
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--atari-black)" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-52 flex-shrink-0"
        style={{ background: "var(--atari-black)", borderRight: "2px solid var(--atari-border)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col"
            style={{ background: "var(--atari-black)", borderRight: "2px solid var(--atari-amber)" }}
          >
            <button
              className="absolute top-4 right-4 transition-colors"
              style={{ color: "var(--atari-gray)" }}
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: "var(--atari-black)", borderBottom: "2px solid var(--atari-border)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            style={{ color: "var(--atari-gray)" }}
          >
            <Menu size={20} />
          </button>
          <div>
            <span className="font-pixel" style={{ color: "var(--atari-amber)", fontSize: "12px" }}>JOB</span>
            <span className="font-pixel" style={{ color: "var(--atari-cyan)", fontSize: "12px" }}>PILOT</span>
          </div>
          <span
            className="text-xs px-2 py-1"
            style={{
              fontFamily: "Press Start 2P, monospace",
              fontSize: "7px",
              border: `1px solid ${isOwner ? "var(--atari-amber)" : "var(--atari-green)"}`,
              color: isOwner ? "var(--atari-amber)" : "var(--atari-green)",
            }}
          >
            {isOwner ? "OWNER" : "APPLIER"}
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
