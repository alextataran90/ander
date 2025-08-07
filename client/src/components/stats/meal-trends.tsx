type Reading = {
  blood_sugar: number;
  timestamp: string;
  meal: string;
};

interface MealTrendsProps {
  readings: Reading[];
}

interface MealStats {
  meal: string;
  average: number;
  lowest: number;
  highest: number;
}

export default function MealTrends({ readings }: MealTrendsProps) {
  const past7Days = new Date();
  past7Days.setDate(past7Days.getDate() - 6); // Include today

  const filtered = readings.filter((r) => new Date(r.timestamp) >= past7Days);

  const meals = ["breakfast", "lunch", "dinner", "fasted"];

  const stats: MealStats[] = meals.map((meal) => {
    const mealReadings = filtered.filter((r) => r.meal === meal);
    const values = mealReadings.map((r) => r.blood_sugar);
    const total = values.reduce((acc, v) => acc + v, 0);
    const average = values.length ? total / values.length : 0;
    const lowest = values.length ? Math.min(...values) : 0;
    const highest = values.length ? Math.max(...values) : 0;

    return {
      meal,
      average,
      lowest,
      highest,
    };
  });

  return (
    <section className="px-4 mb-6">
      <div className="glass rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-4 text-white/90">
          7-Day Meal Averages
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.meal}
              className="glass rounded-xl p-4 text-sm text-white/80"
            >
              <div className="text-white font-semibold capitalize mb-2">
                {stat.meal}
              </div>
              <div className="flex justify-between">
                <span>Avg:</span>
                <span>
                  {stat.average > 0 ? stat.average.toFixed(1) : "--"} mg/dL
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min:</span>
                <span>{stat.lowest > 0 ? stat.lowest : "--"} mg/dL</span>
              </div>
              <div className="flex justify-between">
                <span>Max:</span>
                <span>{stat.highest > 0 ? stat.highest : "--"} mg/dL</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
