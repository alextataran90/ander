// src/hooks/use-meal-trends.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";

type MealStats = {
  meal: string;
  average: number | null;
  lowest: number | null;
  highest: number | null;
};

export const useMealTrends = () => {
  return useQuery({
    queryKey: ["meal-trends"],
    queryFn: async (): Promise<MealStats[]> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 7);

      const { data, error } = await supabase
        .from("readings")
        .select("blood_sugar, meal, timestamp")
        .eq("user_id", user.id)
        .gte("timestamp", sinceDate.toISOString());

      if (error) throw new Error(error.message);

      const grouped: Record<string, number[]> = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      };

      for (const entry of data) {
        const meal = entry.meal?.toLowerCase();
        if (grouped[meal]) {
          grouped[meal].push(entry.blood_sugar);
        }
      }

      return Object.entries(grouped).map(([meal, values]) => ({
        meal,
        average: values.length
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null,
        lowest: values.length ? Math.min(...values) : null,
        highest: values.length ? Math.max(...values) : null,
      }));
    },
  });
};
