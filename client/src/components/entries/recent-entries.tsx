import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { BloodSugarReading } from "@shared/schema";
import { Link } from "wouter";

export default function RecentEntries() {
  const { data: readings = [], isLoading } = useQuery<BloodSugarReading[]>({
    queryKey: ["/api/blood-sugar-readings"],
  });

  const recentReadings = readings.slice(0, 3); // Show only 3 most recent

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case "breakfast": return "fa-sun text-ios-orange";
      case "lunch": return "fa-sun text-yellow-400";
      case "dinner": return "fa-moon text-ios-purple";
      case "snack": return "fa-cookie-bite text-ios-orange";
      default: return "fa-utensils text-white";
    }
  };

  const getReadingColor = (value: number) => {
    if (value < 70) return "text-ios-blue";
    if (value > 140) return "text-ios-red";
    return "text-ios-green";
  };

  if (isLoading) {
    return (
      <section className="px-4 mb-6">
        <div className="glass-strong rounded-3xl p-6">
          <div className="h-6 bg-glass-white rounded mb-4 w-1/3 animate-pulse" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-glass-white rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-glass-white rounded mb-2" />
                    <div className="h-3 bg-glass-white rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      <div className="glass-strong rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <i className="fas fa-history text-ios-purple mr-3"></i>
            Recent Entries
          </h2>
          <Link href="/history">
            <button className="text-ios-blue text-sm font-medium" data-testid="button-view-all">
              View All
            </button>
          </Link>
        </div>

        {recentReadings.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-clipboard-list text-4xl text-white/30 mb-4"></i>
            <p className="text-white/70">No readings yet</p>
            <p className="text-sm text-white/50 mt-2">Log your first blood sugar reading above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReadings.map((reading) => (
              <div 
                key={reading.id} 
                className="glass rounded-2xl p-4 flex items-center justify-between"
                data-testid={`recent-entry-${reading.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-glass-white rounded-full flex items-center justify-center">
                    <i className={`fas ${getMealIcon(reading.mealType)}`}></i>
                  </div>
                  <div>
                    <div className={`font-semibold ${getReadingColor(parseFloat(reading.bloodSugar))}`}>
                      {reading.bloodSugar} mg/dL
                    </div>
                    <div className="text-sm text-white/70">
                      {format(new Date(reading.timestamp), "h:mm a")} • {reading.mealType}
                    </div>
                  </div>
                </div>
                <button 
                  className="text-ios-blue hover:text-ios-blue/80 transition-colors"
                  data-testid={`button-view-entry-${reading.id}`}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
