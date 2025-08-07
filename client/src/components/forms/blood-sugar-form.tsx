import { uploadToSupabase } from "@/utils/uploadToSupabase";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertBloodSugarReadingSchema, type InsertBloodSugarReading } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useHaptic } from "@/hooks/use-haptic";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

export default function BloodSugarForm() {
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");
  const [selectedActivity, setSelectedActivity] = useState<string>("moderate");
  const [mealImage, setMealImage] = useState<File | null>(null);
  const [carbsValue, setCarbsValue] = useState(45);
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

      let mealImageUrl = null;

      // ✅ Upload image to Supabase Storage if present
      if (data.mealImage) {
        const filePath = `user-${user.id}/${Date.now()}-${data.mealImage.name}`;

        const { error: uploadError } = await supabase.storage
          .from("meal-photos")
          .upload(filePath, data.mealImage);

        if (uploadError) {
          console.error("❌ Failed to upload image:", uploadError.message);
          throw new Error("Failed to upload meal photo.");
        }

        const { data: publicUrlData } = supabase.storage
          .from("meal-photos")
          .getPublicUrl(filePath);

        mealImageUrl = publicUrlData.publicUrl;
      }

      // ✅ Insert reading including image URL
      const { error } = await supabase.from("readings").insert([
        {
          blood_sugar: data.bloodSugar,
          meal: data.mealType,
          carbs: data.carbs, // You can leave or remove this field if deprecated
          activity_level: data.activityLevel,
          notes: data.notes,
          timestamp: new Date().toISOString(),
          user_id: user.id,
          meal_image_url: mealImageUrl, // ✅ New field
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }
    },

    onSuccess: () => {
      toast.success("✅ Reading logged successfully!");
      triggerHaptic("heavy");
      queryClient.invalidateQueries({ queryKey: ["/api/blood-sugar-readings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blood-sugar-stats"] });
      form.reset();
    },

    onError: (error: any) => {
      console.error("❌ Insert failed:", error.message);
      triggerHaptic("medium");
      toast.error(`❌ ${error.message || "Failed to save reading."}`);
    },
  });


  const onSubmit = (data: InsertBloodSugarReading) => {
    triggerHaptic("medium");
    createReadingMutation.mutate({
      ...data,
      mealType: selectedMealType as any,
      activityLevel: selectedActivity as any,
      carbs: carbsValue,
      mealImage: mealImage, // ✅ add this
    });
  };

  const mealTypes = [
     { value: "fasted", icon: "fa-cookie-bite", color: "text-ios-orange", label: "Fasted" },
    { value: "breakfast", icon: "fa-sun", color: "text-ios-orange", label: "Breakfast" },
    { value: "lunch", icon: "fa-sun", color: "text-yellow-400", label: "Lunch" },
    { value: "dinner", icon: "fa-moon", color: "text-ios-purple", label: "Dinner" },
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
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Meal Type">
                  {mealTypes.map((meal) => {
                    const isSelected = selectedMealType === meal.value;

                    return (
                      <button
                        key={meal.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={`ios-button glass text-center py-4 rounded-2xl relative font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-green-500/30 border-4 border-green-500 ring-4 ring-green-400/30 shadow-lg'
                            : 'bg-white/10 border border-white/10 opacity-80 hover:opacity-100'
                        }`}
                        onClick={() => {
                          setSelectedMealType(meal.value);
                          triggerHaptic("light");
                        }}
                      >
                        <i className={`fas ${meal.icon} ${meal.color} mb-1 text-xl`}></i>
                        <div className="text-sm">{meal.label}</div>

                        {isSelected && (
                          <span className="absolute top-2 right-2 text-green-500">
                            <i className="fas fa-check-circle" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Activity level */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">Activity Level</label>
                <div className="flex space-x-2" role="radiogroup" aria-label="Activity Level">
                  {activityLevels.map((activity) => {
                    const isSelected = selectedActivity === activity.value;

                    return (
                      <button
                        key={activity.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={`ios-button glass flex-1 text-center py-4 rounded-2xl relative font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-green-500/30 border-4 border-green-500 ring-4 ring-green-400/30 shadow-lg'
                            : 'bg-white/10 border border-white/10 opacity-80 hover:opacity-100'
                        }`}
                        onClick={() => {
                          setSelectedActivity(activity.value);
                          triggerHaptic("light");
                        }}
                      >
                        <i className={`fas ${activity.icon} ${activity.color} mb-1 text-lg`}></i>
                        <div className="text-xs">{activity.label}</div>

                        {isSelected && (
                          <span className="absolute top-2 right-2 text-green-500">
                            <i className="fas fa-check-circle" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Upload photo */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Upload Meal Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMealImage(e.target.files?.[0] || null)}
                  className="block w-full text-white bg-transparent file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0 file:text-sm file:font-semibold
                             file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                />
                {mealImage && (
                  <div className="mt-2">
                    <p className="text-white/70 text-sm mb-1">Preview:</p>
                    <img
                      src={URL.createObjectURL(mealImage)}
                      alt="Meal Preview"
                      className="w-full rounded-xl max-h-60 object-cover border border-white/20"
                    />
                  </div>
                )}
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
