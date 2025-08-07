import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Settings() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);

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

  const exportData = () => {
    // In a real app, this would export user data
    alert("Data export feature would be implemented here");
  };

  const clearData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      // In a real app, this would clear all user data
      alert("Data clear feature would be implemented here");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="px-4 py-6">
        <section className="mb-6">
          <div className="glass-strong rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <i className="fas fa-cog text-ios-blue mr-3"></i>
              Settings
            </h2>

            <div className="space-y-6">
              {/* Appearance */}
              <div>
                <h3 className="font-semibold text-white mb-4">Appearance</h3>
                <Card className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">Dark Mode</div>
                      <div className="text-sm text-white/70">Switch between light and dark themes</div>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={toggleTheme}
                      data-testid="switch-theme"
                    />
                  </div>
                </Card>
              </div>

              {/* Notifications */}
              <div>
                <h3 className="font-semibold text-white mb-4">Notifications</h3>
                <div className="space-y-3">
                  <Card className="glass rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">Push Notifications</div>
                        <div className="text-sm text-white/70">Receive notifications for important updates</div>
                      </div>
                      <Switch
                        checked={notifications}
                        onCheckedChange={setNotifications}
                        data-testid="switch-notifications"
                      />
                    </div>
                  </Card>
                  
                  <Card className="glass rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">Reading Reminders</div>
                        <div className="text-sm text-white/70">Get reminded to log your blood sugar</div>
                      </div>
                      <Switch
                        checked={reminders}
                        onCheckedChange={setReminders}
                        data-testid="switch-reminders"
                      />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Target Ranges */}
              <div>
                <h3 className="font-semibold text-white mb-4">Target Ranges</h3>
                <Card className="glass rounded-2xl p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white">Normal Range</span>
                      <span className="text-ios-green font-medium">70-140 mg/dL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">Low</span>
                      <span className="text-ios-blue font-medium">&lt; 70 mg/dL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">High</span>
                      <span className="text-ios-red font-medium">&gt; 140 mg/dL</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Data Management */}
              <div>
                <h3 className="font-semibold text-white mb-4">Data Management</h3>
                <div className="space-y-3">
                  <Button
                    onClick={exportData}
                    className="w-full ios-button bg-ios-blue text-white rounded-2xl py-4"
                    data-testid="button-export"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Export Data
                  </Button>
                  
                  <Button
                    onClick={clearData}
                    variant="destructive"
                    className="w-full ios-button bg-ios-red text-white rounded-2xl py-4"
                    data-testid="button-clear"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Clear All Data
                  </Button>
                </div>
              </div>

              {/* About */}
              <div>
                <h3 className="font-semibold text-white mb-4">About</h3>
                <Card className="glass rounded-2xl p-4">
                  <div className="text-center">
                    <h4 className="font-bold text-xl text-white mb-2">Ander</h4>
                    <p className="text-white/70 mb-2">Blood Sugar Tracker</p>
                    <p className="text-sm text-white/50">Version 1.0.0</p>
                    <p className="text-xs text-white/40 mt-4">
                      Designed for gestational diabetes management
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
