import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import KanbanBoard from "./pages/KanbanBoard";
import Ingestion from "./pages/Ingestion";
import Skills from "./pages/Skills";
import QuestionBank from "./pages/QuestionBank";
import Performance from "./pages/Performance";
import ApplierView from "./pages/ApplierView";
import AppLayout from "./components/AppLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* /dashboard is the canonical route; /kanban kept for backward compat */}
      <Route path="/dashboard">
        {() => <AppLayout><KanbanBoard /></AppLayout>}
      </Route>
      <Route path="/kanban">
        {() => <AppLayout><KanbanBoard /></AppLayout>}
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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
