import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { BloodSugarReading } from "@shared/schema";
import { Card } from "@/components/ui/card";

export default function History() {
  const { data: readings = [], isLoading } = useQuery<BloodSugarReading[]>({
    queryKey: ["/api/blood-sugar-readings"],
  });

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
      <div className="min-h-screen">
        <Header />
        <div className="px-4 py-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="glass rounded-2xl p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-glass-white rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-glass-white rounded mb-2" />
                    <div className="h-3 bg-glass-white rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="px-4 py-6">
        <section className="mb-6">
          <div className="glass-strong rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <i className="fas fa-history text-ios-purple mr-3"></i>
              All Entries
            </h2>

            {readings.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-chart-line text-4xl text-white/30 mb-4"></i>
                <p className="text-white/70">No readings recorded yet</p>
                <p className="text-sm text-white/50 mt-2">Start tracking your blood sugar to see your history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {readings.map((reading) => (
                  <div 
                    key={reading.id} 
                    className="glass rounded-2xl p-4 flex items-center justify-between"
                    data-testid={`entry-${reading.id}`}
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
                          {format(new Date(reading.timestamp), "MMM d, h:mm a")} • {reading.mealType}
                        </div>
                        <div className="text-xs text-white/50">
                          {reading.carbs}g carbs • {reading.activityLevel} activity
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <button 
                        className="text-ios-blue hover:text-ios-blue/80 transition-colors"
                        data-testid={`button-view-${reading.id}`}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
