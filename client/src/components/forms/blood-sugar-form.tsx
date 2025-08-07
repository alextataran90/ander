import { supabase } from "@/supabaseClient";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertBloodSugarReadingSchema, type InsertBloodSugarReading } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useHaptic } from "@/hooks/use-haptic";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

export default function BloodSugarForm() {
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");
  const [selectedActivity, setSelectedActivity] = useState<string>("moderate");
  const [carbsValue, setCarbsValue] = useState(45);
  const { toast } = useToast();
  const { triggerHaptic } = useHaptic();
  const queryClient = useQueryClient();

  const form = useForm<InsertBloodSugarReading>({
    resolver: zodResolver(insertBloodSugarReadingSchema),
    defaultValues: {
      bloodSugar: 120,
      mealType: "breakfast",
      carbs: 45,
      activityLevel: "moderate",
      notes: "",
    },
  });

  const createReadingMutation = useMutation({
    mutationFn: async (data: InsertBloodSugarReading) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated.");
      }

      console.log("📤 Sending to Supabase:", data);

      const { error } = await supabase.from("readings").insert([
        {
          blood_sugar: data.bloodSugar,
          meal: data.mealType,
          carbs: data.carbs,
          activity_level: data.activityLevel,
          notes: data.notes,
          timestamp: new Date().toISOString(),
          user_id: user.id, // ✅ Attach user_id
        },
      ]);

      if (error) {
        console.error("🔥 Supabase insert error:", error);
        throw new Error(error.message);
      }

      console.log("✅ Supabase insert success");
    }

  });


  const onSubmit = (data: InsertBloodSugarReading) => {
    triggerHaptic("medium");
    createReadingMutation.mutate({
      ...data,
      mealType: selectedMealType as any,
      activityLevel: selectedActivity as any,
      carbs: carbsValue,
    });
  };

  const mealTypes = [
    { value: "breakfast", icon: "fa-sun", color: "text-ios-orange", label: "Breakfast" },
    { value: "lunch", icon: "fa-sun", color: "text-yellow-400", label: "Lunch" },
    { value: "dinner", icon: "fa-moon", color: "text-ios-purple", label: "Dinner" },
    { value: "snack", icon: "fa-cookie-bite", color: "text-ios-orange", label: "Snack" },
  ];

  const activityLevels = [
    { value: "low", icon: "fa-bed", color: "text-ios-blue", label: "Low" },
    { value: "moderate", icon: "fa-walking", color: "text-ios-green", label: "Moderate" },
    { value: "high", icon: "fa-running", color: "text-ios-orange", label: "High" },
  ];

  return (
    <>
      <section className="px-4 mb-6">
        <div className="glass-strong rounded-3xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <i className="fas fa-tint text-ios-red mr-3"></i>
            Blood Sugar Reading
          </h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Blood sugar input */}
              <FormField
                control={form.control}
                name="bloodSugar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-white/80 mb-2">
                      Reading (mg/dL)
                    </FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        className="ios-input w-full text-2xl text-center font-bold"
                        placeholder="120"
                        min="50"
                        max="500"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-blood-sugar"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Meal type selection */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">Meal Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {mealTypes.map((meal) => (
                    <button
                      key={meal.value}
                      type="button"
                      className={`ios-button glass text-center py-3 rounded-xl transition-all ${
                        selectedMealType === meal.value 
                          ? 'bg-glass-white-strong border-ios-blue' 
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedMealType(meal.value);
                        triggerHaptic("light");
                      }}
                      data-testid={`button-meal-${meal.value}`}
                    >
                      <i className={`fas ${meal.icon} ${meal.color} mb-1`}></i>
                      <div className="text-sm">{meal.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Carbohydrate count */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Carbohydrates (g)
                </label>
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold" data-testid="text-carbs-value">
                      {carbsValue}
                    </span>
                    <span className="text-sm text-white/70">grams</span>
                  </div>
                  <input
                    type="range"
                    className="ios-range w-full"
                    min="0"
                    max="150"
                    value={carbsValue}
                    onChange={(e) => {
                      setCarbsValue(Number(e.target.value));
                      triggerHaptic("light");
                    }}
                    data-testid="slider-carbs"
                  />
                </div>
              </div>

              {/* Activity level */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">Activity Level</label>
                <div className="flex space-x-2">
                  {activityLevels.map((activity) => (
                    <button
                      key={activity.value}
                      type="button"
                      className={`ios-button glass flex-1 text-center py-3 rounded-xl transition-all ${
                        selectedActivity === activity.value 
                          ? 'bg-glass-white-strong border-ios-blue' 
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedActivity(activity.value);
                        triggerHaptic("light");
                      }}
                      data-testid={`button-activity-${activity.value}`}
                    >
                      <i className={`fas ${activity.icon} ${activity.color} mb-1`}></i>
                      <div className="text-xs">{activity.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={createReadingMutation.isPending}
                className="ios-button w-full bg-ios-blue text-white rounded-2xl py-4 mt-6 font-semibold text-lg disabled:opacity-50"
                data-testid="button-submit-reading"
              >
                <i className="fas fa-plus mr-2"></i>
                {createReadingMutation.isPending ? "Saving..." : "Log Reading"}
              </Button>
            </form>
          </Form>
        </div>
      </section>

      <LoadingOverlay isVisible={createReadingMutation.isPending} />
    </>
  );
}
