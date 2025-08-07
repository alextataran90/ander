import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBloodSugarReadingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all blood sugar readings
  app.get("/api/blood-sugar-readings", async (_req, res) => {
    try {
      const readings = await storage.getBloodSugarReadings();
      res.json(readings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch readings" });
    }
  });

  // Get a specific blood sugar reading
  app.get("/api/blood-sugar-readings/:id", async (req, res) => {
    try {
      const reading = await storage.getBloodSugarReading(req.params.id);
      if (!reading) {
        return res.status(404).json({ message: "Reading not found" });
      }
      res.json(reading);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reading" });
    }
  });

  // Create a new blood sugar reading
  app.post("/api/blood-sugar-readings", async (req, res) => {
    try {
      const validatedData = insertBloodSugarReadingSchema.parse(req.body);
      const reading = await storage.createBloodSugarReading(validatedData);
      res.status(201).json(reading);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create reading" });
    }
  });

  // Update a blood sugar reading
  app.patch("/api/blood-sugar-readings/:id", async (req, res) => {
    try {
      const validatedData = insertBloodSugarReadingSchema.partial().parse(req.body);
      const reading = await storage.updateBloodSugarReading(req.params.id, validatedData);
      if (!reading) {
        return res.status(404).json({ message: "Reading not found" });
      }
      res.json(reading);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update reading" });
    }
  });

  // Delete a blood sugar reading
  app.delete("/api/blood-sugar-readings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBloodSugarReading(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Reading not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reading" });
    }
  });

  // Get blood sugar readings by date range
  app.get("/api/blood-sugar-readings/range/:startDate/:endDate", async (req, res) => {
    try {
      const startDate = new Date(req.params.startDate);
      const endDate = new Date(req.params.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const readings = await storage.getBloodSugarReadingsByDateRange(startDate, endDate);
      res.json(readings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch readings" });
    }
  });

  // Get blood sugar statistics
  app.get("/api/blood-sugar-stats", async (_req, res) => {
    try {
      const stats = await storage.getBloodSugarStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
