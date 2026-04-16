import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { getDb } from "./db";
import { jobs } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

const execAsync = promisify(exec);

const RESUME_ENGINE_PATH = "/home/ubuntu/projects/1000jobs-main-folder-8ad188bd/resume_engine";
const TAILORED_RESUMES_PATH = "/home/ubuntu/projects/1000jobs-main-folder-8ad188bd/tailored_resumes";

/**
 * Generate a tailored resume for a job
 * This runs asynchronously and saves to the project folder
 */
export async function generateResumeAsync(jobId: number): Promise<void> {
  try {
    console.log(`[Resume] Starting generation for job ${jobId}`);
    
    // Fetch job details
    const db = await getDb();
    if (!db) {
      console.error(`[Resume] Database not available for job ${jobId}`);
      return;
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) {
      console.error(`[Resume] Job ${jobId} not found`);
      return;
    }

    // Read master profile
    const profilePath = path.join(RESUME_ENGINE_PATH, "AlanAbbas_Complete_Profile.md");
    if (!fs.existsSync(profilePath)) {
      console.error(`[Resume] Master profile not found at ${profilePath}`);
      return;
    }
    const masterProfile = fs.readFileSync(profilePath, "utf-8");
    console.log(`[Resume] Master profile loaded (${masterProfile.length} chars)`);

    // Read prompt template
    const promptPath = path.join(RESUME_ENGINE_PATH, "prompt_template.txt");
    if (!fs.existsSync(promptPath)) {
      console.error(`[Resume] Prompt template not found at ${promptPath}`);
      return;
    }
    const promptTemplate = fs.readFileSync(promptPath, "utf-8");
    console.log(`[Resume] Prompt template loaded (${promptTemplate.length} chars)`);

    // Fill in placeholders
    const filledPrompt = promptTemplate
      .replace("{{PROFILE_PLACEHOLDER}}", masterProfile)
      .replace("{{JD_PLACEHOLDER}}", job.description || "");
    console.log(`[Resume] Prompt filled (${filledPrompt.length} chars)`);

    // Call LLM via built-in service
    console.log(`[Resume] Calling LLM for job: ${job.title} at ${job.company}`);
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an elite executive resume writer and ATS/AEO optimization expert. You produce resumes that score 100% on JobScan by precisely mirroring JD keywords into real achievements. You write in clean, professional Markdown. You are extremely concise - every word earns its place.",
        },
        {
          role: "user",
          content: filledPrompt,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resumeMarkdown = typeof (response.choices[0]?.message as any)?.content === "string" 
      ? (response.choices[0]?.message as any).content 
      : "";
    console.log(`[Resume] LLM response received (${resumeMarkdown.length} chars)`);

    // Convert Markdown to PDF
    const pdfPath = await convertMarkdownToPdf(resumeMarkdown, job.title, job.company);
    console.log(`[Resume] PDF generated at: ${pdfPath}`);

    // Update job record with resume path
    const dbConn = await getDb();
    if (dbConn) {
      await dbConn.update(jobs).set({ resumeGeneratedPath: pdfPath }).where(eq(jobs.id, jobId));
      console.log(`[Resume] Job ${jobId} updated with resume path`);
    }

    console.log(`✓ Resume generated for job ${jobId}: ${pdfPath}`);
  } catch (error) {
    console.error(`[Resume] Error generating resume for job ${jobId}:`, error);
  }
}

/**
 * Convert Markdown to PDF using manus-md-to-pdf
 */
async function convertMarkdownToPdf(
  markdownContent: string,
  jobTitle: string,
  company: string
): Promise<string> {
  // Sanitize filename
  const safeTitle = (jobTitle || "job").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
  const safeCompany = (company || "company").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
  const filename = `${safeTitle}_${safeCompany}_AlanAbbas.pdf`;
  const outputPath = path.join(TAILORED_RESUMES_PATH, filename);

  // Ensure output directory exists
  if (!fs.existsSync(TAILORED_RESUMES_PATH)) {
    fs.mkdirSync(TAILORED_RESUMES_PATH, { recursive: true });
    console.log(`[Resume] Created output directory: ${TAILORED_RESUMES_PATH}`);
  }

  // Read CSS (with fallback to empty string if not found)
  let css = "";
  const cssPath = path.join(RESUME_ENGINE_PATH, "resume_style.css");
  if (fs.existsSync(cssPath)) {
    css = fs.readFileSync(cssPath, "utf-8");
    console.log(`[Resume] CSS loaded (${css.length} chars)`);
  }

  // Convert Markdown to HTML using markdown-it
  let markdownToHtml: (content: string) => string;
  try {
    // Try to use markdown-it if available
    const mdModule = await import("markdown-it");
    const md = new mdModule.default();
    markdownToHtml = (content: string) => md.render(content);
    console.log(`[Resume] Using markdown-it for conversion`);
  } catch {
    // Fallback: simple regex-based conversion
    console.log(`[Resume] Using fallback HTML conversion`);
    markdownToHtml = (content: string) => {
      return content
        .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
        .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
        .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
    };
  }

  const html = markdownToHtml(markdownContent);

  // Wrap in HTML document with CSS
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

  // Write HTML to temp file
  const tempHtmlPath = path.join(TAILORED_RESUMES_PATH, `${filename}.html`);
  fs.writeFileSync(tempHtmlPath, fullHtml);
  console.log(`[Resume] Temp HTML written to: ${tempHtmlPath}`);

  // Use manus-md-to-pdf
  try {
    const tempMdPath = path.join(TAILORED_RESUMES_PATH, `${filename}.md`);
    fs.writeFileSync(tempMdPath, markdownContent);
    console.log(`[Resume] Calling manus-md-to-pdf: ${tempMdPath} -> ${outputPath}`);
    await execAsync(`manus-md-to-pdf ${tempMdPath} ${outputPath}`);
    fs.unlinkSync(tempMdPath);
    console.log(`[Resume] PDF successfully created at: ${outputPath}`);
  } catch (e) {
    console.error(`[Resume] Failed to convert markdown to PDF: ${e}`);
    throw e;
  }

  // Clean up temp HTML
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }

  return outputPath;
}
