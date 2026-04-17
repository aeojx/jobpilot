/**
 * Resume Generator Service
 *
 * Uses invokeLLM() to generate a tailored resume in Markdown,
 * then converts to PDF using manus-md-to-pdf CLI tool.
 * Uploads the PDF to S3 via storagePut and logs everything.
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import {
  getResumeConfig,
  getJobById,
  insertResumeLog,
  updateResumeLog,
  updateJobResumePath,
} from "./db";

const RESUME_DIR = path.join(process.cwd(), "resume_engine", "tailored_resumes");

// Ensure output directory exists
if (!fs.existsSync(RESUME_DIR)) {
  fs.mkdirSync(RESUME_DIR, { recursive: true });
}

export interface GenerateResumeInput {
  jobId: number;
  requestedBy: string;
  requestedByUserId: number | null;
}

export interface GenerateResumeResult {
  logId: number;
  status: "completed" | "failed";
  filePath?: string;
  fileUrl?: string;
  error?: string;
}

/**
 * Sanitize a company name for use in a filename.
 * Replaces spaces with underscores, removes special chars, trims.
 */
function sanitizeForFilename(str: string): string {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 40);
}

/**
 * Generate a tailored resume for a specific job.
 * This is an async operation — call it and let it run in the background.
 */
export async function generateResume(
  input: GenerateResumeInput
): Promise<GenerateResumeResult> {
  const startTime = Date.now();

  // 1. Get job details
  const job = await getJobById(input.jobId);
  if (!job) {
    throw new Error(`Job not found: ${input.jobId}`);
  }

  // 2. Create log entry
  const logId = await insertResumeLog({
    jobId: job.id,
    jobTitle: job.title,
    jobCompany: job.company,
    requestedBy: input.requestedBy,
    requestedByUserId: input.requestedByUserId,
  });

  try {
    // 3. Update status to generating
    await updateResumeLog(logId, { status: "generating" });

    // 4. Load config from DB (Document Vault)
    const [profile, promptTemplate, resumeCss] = await Promise.all([
      getResumeConfig("profile"),
      getResumeConfig("prompt_template"),
      getResumeConfig("resume_css"),
    ]);

    if (!profile) throw new Error("Master profile not found in resume_config");
    if (!promptTemplate) throw new Error("Prompt template not found in resume_config");

    // 5. Build the job description context
    const jobContext = [
      `JOB TITLE: ${job.title}`,
      `COMPANY: ${job.company}`,
      job.location ? `LOCATION: ${job.location}` : "",
      job.source ? `SOURCE/ATS: ${job.source}` : "",
      "",
      "JOB DESCRIPTION:",
      job.description || job.descriptionHtml || "(No description available)",
    ]
      .filter(Boolean)
      .join("\n");

    // 6. Call LLM to generate tailored resume markdown
    console.log(
      `[Resume Generator] Starting LLM generation for job ${job.id}: ${job.title} @ ${job.company}`
    );

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: promptTemplate,
        },
        {
          role: "user",
          content: [
            "=== MASTER PROFILE (source of truth — use ONLY facts from here) ===",
            profile,
            "",
            "=== TARGET JOB DESCRIPTION (optimize resume for this) ===",
            jobContext,
            "",
            "Generate the tailored resume now in Markdown format. Remember: ZERO hallucination — every fact must come from the master profile above. Do NOT restrict to one page — include ALL relevant content to maximize ATS score. Focus on quality and comprehensive keyword coverage.",
          ].join("\n"),
        },
      ],
      maxTokens: 16384,
    });

    const resumeMarkdown =
      typeof response.choices?.[0]?.message?.content === "string"
        ? response.choices[0].message.content
        : "";

    if (!resumeMarkdown || resumeMarkdown.length < 200) {
      throw new Error("LLM returned insufficient resume content");
    }

    console.log(
      `[Resume Generator] LLM generated ${resumeMarkdown.length} chars of markdown`
    );

    // 7. Build filename: CompanyName_AlanAbbas.pdf
    const companyName = sanitizeForFilename(job.company);
    const baseName = `${companyName}_AlanAbbas`;
    const timestamp = Date.now();
    const uniqueBaseName = `${baseName}_${timestamp}`;
    const mdPath = path.join(RESUME_DIR, `${uniqueBaseName}.md`);
    const pdfPath = path.join(RESUME_DIR, `${uniqueBaseName}.pdf`);

    // Write the markdown with embedded CSS
    const fullMarkdown = resumeCss
      ? `<style>\n${resumeCss}\n</style>\n\n${resumeMarkdown}`
      : resumeMarkdown;

    fs.writeFileSync(mdPath, fullMarkdown, "utf-8");
    console.log(`[Resume Generator] Wrote markdown to ${mdPath}`);

    // 8. Convert to PDF using manus-md-to-pdf
    try {
      execSync(`manus-md-to-pdf "${mdPath}" "${pdfPath}"`, {
        timeout: 60000,
        stdio: "pipe",
      });
      console.log(`[Resume Generator] PDF generated at ${pdfPath}`);
    } catch (pdfError: any) {
      console.error(
        `[Resume Generator] PDF conversion error:`,
        pdfError.stderr?.toString() || pdfError.message
      );
      throw new Error(
        `PDF conversion failed: ${pdfError.stderr?.toString() || pdfError.message}`
      );
    }

    // 9. Upload PDF to S3 with the clean filename
    let fileUrl = "";
    try {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const s3Key = `resumes/${baseName}_${timestamp}.pdf`;
      const result = await storagePut(s3Key, pdfBuffer, "application/pdf");
      fileUrl = result.url;
      console.log(`[Resume Generator] Uploaded to S3: ${fileUrl}`);
    } catch (s3Error: any) {
      console.warn(
        `[Resume Generator] S3 upload failed, using local path:`,
        s3Error.message
      );
      // Fall back to local path — the download endpoint will serve it
    }

    // 10. Update job and log
    const durationMs = Date.now() - startTime;
    await updateJobResumePath(job.id, fileUrl || pdfPath);
    await updateResumeLog(logId, {
      status: "completed",
      filePath: pdfPath,
      fileUrl: fileUrl || null,
      durationMs,
      completedAt: new Date(),
    });

    // Clean up markdown file
    try {
      fs.unlinkSync(mdPath);
    } catch {}

    console.log(
      `[Resume Generator] Completed in ${durationMs}ms for job ${job.id}`
    );

    return { logId, status: "completed", filePath: pdfPath, fileUrl };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[Resume Generator] Failed for job ${input.jobId}:`, error);

    await updateResumeLog(logId, {
      status: "failed",
      errorMessage: error.message || "Unknown error",
      durationMs,
      completedAt: new Date(),
    });

    return { logId, status: "failed", error: error.message };
  }
}
