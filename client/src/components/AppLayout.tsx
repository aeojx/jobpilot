import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  BookOpen,
  Briefcase,
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
  { href: "/kanban", label: "Kanban Board", icon: LayoutGrid },
  { href: "/ingest", label: "Ingest Jobs", icon: Radar },
  { href: "/skills", label: "Skills Profile", icon: Briefcase },
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="brutal-divider mb-6" />
          <p
            className="text-foreground/60"
            style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.15em", textTransform: "uppercase" }}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm w-full px-6">
          <h1
            className="text-5xl font-black text-foreground mb-2"
            style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.05em" }}
          >
            JOBPILOT
          </h1>
          <div className="brutal-divider mb-6" />
          <p className="text-foreground/50 text-sm mb-8" style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.1em" }}>
            SIGN IN TO CONTINUE
          </p>
          <a
            href={getLoginUrl()}
            className="block w-full py-3 text-center font-black text-sm tracking-widest uppercase"
            style={{
              fontFamily: "var(--font-condensed)",
              background: "oklch(0.98 0 0)",
              color: "oklch(0.04 0 0)",
              border: "2px solid oklch(0.98 0 0)",
              transition: "all 0.1s ease",
            }}
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const isOwner = user?.role === "admin";
  const navItems = isOwner ? ownerNav : applierNav;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3">
        <Link href={isOwner ? "/kanban" : "/apply"} onClick={() => setMobileOpen(false)}>
          <h1
            className="text-3xl font-black text-foreground tracking-tight"
            style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.05em" }}
          >
            JOB<span style={{ color: "oklch(0.5 0.22 27)" }}>PILOT</span>
          </h1>
        </Link>
        <div className="brutal-divider mt-2" />
      </div>

      {/* Role badge */}
      <div className="px-4 pb-3">
        <span
          className="brutal-tag"
          style={{
            borderColor: isOwner ? "oklch(0.5 0.22 27)" : "oklch(0.65 0.18 145)",
            color: isOwner ? "oklch(0.5 0.22 27)" : "oklch(0.65 0.18 145)",
          }}
        >
          {isOwner ? "● Owner" : "● Applier"}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* API Usage (Owner only) */}
      {isOwner && apiUsage && (
        <div className="px-4 py-3 border-t border-border/30">
          <p
            className="text-foreground/40 text-xs mb-1"
            style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            API Calls This Month
          </p>
          <p
            className="text-foreground font-black text-lg"
            style={{ fontFamily: "var(--font-condensed)" }}
          >
            {apiUsage.callCount}
            <span className="text-foreground/30 text-sm font-normal ml-1">/ ∞</span>
          </p>
          <div className="progress-track mt-1">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (apiUsage.callCount / 500) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-4 py-4 border-t border-border/30">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p
              className="text-foreground text-sm font-bold truncate"
              style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.05em" }}
            >
              {user?.name ?? "User"}
            </p>
            <p className="text-foreground/40 text-xs truncate">{user?.email ?? ""}</p>
          </div>
          <button
            onClick={() => logout()}
            className="text-foreground/40 hover:text-foreground/80 transition-colors p-1 ml-2"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-52 flex-shrink-0 border-r"
        style={{ background: "oklch(0.06 0 0)", borderColor: "oklch(0.15 0 0)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col border-r"
            style={{ background: "oklch(0.06 0 0)", borderColor: "oklch(0.15 0 0)" }}
          >
            <button
              className="absolute top-4 right-4 text-foreground/50 hover:text-foreground"
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
          className="md:hidden flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ background: "oklch(0.06 0 0)", borderColor: "oklch(0.15 0 0)" }}
        >
          <button onClick={() => setMobileOpen(true)} className="text-foreground/60 hover:text-foreground">
            <Menu size={20} />
          </button>
          <h1
            className="text-xl font-black"
            style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.05em" }}
          >
            JOB<span style={{ color: "oklch(0.5 0.22 27)" }}>PILOT</span>
          </h1>
          <span
            className="brutal-tag text-xs"
            style={{
              borderColor: isOwner ? "oklch(0.5 0.22 27)" : "oklch(0.65 0.18 145)",
              color: isOwner ? "oklch(0.5 0.22 27)" : "oklch(0.65 0.18 145)",
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
