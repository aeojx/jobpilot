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
                background: "oklch(0.07 0 0)",
                border: "1.5px solid oklch(0.5 0.22 27)",
                color: "oklch(0.98 0 0)",
                fontFamily: "Barlow Condensed, sans-serif",
                fontWeight: "700",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderRadius: "0",
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
