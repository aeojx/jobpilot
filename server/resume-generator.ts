/**
 * Resume Generator Service
 *
 * Uses invokeLLM() to generate a tailored resume in Markdown,
 * then converts to PDF using PDFKit (pure Node.js, no browser/system deps).
 * Uploads the PDF to S3 via storagePut and logs everything.
 *
 * NOTE: Neither manus-md-to-pdf (sandbox-only CLI) nor puppeteer (needs
 * system Chrome libs) work in the deployed production environment.
 * PDFKit is a pure-JS solution that works everywhere.
 */

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

const RESUME_DIR = path.join(
  process.cwd(),
  "resume_engine",
  "tailored_resumes"
);

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
 */
function sanitizeForFilename(str: string): string {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 40);
}

/* ─── Color constants matching the CSS theme ─── */
const ACCENT = [44, 122, 123] as const; // #2c7a7b teal
const TEXT_COLOR = [26, 32, 44] as const; // #1a202c
const TEXT_MUTED = [74, 85, 104] as const; // #4a5568
const DARK_BG = [26, 32, 44] as const; // #1a202c
const BORDER = [226, 232, 240] as const; // #e2e8f0

/**
 * Convert LLM-generated Markdown resume to a professional PDF buffer
 * using PDFKit. No browser or system dependencies required.
 */
