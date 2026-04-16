import { invokeLLM } from "./_core/llm";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import MarkdownIt from "markdown-it";

const RESUME_ENGINE_DIR = "/home/ubuntu/projects/1000jobs-main-folder-8ad188bd/resume_engine";
const OUTPUT_DIR = "/home/ubuntu/projects/1000jobs-main-folder-8ad188bd/tailored_resumes";

const md = new MarkdownIt({ html: true, breaks: false });

function sanitizeFilename(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 80);
}

export interface ResumeGenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
  durationMs: number;
}

export async function generateResumeForJob(
  jobTitle: string,
  jobCompany: string,
  jobDescription: string
): Promise<ResumeGenerationResult> {
  const startTime = Date.now();

  try {
    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const profilePath = join(RESUME_ENGINE_DIR, "AlanAbbas_Complete_Profile.md");
    if (!existsSync(profilePath)) {
      throw new Error(`Master profile not found at ${profilePath}`);
    }
    const profile = readFileSync(profilePath, "utf-8");

    const templatePath = join(RESUME_ENGINE_DIR, "prompt_template.txt");
    if (!existsSync(templatePath)) {
      throw new Error(`Prompt template not found at ${templatePath}`);
    }
    const template = readFileSync(templatePath, "utf-8");

    const filledPrompt = template
      .replace("{{PROFILE_PLACEHOLDER}}", profile)
      .replace("{{JD_PLACEHOLDER}}", jobDescription);

    console.log(`[Resume] Calling LLM for ${jobTitle} at ${jobCompany}...`);

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

    const markdownContent =
      typeof response.choices[0].message.content === "string"
        ? response.choices[0].message.content
        : Array.isArray(response.choices[0].message.content)
          ? response.choices[0].message.content
              .filter((p: any): p is { type: "text"; text: string } => p.type === "text")
              .map((p: any) => p.text)
              .join("\n")
          : "";

    if (!markdownContent || markdownContent.length < 100) {
      throw new Error("LLM returned empty or too-short response");
    }

    console.log(`[Resume] LLM returned ${markdownContent.length} chars of markdown`);

    const htmlBody = md.render(markdownContent);

    const cssPath = join(RESUME_ENGINE_DIR, "resume_style.css");
    const css = existsSync(cssPath) ? readFileSync(cssPath, "utf-8") : "";

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>${css}</style>
</head>
<body>${htmlBody}</body>
</html>`;

    const safeName = `${sanitizeFilename(jobTitle)}_${sanitizeFilename(jobCompany)}_AlanAbbas`;
    const mdPath = join(OUTPUT_DIR, `${safeName}.md`);
    const htmlPath = join(OUTPUT_DIR, `${safeName}.html`);
    const pdfPath = join(OUTPUT_DIR, `${safeName}.pdf`);

    writeFileSync(mdPath, markdownContent, "utf-8");
    writeFileSync(htmlPath, fullHtml, "utf-8");

    try {
      execSync(`manus-md-to-pdf "${mdPath}" "${pdfPath}"`, {
        timeout: 30000,
        stdio: "pipe",
      });
      console.log(`[Resume] PDF generated: ${pdfPath}`);
    } catch (pdfErr: any) {
      console.error(`[Resume] manus-md-to-pdf failed, trying WeasyPrint...`, pdfErr.message);
      try {
        execSync(`python3 -c "from weasyprint import HTML; HTML(filename='${htmlPath}').write_pdf('${pdfPath}')"`, {
          timeout: 30000,
          stdio: "pipe",
        });
        console.log(`[Resume] PDF generated via WeasyPrint: ${pdfPath}`);
      } catch (wpErr: any) {
        console.error(`[Resume] WeasyPrint also failed:`, wpErr.message);
        throw new Error("PDF conversion failed with both manus-md-to-pdf and WeasyPrint");
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Resume] Resume generated for ${jobTitle} at ${jobCompany} in ${durationMs}ms`);

    return { success: true, filePath: pdfPath, durationMs };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[Resume] Failed for ${jobTitle} at ${jobCompany}:`, error.message);
    return { success: false, error: error.message, durationMs };
  }
}
