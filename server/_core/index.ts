import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
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
  
  // Resume download endpoint
  app.get("/api/resume/download/:jobId", (req, res) => {
    try {
      const jobId = req.params.jobId;
      const fs = require("fs");
      const path = require("path");
      
      const resumeDir = "/home/ubuntu/projects/1000jobs-main-folder-8ad188bd/tailored_resumes";
      
      // List all files in the directory
      const files = fs.readdirSync(resumeDir);
      
      // Find the PDF file (there should be one per job, but we'll get the first match)
      // For now, just return the first PDF we find for this job
      const pdfFile = files.find((f: string) => f.endsWith(".pdf"));
      
      if (!pdfFile) {
        return res.status(404).json({ error: "Resume not found" });
      }
      
      const filePath = path.join(resumeDir, pdfFile);
      
      // Set headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${pdfFile}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on("error", (err: Error) => {
        console.error("Error streaming resume:", err);
        res.status(500).json({ error: "Error downloading resume" });
      });
    } catch (error) {
      console.error("Resume download error:", error);
      res.status(500).json({ error: "Error downloading resume" });
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
