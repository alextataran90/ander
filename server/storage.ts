import { type BloodSugarReading, type InsertBloodSugarReading } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getBloodSugarReadings(): Promise<BloodSugarReading[]>;
  getBloodSugarReading(id: string): Promise<BloodSugarReading | undefined>;
  createBloodSugarReading(reading: InsertBloodSugarReading): Promise<BloodSugarReading>;
  updateBloodSugarReading(id: string, reading: Partial<InsertBloodSugarReading>): Promise<BloodSugarReading | undefined>;
  deleteBloodSugarReading(id: string): Promise<boolean>;
  getBloodSugarReadingsByDateRange(startDate: Date, endDate: Date): Promise<BloodSugarReading[]>;
  getBloodSugarStats(): Promise<{
    lastReading: number | null;
    avgToday: number | null;
    totalReadings: number;
    inRangePercentage: number;
  }>;
}

export class MemStorage implements IStorage {
  private readings: Map<string, BloodSugarReading>;

  constructor() {
    this.readings = new Map();
  }

  async getBloodSugarReadings(): Promise<BloodSugarReading[]> {
    return Array.from(this.readings.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getBloodSugarReading(id: string): Promise<BloodSugarReading | undefined> {
    return this.readings.get(id);
  }

  async createBloodSugarReading(insertReading: InsertBloodSugarReading): Promise<BloodSugarReading> {
    const id = randomUUID();
    const reading: BloodSugarReading = {
      ...insertReading,
      id,
      timestamp: new Date(),
      bloodSugar: insertReading.bloodSugar.toString(),
    };
    this.readings.set(id, reading);
    return reading;
  }

  async updateBloodSugarReading(id: string, updateData: Partial<InsertBloodSugarReading>): Promise<BloodSugarReading | undefined> {
    const existing = this.readings.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updateData };
    if (updateData.bloodSugar) {
      updated.bloodSugar = updateData.bloodSugar.toString();
    }
    this.readings.set(id, updated);
    return updated;
  }

  async deleteBloodSugarReading(id: string): Promise<boolean> {
    return this.readings.delete(id);
  }

  async getBloodSugarReadingsByDateRange(startDate: Date, endDate: Date): Promise<BloodSugarReading[]> {
    const readings = await this.getBloodSugarReadings();
    return readings.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      return readingDate >= startDate && readingDate <= endDate;
    });
  }

  async getBloodSugarStats(): Promise<{
    lastReading: number | null;
    avgToday: number | null;
    totalReadings: number;
    inRangePercentage: number;
  }> {
    const readings = await this.getBloodSugarReadings();
    
    if (readings.length === 0) {
      return {
        lastReading: null,
        avgToday: null,
        totalReadings: 0,
        inRangePercentage: 0,
      };
    }

    const lastReading = parseFloat(readings[0].bloodSugar);
    
    // Get today's readings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const todayReadings = readings.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      return readingDate >= today && readingDate < tomorrow;
    });

    const avgToday = todayReadings.length > 0
      ? todayReadings.reduce((sum, reading) => sum + parseFloat(reading.bloodSugar), 0) / todayReadings.length
      : null;

    // Calculate in-range percentage (70-140 mg/dL for gestational diabetes)
    const inRange = readings.filter(reading => {
      const value = parseFloat(reading.bloodSugar);
      return value >= 70 && value <= 140;
    }).length;
    
    const inRangePercentage = (inRange / readings.length) * 100;

    return {
      lastReading,
      avgToday,
      totalReadings: readings.length,
      inRangePercentage,
    };
  }
}

export const storage = new MemStorage();
