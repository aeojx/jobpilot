import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { getDb } from "./db";
import { jobs } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

const markdown = require("markdown");

const execAsync = promisify(exec);

const RESUME_ENGINE_PATH = "/home/ubuntu/projects/1000jobs-main-folder-8ad188bd/resume_engine";
const TAILORED_RESUMES_PATH = "/home/ubuntu/projects/1000jobs-main-folder-8ad188bd/tailored_resumes";

/**
 * Generate a tailored resume for a job
 * This runs asynchronously and updates the job record when complete
 */
export async function generateResumeAsync(jobId: number): Promise<void> {
  try {
    // Fetch job details
    const db = await getDb();
    if (!db) {
      console.error(`Database not available for job ${jobId}`);
      return;
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    // Read master profile
    const profilePath = path.join(RESUME_ENGINE_PATH, "AlanAbbas_Complete_Profile.md");
    const masterProfile = fs.readFileSync(profilePath, "utf-8");

    // Read prompt template
    const promptPath = path.join(RESUME_ENGINE_PATH, "prompt_template.txt");
    const promptTemplate = fs.readFileSync(promptPath, "utf-8");

    // Fill in placeholders
    const filledPrompt = promptTemplate
      .replace("{{PROFILE_PLACEHOLDER}}", masterProfile)
      .replace("{{JD_PLACEHOLDER}}", job.description || "");

    // Call LLM via built-in service
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

    // Convert Markdown to PDF
    const pdfPath = await convertMarkdownToPdf(resumeMarkdown, job.title, job.company);

    // Update job record with resume path
    const dbConn = await getDb();
    if (dbConn) {
      await dbConn.update(jobs).set({ resumeGeneratedPath: pdfPath }).where(eq(jobs.id, jobId));
    }

    console.log(`✓ Resume generated for job ${jobId}: ${pdfPath}`);
  } catch (error) {
    console.error(`Error generating resume for job ${jobId}:`, error);
  }
}

/**
 * Convert Markdown to PDF using WeasyPrint or manus-md-to-pdf
 */
async function convertMarkdownToPdf(
  markdownContent: string,
  jobTitle: string,
  company: string
): Promise<string> {
  // Sanitize filename
  const safeTitle = jobTitle.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
  const safeCompany = company.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
  const filename = `${safeTitle}_${safeCompany}_AlanAbbas.pdf`;
  const outputPath = path.join(TAILORED_RESUMES_PATH, filename);

  // Ensure output directory exists
  if (!fs.existsSync(TAILORED_RESUMES_PATH)) {
    fs.mkdirSync(TAILORED_RESUMES_PATH, { recursive: true });
  }

  // Read CSS
  const cssPath = path.join(RESUME_ENGINE_PATH, "resume_style.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  // Convert Markdown to HTML
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html = (markdown as any).toHtml(markdownContent);

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

  // Try WeasyPrint first, fall back to manus-md-to-pdf
  try {
    // Use WeasyPrint via Python
    const pythonScript = `
import weasyprint
html = open('${tempHtmlPath}', 'r').read()
weasyprint.HTML(string=html).write_pdf('${outputPath}')
`;
    const tempPyPath = path.join(TAILORED_RESUMES_PATH, `${filename}.py`);
    fs.writeFileSync(tempPyPath, pythonScript);
    await execAsync(`python3 ${tempPyPath}`);
    fs.unlinkSync(tempPyPath);
  } catch (e) {
    // Fallback: use manus-md-to-pdf
    const tempMdPath = path.join(TAILORED_RESUMES_PATH, `${filename}.md`);
    fs.writeFileSync(tempMdPath, markdownContent);
    await execAsync(`manus-md-to-pdf ${tempMdPath} ${outputPath}`);
    fs.unlinkSync(tempMdPath);
  }

  // Clean up temp HTML
  fs.unlinkSync(tempHtmlPath);

  return outputPath;
}
