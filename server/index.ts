import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { registerRoutes } from "./routes";
import emailReportRouter from "./email-report";
import { log } from "./vite"; // keep your logger

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// Register email report route first
app.use(emailReportRouter);

// --- simple API logger (unchanged) ---
app.use((req, res, next) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  (res as any).json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathName.startsWith("/api")) {
      let logLine = `${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register API routes and get the HTTP server instance
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  const isDev = app.get("env") === "development";

  if (isDev) {
    // =========================
    // DEV: Vite middleware mode
    // =========================
    const clientRoot = path.resolve(__dirname, "..", "client");

    const vite = await createViteServer({
      root: clientRoot,                              // <-- CRITICAL
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "custom",
    });

    // Let Vite handle HMR, assets, and transforms
    app.use(vite.middlewares);

    // SPA fallback (all non-API routes) -> client/index.html transformed by Vite
    app.use(async (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      try {
        const indexPath = path.join(clientRoot, "index.html");
        let html = await fs.promises.readFile(indexPath, "utf-8");
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.setHeader("Content-Type", "text/html");
        res.status(200).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    // =========================
    // PROD: serve built assets
    // =========================
    // Matches your vite.config.ts: outDir = dist/public
    const staticDir = path.resolve(__dirname, "..", "dist", "public");
    app.use(express.static(staticDir));

    // SPA fallback for non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  // Serve on PORT (Replit firewall allows only this)
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`[express] serving on port ${port}`);
    }
  );
})();
