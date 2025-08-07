import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useHaptic } from "@/hooks/use-haptic";
import { useLocation } from "wouter";

export default function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { triggerHaptic } = useHaptic();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleSignOut = async () => {
    try {
      triggerHaptic("medium");
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="glass-strong rounded-b-3xl mx-4 mt-4 p-6 mb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-app-title">Ander</h1>
          <p className="text-white/70 text-sm">Blood Sugar Tracker</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="glass rounded-full p-3 ios-button"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            <i className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"} text-lg`}></i>
          </button>
          {user ? (
            <button 
              className="glass rounded-full p-3 ios-button"
              onClick={handleSignOut}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt text-lg"></i>
            </button>
          ) : (
            <button 
              className="glass rounded-full p-3 ios-button"
              onClick={() => setLocation("/login")}
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt text-lg"></i>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}