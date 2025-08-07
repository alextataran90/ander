import { useUserReadings } from "@/hooks/use-readings";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import QuickStats from "@/components/stats/quick-stats";
import MealTrends from "@/components/stats/meal-trends";
import BloodSugarForm from "@/components/forms/blood-sugar-form";
import BloodSugarChart from "@/components/charts/blood-sugar-chart";
import RecentEntries from "@/components/entries/recent-entries";

export default function Home() {
  const { data: readings, isLoading, isError } = useUserReadings();

  if (isLoading) return <p className="text-center mt-10">Loading...</p>;
  if (isError) return <p className="text-center mt-10 text-red-500">Failed to load readings.</p>;

  return (
    <div className="min-h-screen">
      <Header />
       <QuickStats readings={readings} />
      {/* 1️⃣ Blood Sugar Form and Stats */}
      <BloodSugarForm />
     
      {/* 2️⃣ Meal Trends */}
      <MealTrends readings={readings || []} />

      <BottomNav />
    </div>
  );
}