async function markdownToPdf(markdownContent: string): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 36, bottom: 36, left: 42, right: 42 },
      bufferPages: true,
      info: {
        Title: "Alan Abbas — Resume",
        Author: "Alan Abbas",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Register fonts — use Helvetica (built-in) as our sans-serif
    const FONT_REG = "Helvetica";
    const FONT_BOLD = "Helvetica-Bold";
    const FONT_ITALIC = "Helvetica-Oblique";
    const FONT_BOLD_ITALIC = "Helvetica-BoldOblique";

    // Parse the markdown into lines
    const lines = markdownContent.split("\n");
    let i = 0;

    function ensureSpace(needed: number) {
      const bottom = doc.page.height - doc.page.margins.bottom;
      if (doc.y + needed > bottom) {
        doc.addPage();
      }
    }

    /** Render inline markdown: **bold**, *italic*, **bold *nested italic*** */
    function renderRichText(
      text: string,
      opts: {
        fontSize?: number;
        color?: readonly [number, number, number];
        lineGap?: number;
        align?: "left" | "center" | "right" | "justify";
      } = {}
    ) {
      const fontSize = opts.fontSize ?? 9.5;
      const color = opts.color ?? TEXT_COLOR;
      const lineGap = opts.lineGap ?? 2;
      const align = opts.align ?? "left";

      // Split into segments: **bold**, *italic*, or plain text
      const segments: { text: string; bold: boolean; italic: boolean }[] = [];
      // Match **bold** or *italic* patterns
      const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
      let lastIdx = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          segments.push({
            text: text.slice(lastIdx, match.index),
            bold: false,
            italic: false,
          });
        }
        if (match[1] !== undefined) {
          segments.push({ text: match[1], bold: true, italic: false });
        } else if (match[2] !== undefined) {
          segments.push({ text: match[2], bold: false, italic: true });
        }
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < text.length) {
        segments.push({
          text: text.slice(lastIdx),
          bold: false,
          italic: false,
        });
      }

      if (segments.length === 0) return;

      // Build features array for doc.text with continued
      // PDFKit doesn't support inline font changes easily, so we use a workaround
      // with doc.text() for each segment in "continued" mode
      const startY = doc.y;
      let isFirst = true;
      for (const seg of segments) {
        let font = FONT_REG;
        if (seg.bold && seg.italic) font = FONT_BOLD_ITALIC;
        else if (seg.bold) font = FONT_BOLD;
        else if (seg.italic) font = FONT_ITALIC;

        doc.font(font).fontSize(fontSize).fillColor(color as unknown as string);

        if (isFirst) {
          doc.text(seg.text, {
            continued: seg !== segments[segments.length - 1],
            lineGap,
            align,
            width: pageW,
          });
          isFirst = false;
        } else {
          doc.text(seg.text, {
            continued: seg !== segments[segments.length - 1],
            lineGap,
          });
        }
      }
    }

    /** Draw a horizontal rule */
    function drawHR() {
      ensureSpace(12);
      doc.y += 4;
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.margins.left + pageW, doc.y)
        .strokeColor(BORDER as unknown as string)
        .lineWidth(1)
        .stroke();
      doc.y += 8;
    }

    /** Draw section header (H2) with accent underline */
    function drawH2(text: string) {
      ensureSpace(30);
      doc.y += 10;
      doc
        .font(FONT_BOLD)
        .fontSize(11)
        .fillColor(TEXT_COLOR as unknown as string)
        .text(text.toUpperCase(), { width: pageW, characterSpacing: 1.2 });
      doc.y += 2;
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.margins.left + pageW, doc.y)
        .strokeColor(ACCENT as unknown as string)
        .lineWidth(1.5)
        .stroke();
      doc.y += 6;
    }

    /** Draw H3 (role title) */
    function drawH3(text: string) {
      ensureSpace(20);
      doc.y += 6;
      renderRichText(text, { fontSize: 10.5, color: TEXT_COLOR });
    }

    /** Draw a blockquote (Career Impact box) */
    function drawBlockquote(lines: string[]) {
      ensureSpace(50);
      const boxX = doc.page.margins.left;
      const boxW = pageW;
      const startY = doc.y + 4;

      // Measure content height
      let contentH = 8; // padding
      for (const line of lines) {
        contentH += 14;
      }
      contentH += 8; // bottom padding

      // Draw dark background
      doc
        .rect(boxX, startY, boxW, contentH)
        .fill(DARK_BG as unknown as string);

      doc.y = startY + 8;
      for (const line of lines) {
        const cleaned = line.replace(/^>\s*/, "").trim();
        if (!cleaned) continue;

        // Check if it's a bold metric line
        const boldMatch = cleaned.match(/^\*\*(.+?)\*\*$/);
        if (boldMatch) {
          doc
            .font(FONT_BOLD)
            .fontSize(13)
            .fillColor("white")
            .text(boldMatch[1], boxX + 12, doc.y, { width: boxW - 24 });
        } else {
          doc
            .font(FONT_REG)
            .fontSize(8.5)
            .fillColor("#cbd5e0")
            .text(cleaned, boxX + 12, doc.y, { width: boxW - 24 });
        }
        doc.y += 2;
      }
      doc.y += 8;
    }

    /** Draw a markdown table */
    function drawTable(headerLine: string, rows: string[]) {
      ensureSpace(40);
      const allRows = [headerLine, ...rows].filter(
        (r) => !r.match(/^\|[\s-:|]+\|$/)
      ); // skip separator rows

      const cellTexts = allRows.map((row) =>
        row
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim())
      );

      if (cellTexts.length === 0) return;

      const numCols = cellTexts[0].length;
      const colW = pageW / numCols;
      const cellPadX = 6;
      const cellPadY = 5;

      for (let r = 0; r < cellTexts.length; r++) {
        const rowCells = cellTexts[r];
        const rowH = 20;
        ensureSpace(rowH);

        for (let c = 0; c < numCols; c++) {
          const cellX = doc.page.margins.left + c * colW;
          const cellText = (rowCells[c] || "").replace(/\*\*/g, "");

          // Draw left accent border
          doc
            .moveTo(cellX, doc.y)
            .lineTo(cellX, doc.y + rowH)
            .strokeColor(ACCENT as unknown as string)
            .lineWidth(2.5)
            .stroke();

          doc
            .font(r === 0 ? FONT_BOLD : FONT_REG)
            .fontSize(8.5)
            .fillColor(TEXT_COLOR as unknown as string)
            .text(cellText, cellX + cellPadX + 3, doc.y + cellPadY, {
              width: colW - cellPadX * 2 - 3,
              lineBreak: true,
            });
        }
        doc.y += rowH;
      }
      doc.y += 4;
    }

    // ─── Main rendering loop ───
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        i++;
        continue;
      }

      // H1 — Name header
      if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
        const name = trimmed.replace(/^#\s+/, "");
        ensureSpace(30);
        doc
          .font(FONT_BOLD)
          .fontSize(24)
          .fillColor(TEXT_COLOR as unknown as string)
          .text(name.toUpperCase(), {
            width: pageW,
            characterSpacing: 2,
          });
        doc.y += 2;
        i++;
        continue;
      }

      // H2 — Section headers
      if (trimmed.startsWith("## ")) {
        const text = trimmed.replace(/^##\s+/, "");
        drawH2(text);
        i++;
        continue;
      }

      // H3 — Role titles
      if (trimmed.startsWith("### ")) {
        const text = trimmed.replace(/^###\s+/, "");
        drawH3(text);
        i++;
        continue;
      }

      // Horizontal rule
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        drawHR();
        i++;
        continue;
      }

      // Blockquote blocks — collect consecutive > lines
      if (trimmed.startsWith(">")) {
        const blockLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          blockLines.push(lines[i]);
          i++;
        }
        // Check if there are multiple blockquote blocks in sequence
        // Group them: each block separated by an empty > line or non-> line
        const groups: string[][] = [];
        let currentGroup: string[] = [];
        for (const bl of blockLines) {
          const content = bl.replace(/^>\s*/, "").trim();
          if (!content && currentGroup.length > 0) {
            groups.push(currentGroup);
            currentGroup = [];
          } else if (content) {
            currentGroup.push(bl);
          }
        }
        if (currentGroup.length > 0) groups.push(currentGroup);

        // If we have multiple groups, render them side by side (impact boxes)
        if (groups.length >= 2) {
          ensureSpace(60);
          const boxW = (pageW - 8 * (groups.length - 1)) / groups.length;
          const startY = doc.y + 4;
          const boxH = 48;

          for (let g = 0; g < groups.length; g++) {
            const boxX = doc.page.margins.left + g * (boxW + 8);
            doc
              .rect(boxX, startY, boxW, boxH)
              .fill(DARK_BG as unknown as string);

            let textY = startY + 6;
            for (const bl of groups[g]) {
              const content = bl.replace(/^>\s*/, "").trim();
              if (!content) continue;
              const boldMatch = content.match(/^\*\*(.+?)\*\*$/);
              if (boldMatch) {
                doc
                  .font(FONT_BOLD)
                  .fontSize(13)
                  .fillColor("white")
                  .text(boldMatch[1], boxX + 8, textY, {
                    width: boxW - 16,
                    align: "left",
                  });
                textY += 16;
              } else {
                doc
                  .font(FONT_REG)
                  .fontSize(7.5)
                  .fillColor("#cbd5e0")
                  .text(content, boxX + 8, textY, {
                    width: boxW - 16,
                    align: "left",
                  });
                textY += 10;
              }
            }
          }
          doc.y = startY + boxH + 8;
        } else {
          // Single blockquote
          for (const group of groups) {
            drawBlockquote(group);
          }
        }
        continue;
      }

      // Table — starts with |
      if (trimmed.startsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          drawTable(tableLines[0], tableLines.slice(1));
        }
        continue;
      }

      // Bullet list item
      if (
        trimmed.startsWith("- ") ||
        trimmed.startsWith("* ") ||
        trimmed.startsWith("▸ ")
      ) {
        ensureSpace(14);
        const bulletText = trimmed.replace(/^[-*▸]\s+/, "");

        // Draw bullet marker
        const bulletX = doc.page.margins.left;
        doc
          .font(FONT_BOLD)
          .fontSize(9.5)
          .fillColor(ACCENT as unknown as string)
          .text("▸", bulletX, doc.y, { continued: false });

        // Move back up and render text with indent
        doc.y -= 12;
        const savedX = doc.x;
        doc.x = bulletX + 12;
        renderRichText(bulletText, { fontSize: 9.5, color: TEXT_COLOR });
        doc.x = savedX;
        doc.y += 2;
        i++;
        continue;
      }

      // Code block — skip backtick fences, render content as-is
      if (trimmed.startsWith("```")) {
        i++; // skip opening fence
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          const codeLine = lines[i];
          if (codeLine.trim()) {
            ensureSpace(14);
            doc
              .font(FONT_REG)
              .fontSize(9)
              .fillColor(TEXT_MUTED as unknown as string)
              .text(codeLine.trim(), { width: pageW });
          }
          i++;
        }
        if (i < lines.length) i++; // skip closing fence
        continue;
      }

      // Regular paragraph
      ensureSpace(14);
      renderRichText(trimmed, { fontSize: 9.5, color: TEXT_COLOR });
      doc.y += 2;
      i++;
    }

    doc.end();
  });
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
    const [profile, promptTemplate] = await Promise.all([
      getResumeConfig("profile"),
      getResumeConfig("prompt_template"),
    ]);

    if (!profile) throw new Error("Master profile not found in resume_config");
    if (!promptTemplate)
      throw new Error("Prompt template not found in resume_config");

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
    const pdfPath = path.join(RESUME_DIR, `${uniqueBaseName}.pdf`);

    // 8. Convert Markdown to PDF using PDFKit (pure Node.js, production-safe)
    console.log(
      `[Resume Generator] Converting markdown to PDF via PDFKit...`
    );
    const pdfBuffer = await markdownToPdf(resumeMarkdown);
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(
      `[Resume Generator] PDF generated at ${pdfPath} (${pdfBuffer.length} bytes)`
    );

    // 9. Upload PDF to S3 with the clean filename
    let fileUrl = "";
    try {
      const s3Key = `resumes/${baseName}_${timestamp}.pdf`;
      const result = await storagePut(s3Key, pdfBuffer, "application/pdf");
      fileUrl = result.url;
      console.log(`[Resume Generator] Uploaded to S3: ${fileUrl}`);
    } catch (s3Error: any) {
      console.warn(
        `[Resume Generator] S3 upload failed, using local path:`,
        s3Error.message
      );
    }

    // 10. Extract token usage from LLM response
    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens ?? null;
    const completionTokens = usage?.completion_tokens ?? null;
    const totalTokens = usage?.total_tokens ?? null;
    const creditCost = totalTokens
      ? Number(
          (
            ((promptTokens ?? 0) / 1000) * 0.003 +
            ((completionTokens ?? 0) / 1000) * 0.015
          ).toFixed(4)
        )
      : null;

    if (usage) {
      console.log(
        `[Resume Generator] Token usage — prompt: ${promptTokens}, completion: ${completionTokens}, total: ${totalTokens}, est. cost: $${creditCost}`
      );
    }

    // 11. Update job and log
    const durationMs = Date.now() - startTime;
    await updateJobResumePath(job.id, fileUrl || pdfPath);
    await updateResumeLog(logId, {
      status: "completed",
      filePath: pdfPath,
      fileUrl: fileUrl || null,
      durationMs,
      promptTokens,
      completionTokens,
      totalTokens,
      creditCost,
      completedAt: new Date(),
    });

    // Clean up local PDF file after S3 upload
    if (fileUrl) {
      try {
        fs.unlinkSync(pdfPath);
      } catch {}
    }

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
