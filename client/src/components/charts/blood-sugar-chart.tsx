import { useQuery } from "@tanstack/react-query";
import type { BloodSugarReading } from "@shared/schema";
import { format, subDays, startOfDay } from "date-fns";

export default function BloodSugarChart() {
  const { data: readings = [], isLoading } = useQuery<BloodSugarReading[]>({
    queryKey: ["/api/blood-sugar-readings"],
  });

  // Get last 7 days of data
  const last7Days = readings.filter(reading => {
    const readingDate = new Date(reading.timestamp);
    const sevenDaysAgo = subDays(new Date(), 7);
    return readingDate >= sevenDaysAgo;
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/blood-sugar-stats"],
  });

  if (isLoading) {
    return (
      <section className="px-4 mb-6">
        <div className="glass-strong rounded-3xl p-6">
          <div className="h-6 bg-glass-white rounded mb-4 w-1/2 animate-pulse" />
          <div className="bg-glass-white rounded-2xl min-h-[200px] animate-pulse" />
        </div>
      </section>
    );
  }

  // Calculate trend
  const getTrend = () => {
    if (last7Days.length < 2) return "→";
    const recent = last7Days.slice(0, 3);
    const older = last7Days.slice(3, 6);
    
    const recentAvg = recent.reduce((sum, r) => sum + parseFloat(r.bloodSugar), 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + parseFloat(r.bloodSugar), 0) / older.length;
    
    if (recentAvg > olderAvg + 5) return "↗";
    if (recentAvg < olderAvg - 5) return "↘";
    return "→";
  };

  return (
    <section className="px-4 mb-6">
      <div className="glass-strong rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <i className="fas fa-chart-line text-ios-blue mr-3"></i>
          Today's Trends
        </h2>
        
        {/* Chart placeholder with data visualization */}
        <div className="bg-gradient-to-br from-ios-purple/10 to-ios-blue/10 rounded-2xl p-6 mb-4">
          {readings.length === 0 ? (
            <div className="text-center min-h-[200px] flex flex-col items-center justify-center">
              <i className="fas fa-chart-area text-4xl text-white/50 mb-2"></i>
              <div className="text-white/70">Blood Sugar Chart</div>
              <div className="text-sm text-white/50">Start logging readings to see trends</div>
            </div>
          ) : (
            <div className="min-h-[200px] flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-2">
                  {last7Days.length} readings
                </div>
                <div className="text-sm text-white/70">Last 7 days</div>
              </div>
              
              {/* Simple data visualization */}
              <div className="flex items-end justify-center space-x-2 h-24">
                {last7Days.slice(0, 7).reverse().map((reading, index) => {
                  const value = parseFloat(reading.bloodSugar);
                  const height = Math.max(10, (value / 200) * 100); // Scale to percentage
                  const color = value >= 70 && value <= 140 
                    ? 'bg-ios-green' 
                    : value < 70 
                      ? 'bg-ios-blue' 
                      : 'bg-ios-red';
                  
                  return (
                    <div
                      key={reading.id}
                      className={`${color} rounded-t opacity-80 w-6 flex items-end justify-center relative group`}
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick insights */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-ios-green" data-testid="text-trend">
              {getTrend()}
            </div>
            <div className="text-xs text-white/70">Trend</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-ios-blue" data-testid="text-readings-count">
              {last7Days.length}
            </div>
            <div className="text-xs text-white/70">Readings</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-ios-orange" data-testid="text-in-range">
              {stats?.inRangePercentage?.toFixed(0) || 0}%
            </div>
            <div className="text-xs text-white/70">In Range</div>
          </div>
        </div>
      </div>
    </section>
  );
}
