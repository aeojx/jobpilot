import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import KanbanBoard from "./pages/KanbanBoard";
import Ingestion from "./pages/Ingestion";
import Skills from "./pages/Skills";
import QuestionBank from "./pages/QuestionBank";
import Performance from "./pages/Performance";
import ApplierView from "./pages/ApplierView";
import AppLayout from "./components/AppLayout";
import PasswordGate from "./pages/PasswordGate";
import SwipeView from "./pages/SwipeView";
import FAQ from "./pages/FAQ";
import ReleaseNotes from "./pages/ReleaseNotes";
import ResumeGeneration from "./pages/ResumeGeneration";
import Landing from "./pages/Landing";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

// ─── Gate Guard ───────────────────────────────────────────────────────────────
// Checks the server-side cookie. If not unlocked, renders the password gate.
// Once unlocked, navigates directly to /dashboard — no intermediate landing page.

function GateGuard({ children }: { children: React.ReactNode }) {
  const [forceUnlocked, setForceUnlocked] = useState(false);
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.gate.check.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5, // re-check every 5 minutes
  });

  // While checking, show a minimal loading screen in Atari style
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--atari-black)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "10px",
          color: "var(--atari-amber)",
          letterSpacing: "0.15em",
        }}
      >
        LOADING...
      </div>
    );
  }

  const isUnlocked = forceUnlocked || data?.unlocked;

  if (!isUnlocked) {
    return (
      <PasswordGate
        onUnlocked={() => {
          setForceUnlocked(true);
          navigate("/dashboard");
        }}
      />
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Root redirects straight to Dashboard — no landing page */}
      <Route path="/">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <Route path="/dashboard">
        {() => <AppLayout><KanbanBoard /></AppLayout>}
      </Route>
      {/* /kanban kept for backward compat */}
      <Route path="/kanban">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <Route path="/ingest">
        {() => <AppLayout><Ingestion /></AppLayout>}
      </Route>
      <Route path="/skills">
        {() => <AppLayout><Skills /></AppLayout>}
      </Route>
      <Route path="/questions">
        {() => <AppLayout><QuestionBank /></AppLayout>}
      </Route>
      <Route path="/performance">
        {() => <AppLayout><Performance /></AppLayout>}
      </Route>
      <Route path="/apply">
        {() => <AppLayout><ApplierView /></AppLayout>}
      </Route>
      <Route path="/swiping">
        {() => <AppLayout><SwipeView /></AppLayout>}
      </Route>
      <Route path="/faq">
        {() => <AppLayout><FAQ /></AppLayout>}
      </Route>
      <Route path="/resume-generation">
        {() => <AppLayout><ResumeGeneration /></AppLayout>}
      </Route>
      <Route path="/release-notes" component={ReleaseNotes} />
      <Route path="/landing" component={Landing} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Routes that are publicly accessible without the password gate
const PUBLIC_ROUTES = ["/landing", "/release-notes"];

function GatedApp() {
  const [location] = useLocation();
  const isPublic = PUBLIC_ROUTES.some((r) => location === r || location.startsWith(r + "/"));

  if (isPublic) {
    return <Router />;
  }

  return (
    <GateGuard>
      <Router />
    </GateGuard>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "var(--atari-panel, #14141f)",
                border: "2px solid var(--atari-amber, #ffb000)",
                color: "var(--atari-white, #e0e0f0)",
                fontFamily: "Share Tech Mono, monospace",
                fontSize: "12px",
                letterSpacing: "0.05em",
                borderRadius: "0",
                boxShadow: "0 0 12px rgba(255,176,0,0.2)",
              },
            }}
          />
          <GatedApp />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
