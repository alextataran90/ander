import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";

export const useUserReadings = () => {
  return useQuery({
    queryKey: ["user-readings"],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("readings")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
