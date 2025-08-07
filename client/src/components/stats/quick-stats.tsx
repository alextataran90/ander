import { useQuery } from "@tanstack/react-query";

export default function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/blood-sugar-stats"],
  });

  if (isLoading) {
    return (
      <section className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-4 text-center animate-pulse">
            <div className="h-8 bg-glass-white rounded mb-2" />
            <div className="h-4 bg-glass-white rounded" />
          </div>
          <div className="glass rounded-2xl p-4 text-center animate-pulse">
            <div className="h-8 bg-glass-white rounded mb-2" />
            <div className="h-4 bg-glass-white rounded" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-ios-green" data-testid="stat-last-reading">
            {stats?.lastReading?.toFixed(0) || "--"}
          </div>
          <div className="text-sm text-white/70">Last Reading</div>
          <div className="text-xs text-white/50">mg/dL</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-ios-blue" data-testid="stat-avg-today">
            {stats?.avgToday?.toFixed(0) || "--"}
          </div>
          <div className="text-sm text-white/70">Today's Avg</div>
          <div className="text-xs text-white/50">mg/dL</div>
        </div>
      </div>
    </section>
  );
}
