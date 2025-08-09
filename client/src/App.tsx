import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/auth/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import History from "@/pages/history";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import EmailConfirm from "@/pages/email-confirm";

// Normalize Vite base for wouter:
// - dev/Replit: BASE_URL = "/"  -> wouter base must be ""
// - GitHub Pages project site: BASE_URL = "/ander/" -> wouter base should be "/ander"
const rawBase = import.meta.env.BASE_URL || "/";
const base = rawBase === "/" ? "" : rawBase.replace(/\/$/, "");

// Theme Provider Component
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return <div data-theme={theme}>{children}</div>;
}

// App routes
function AppRoutes() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>

      <Route path="/history">
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      </Route>

      <Route path="/insights">
        <ProtectedRoute>
          <Insights />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/email-confirm" component={EmailConfirm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Auto-hide address bar on iOS Safari
  useEffect(() => {
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const handleOrientationChange = () => {
        setTimeout(() => {
          window.scrollTo(0, 1);
        }, 500);
      };

      window.addEventListener("orientationchange", handleOrientationChange);
      return () => window.removeEventListener("orientationchange", handleOrientationChange);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <div className="relative z-10 safe-area-top safe-area-bottom">
              {/* Background Gradient Overlay */}
              <div className="fixed inset-0 gradient-overlay pointer-events-none" />
              <Toaster position="top-center" richColors />

              {/* Wouter with dynamic base (works in Replit and GitHub Pages) */}
              <WouterRouter base={base}>
                <AppRoutes />
              </WouterRouter>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
