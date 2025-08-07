type Reading = {
  blood_sugar: number;
  timestamp: string;
};

interface QuickStatsProps {
  readings: Reading[];
}

export default function QuickStats({ readings }: QuickStatsProps) {
  if (!readings || readings.length === 0) {
    return (
      <section className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-ios-green">--</div>
            <div className="text-sm text-white/70">Last Reading</div>
            <div className="text-xs text-white/50">mg/dL</div>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-ios-blue">--</div>
            <div className="text-sm text-white/70">Today's Avg</div>
            <div className="text-xs text-white/50">mg/dL</div>
          </div>
        </div>
      </section>
    );
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const lastReading = sorted[0]?.blood_sugar;

  const today = new Date().toISOString().slice(0, 10);
  const todaysReadings = sorted.filter((r) => r.timestamp.startsWith(today));
  const avgToday =
    todaysReadings.reduce((acc, r) => acc + r.blood_sugar, 0) /
    (todaysReadings.length || 1);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().slice(0, 10);
  const yesterdaysReadings = sorted.filter((r) => r.timestamp.startsWith(yesterdayISO));
  const avgYesterday =
    yesterdaysReadings.reduce((acc, r) => acc + r.blood_sugar, 0) /
    (yesterdaysReadings.length || 1);

  const delta = avgToday - avgYesterday;

  return (
    <section className="px-4 mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-ios-green" data-testid="stat-last-reading">
            {lastReading.toFixed(0)}
          </div>
          <div className="text-sm text-white/70">Last Reading</div>
          <div className="text-xs text-white/50">mg/dL</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-3xl font-bold" data-testid="stat-avg-today">
            <span className="text-ios-blue">{avgToday.toFixed(0)}</span>
            {delta !== 0 && (
              <span className={`text-sm font-medium ${delta < 0 ? "text-green-400" : "text-red-400"}`}>
                {delta < 0 ? "⬇" : "⬆"} {Math.abs(delta).toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-sm text-white/70">Today's Avg</div>
          <div className="text-xs text-white/50">mg/dL</div>
        </div>
      </div>
    </section>
  );
}
