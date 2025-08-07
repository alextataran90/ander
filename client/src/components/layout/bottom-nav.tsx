import { useLocation } from "wouter";
import { Link } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: "fa-home", label: "Home", testId: "nav-home" },
    { path: "/history", icon: "fa-chart-bar", label: "History", testId: "nav-history" },
    { path: "/insights", icon: "fa-brain", label: "Insights", testId: "nav-insights" },
    { path: "/settings", icon: "fa-cog", label: "Settings", testId: "nav-settings" },
  ];

  return (
    <nav className="glass-strong rounded-t-3xl mx-4 mb-4 p-4 safe-area-bottom">
      <div className="flex justify-around items-center">
        {navItems.map(({ path, icon, label, testId }) => (
          <Link key={path} href={path} data-testid={testId}>
            <button
              className={`flex flex-col items-center space-y-1 transition-colors ${
                location === path ? "text-ios-blue" : "text-white/70"
              }`}
            >
              <i className={`fas ${icon} text-xl`}></i>
              <span className="text-xs font-medium">{label}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
