import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import QuickStats from "@/components/stats/quick-stats";
import BloodSugarForm from "@/components/forms/blood-sugar-form";
import BloodSugarChart from "@/components/charts/blood-sugar-chart";
import RecentEntries from "@/components/entries/recent-entries";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <QuickStats />
      <BloodSugarForm />
      <BloodSugarChart />
      <RecentEntries />
      <BottomNav />
    </div>
  );
}
