import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { useQuery } from "@tanstack/react-query";
import type { BloodSugarReading } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default function Insights() {
  const { data: readings = [], isLoading } = useQuery<BloodSugarReading[]>({
    queryKey: ["/api/blood-sugar-readings"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/blood-sugar-stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="px-4 py-6">
          <Card className="glass-strong rounded-3xl p-6 animate-pulse">
            <div className="h-6 bg-glass-white rounded mb-6 w-1/3" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-glass-white rounded-2xl" />
              ))}
            </div>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Calculate insights
  const last7Days = readings.filter(reading => {
    const readingDate = new Date(reading.timestamp);
    const sevenDaysAgo = subDays(new Date(), 7);
    return readingDate >= sevenDaysAgo;
  });

  const avgLast7Days = last7Days.length > 0
    ? last7Days.reduce((sum, reading) => sum + parseFloat(reading.bloodSugar), 0) / last7Days.length
    : 0;

  const highReadings = readings.filter(reading => parseFloat(reading.bloodSugar) > 140).length;
  const lowReadings = readings.filter(reading => parseFloat(reading.bloodSugar) < 70).length;

  // Meal type analysis
  const mealAnalysis = readings.reduce((acc, reading) => {
    const mealType = reading.mealType;
    if (!acc[mealType]) {
      acc[mealType] = { count: 0, total: 0 };
    }
    acc[mealType].count++;
    acc[mealType].total += parseFloat(reading.bloodSugar);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const bestMeal = Object.entries(mealAnalysis).reduce((best, [meal, data]) => {
    const avg = data.total / data.count;
    if (!best || (avg >= 70 && avg <= 140 && (best.avg < 70 || best.avg > 140 || avg > best.avg))) {
      return { meal, avg };
    }
    return best;
  }, null as { meal: string; avg: number } | null);

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="px-4 py-6">
        <section className="mb-6">
          <div className="glass-strong rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <i className="fas fa-brain text-ios-purple mr-3"></i>
              Insights & Trends
            </h2>

            {readings.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-lightbulb text-4xl text-white/30 mb-4"></i>
                <p className="text-white/70">Not enough data for insights</p>
                <p className="text-sm text-white/50 mt-2">Record more readings to see personalized insights</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 7-Day Average */}
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">7-Day Average</h3>
                      <p className="text-sm text-white/70">Recent blood sugar trend</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${avgLast7Days >= 70 && avgLast7Days <= 140 ? 'text-ios-green' : 'text-ios-orange'}`}>
                        {avgLast7Days.toFixed(1)}
                      </div>
                      <div className="text-xs text-white/50">mg/dL</div>
                    </div>
                  </div>
                </div>

                {/* Reading Distribution */}
                <div className="glass rounded-2xl p-4">
                  <h3 className="font-semibold text-white mb-3">Reading Distribution</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-ios-blue">{lowReadings}</div>
                      <div className="text-xs text-white/70">Low (&lt;70)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-ios-green">
                        {readings.length - highReadings - lowReadings}
                      </div>
                      <div className="text-xs text-white/70">Normal (70-140)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-ios-red">{highReadings}</div>
                      <div className="text-xs text-white/70">High (&gt;140)</div>
                    </div>
                  </div>
                </div>

                {/* Target Range Performance */}
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">Target Range</h3>
                      <p className="text-sm text-white/70">Readings in healthy range</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-ios-green">
                        {stats?.inRangePercentage?.toFixed(0) || 0}%
                      </div>
                      <div className="text-xs text-white/50">of readings</div>
                    </div>
                  </div>
                </div>

                {/* Best Meal Time */}
                {bestMeal && (
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Best Meal Time</h3>
                        <p className="text-sm text-white/70">Most stable readings</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-ios-green capitalize">
                          {bestMeal.meal}
                        </div>
                        <div className="text-xs text-white/50">
                          Avg: {bestMeal.avg.toFixed(1)} mg/dL
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="glass rounded-2xl p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center">
                    <i className="fas fa-lightbulb text-ios-orange mr-2"></i>
                    Recommendations
                  </h3>
                  <div className="space-y-2 text-sm text-white/80">
                    {avgLast7Days > 140 && (
                      <p>• Consider reducing carbohydrate intake or increasing activity level</p>
                    )}
                    {lowReadings > 0 && (
                      <p>• Monitor for low blood sugar symptoms and have quick-acting carbs available</p>
                    )}
                    {stats?.inRangePercentage && stats.inRangePercentage > 80 && (
                      <p>• Great job! Keep up your current routine</p>
                    )}
                    <p>• Aim for 70-140 mg/dL for optimal gestational diabetes management</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
