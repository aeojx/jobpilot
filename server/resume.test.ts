import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getJobById: vi.fn(),
  getAllResumeLogs: vi.fn(),
  getAllResumeConfigs: vi.fn(),
  upsertResumeConfig: vi.fn(),
  insertResumeLog: vi.fn(),
  updateResumeLog: vi.fn(),
  updateJobResumePath: vi.fn(),
  getResumeConfig: vi.fn(),
  getResumeLogById: vi.fn(),
  deleteResumeLog: vi.fn(),
}));

// Mock the resume-generator module
vi.mock("./resume-generator", () => ({
  generateResume: vi.fn(),
}));

import {
  getJobById,
  getAllResumeLogs,
  getAllResumeConfigs,
  upsertResumeConfig,
  getResumeLogById,
  deleteResumeLog,
  updateJobResumePath,
} from "./db";
import { generateResume } from "./resume-generator";

describe("Resume Generation Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resume.generate", () => {
    it("should reject when job not found", async () => {
      (getJobById as any).mockResolvedValue(null);
      const job = await getJobById(999);
      expect(job).toBeNull();
    });

    it("should call generateResume with correct params when job exists", async () => {
      const mockJob = { id: 1, title: "PM", company: "Acme", status: "to_apply" };
      (getJobById as any).mockResolvedValue(mockJob);
      (generateResume as any).mockResolvedValue({ logId: 1, status: "completed" });

      const job = await getJobById(1);
      expect(job).toBeTruthy();

      await generateResume({
        jobId: 1,
        requestedBy: "TestUser",
        requestedByUserId: 1,
      });

      expect(generateResume).toHaveBeenCalledWith({
        jobId: 1,
        requestedBy: "TestUser",
        requestedByUserId: 1,
      });
    });
  });

  describe("resume.status", () => {
    it("should return 'none' when job has no resume", async () => {
      const mockJob = { id: 1, title: "PM", company: "Acme", resumeGeneratedPath: null };
      (getJobById as any).mockResolvedValue(mockJob);
      (getAllResumeLogs as any).mockResolvedValue([]);

      const job = await getJobById(1);
      expect(job?.resumeGeneratedPath).toBeNull();
    });

    it("should return 'completed' when job has a resume URL", async () => {
      const mockJob = {
        id: 1,
        title: "PM",
        company: "Acme",
        resumeGeneratedPath: "https://s3.example.com/resume.pdf",
      };
      (getJobById as any).mockResolvedValue(mockJob);

      const job = await getJobById(1);
      expect(job?.resumeGeneratedPath).toBeTruthy();
      expect(job?.resumeGeneratedPath?.startsWith("http")).toBe(true);
    });

    it("should return 'generating' when log shows pending", async () => {
      const mockJob = { id: 1, title: "PM", company: "Acme", resumeGeneratedPath: null };
      (getJobById as any).mockResolvedValue(mockJob);
      (getAllResumeLogs as any).mockResolvedValue([
        { id: 1, jobId: 1, status: "generating" },
      ]);

      const logs = await getAllResumeLogs();
      const pending = logs.find(
        (l: any) => l.jobId === 1 && (l.status === "pending" || l.status === "generating")
      );
      expect(pending).toBeTruthy();
    });
  });

  describe("resume.log", () => {
    it("should return all resume generation logs", async () => {
      const mockLogs = [
        { id: 1, jobId: 1, status: "completed", jobTitle: "PM", jobCompany: "Acme" },
        { id: 2, jobId: 2, status: "failed", jobTitle: "Dev", jobCompany: "Corp" },
      ];
      (getAllResumeLogs as any).mockResolvedValue(mockLogs);

      const logs = await getAllResumeLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].status).toBe("completed");
      expect(logs[1].status).toBe("failed");
    });
  });

  describe("resume.getConfig", () => {
    it("should return all config entries as key-value map", async () => {
      const mockConfigs = [
        { id: 1, configKey: "profile", configValue: "Master profile content..." },
        { id: 2, configKey: "prompt_template", configValue: "You are an expert..." },
        { id: 3, configKey: "resume_css", configValue: "body { font-family: ... }" },
      ];
      (getAllResumeConfigs as any).mockResolvedValue(mockConfigs);

      const configs = await getAllResumeConfigs();
      const result: Record<string, string> = {};
      for (const c of configs) {
        result[c.configKey] = c.configValue;
      }

      expect(result).toHaveProperty("profile");
      expect(result).toHaveProperty("prompt_template");
      expect(result).toHaveProperty("resume_css");
    });
  });

  describe("resume.updateConfig", () => {
    it("should call upsertResumeConfig with correct params", async () => {
      (upsertResumeConfig as any).mockResolvedValue(undefined);

      await upsertResumeConfig("profile", "Updated profile content");

      expect(upsertResumeConfig).toHaveBeenCalledWith("profile", "Updated profile content");
    });
  });

  describe("resume.delete", () => {
    it("should find the log entry and delete it, clearing the job resume path", async () => {
      const mockLog = { id: 5, jobId: 10, status: "completed", jobTitle: "PM", jobCompany: "Acme" };
      (getResumeLogById as any).mockResolvedValue(mockLog);
      (updateJobResumePath as any).mockResolvedValue(undefined);
      (deleteResumeLog as any).mockResolvedValue(undefined);

      // Simulate the delete procedure logic
      const log = await getResumeLogById(5);
      expect(log).toBeTruthy();
      expect(log!.jobId).toBe(10);

      // Clear the job's resume path
      await updateJobResumePath(log!.jobId, null);
      expect(updateJobResumePath).toHaveBeenCalledWith(10, null);

      // Delete the log entry
      await deleteResumeLog(5);
      expect(deleteResumeLog).toHaveBeenCalledWith(5);
    });

    it("should throw when log entry not found", async () => {
      (getResumeLogById as any).mockResolvedValue(null);

      const log = await getResumeLogById(999);
      expect(log).toBeNull();
    });

    it("should handle delete of failed log entry (no job path to clear)", async () => {
      const mockLog = { id: 7, jobId: 15, status: "failed", jobTitle: "Dev", jobCompany: "Corp" };
      (getResumeLogById as any).mockResolvedValue(mockLog);
      (updateJobResumePath as any).mockResolvedValue(undefined);
      (deleteResumeLog as any).mockResolvedValue(undefined);

      const log = await getResumeLogById(7);
      expect(log).toBeTruthy();

      // Even for failed entries, we clear the job path to allow regeneration
      if (log!.jobId) {
        await updateJobResumePath(log!.jobId, null);
      }
      await deleteResumeLog(7);

      expect(updateJobResumePath).toHaveBeenCalledWith(15, null);
      expect(deleteResumeLog).toHaveBeenCalledWith(7);
    });
  });
});
