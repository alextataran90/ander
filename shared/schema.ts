import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const mealTypeEnum = pgEnum("meal_type", ["breakfast", "lunch", "dinner", "snack"]);
export const activityLevelEnum = pgEnum("activity_level", ["low", "moderate", "high"]);

export const bloodSugarReadings = pgTable("blood_sugar_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bloodSugar: decimal("blood_sugar", { precision: 5, scale: 1 }).notNull(),
  mealType: mealTypeEnum("meal_type").notNull(),
  carbs: integer("carbs").notNull(),
  activityLevel: activityLevelEnum("activity_level").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  notes: text("notes"),
});

export const insertBloodSugarReadingSchema = createInsertSchema(bloodSugarReadings, {
  bloodSugar: z.coerce.number().min(50, "Blood sugar must be at least 50 mg/dL").max(500, "Blood sugar must be less than 500 mg/dL"),
  carbs: z.coerce.number().min(0, "Carbs must be at least 0g").max(150, "Carbs must be less than 150g"),
  notes: z.string().optional(),
}).omit({
  id: true,
  timestamp: true,
});

export type InsertBloodSugarReading = z.infer<typeof insertBloodSugarReadingSchema>;
export type BloodSugarReading = typeof bloodSugarReadings.$inferSelect;
