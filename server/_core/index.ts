import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter, startScheduledFetchRunner, startDailyReportScheduler, startWeeklyReportScheduler } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Storage proxy for /manus-storage/* paths
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Resume PDF download endpoint
  app.get("/api/resume/download/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      if (isNaN(jobId)) {
        res.status(400).send("Invalid job ID");
        return;
      }
      // Import getJobById dynamically to avoid circular deps
      const { getJobById } = await import("../db");
      const job = await getJobById(jobId);
      if (!job || !job.resumeGeneratedPath) {
        res.status(404).send("Resume not found");
        return;
      }
      // If it's a URL (S3), redirect to it
      if (job.resumeGeneratedPath.startsWith("http")) {
        res.redirect(job.resumeGeneratedPath);
        return;
      }
      // Otherwise serve the local file
      const fs = await import("fs");
      const path = await import("path");
      const filePath = job.resumeGeneratedPath;
      if (!fs.existsSync(filePath)) {
        res.status(404).send("Resume file not found on disk");
        return;
      }
      const companyClean = job.company.trim().replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 40);
      const fileName = `${companyClean}_AlanAbbas.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", fs.statSync(filePath).size.toString());
      fs.createReadStream(filePath).pipe(res);
    } catch (err: any) {
      console.error("[Resume Download] Error:", err);
      res.status(500).send("Internal server error");
    }
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start the scheduled fetch runner after server is up
    startScheduledFetchRunner();
    console.log("[Scheduler] Scheduled fetch runner started (checks every 5 minutes)");
    startDailyReportScheduler();
    startWeeklyReportScheduler();

  });
}

startServer().catch(console.error);
