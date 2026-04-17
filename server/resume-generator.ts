/**
 * Resume Generator Service
 *
 * Uses invokeLLM() to generate a tailored resume in Markdown,
 * then converts to PDF using PDFKit (pure Node.js, no browser/system deps).
 * Uploads the PDF to S3 via storagePut and logs everything.
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

function sanitizeForFilename(str: string): string {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 40);
}

/* ─── Colors ─── */
const ACCENT: [number, number, number] = [44, 122, 123];
const TEXT_COLOR: [number, number, number] = [26, 32, 44];
const TEXT_MUTED: [number, number, number] = [74, 85, 104];
const DARK_BG: [number, number, number] = [26, 32, 44];
const BORDER: [number, number, number] = [226, 232, 240];
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_GRAY: [number, number, number] = [203, 213, 224];

/**
 * Convert LLM-generated Markdown resume to a professional PDF buffer.
 */
async function markdownToPdf(markdownContent: string): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 36, bottom: 36, left: 42, right: 42 },
      bufferPages: true,
      info: { Title: "Alan Abbas - Resume", Author: "Alan Abbas" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const LEFT = doc.page.margins.left;
    const pageW = doc.page.width - LEFT - doc.page.margins.right;

    const F_REG = "Helvetica";
    const F_BOLD = "Helvetica-Bold";
    const F_ITALIC = "Helvetica-Oblique";
    const F_BI = "Helvetica-BoldOblique";

    const lines = markdownContent.split("\n");
    let i = 0;

    function ensureSpace(needed: number) {
      if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
    }

    /**
     * Parse inline markdown into segments with bold/italic flags.
     */
    function parseInline(text: string) {
      const segs: { text: string; bold: boolean; italic: boolean }[] = [];
      const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
      let last = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        if (m.index > last)
          segs.push({ text: text.slice(last, m.index), bold: false, italic: false });
        if (m[1] !== undefined)
          segs.push({ text: m[1], bold: true, italic: false });
        else if (m[2] !== undefined)
          segs.push({ text: m[2], bold: false, italic: true });
        last = m.index + m[0].length;
      }
      if (last < text.length)
        segs.push({ text: text.slice(last), bold: false, italic: false });
      return segs;
    }

    /**
     * Render rich text at a specific X position with a given width.
     * Uses PDFKit's continued mode for inline font switching.
     */
    function renderRichText(
      text: string,
      x: number,
      w: number,
      opts: {
        fontSize?: number;
        color?: [number, number, number];
        lineGap?: number;
        align?: "left" | "center" | "right" | "justify";
      } = {}
    ) {
      const sz = opts.fontSize ?? 9.5;
      const clr = opts.color ?? TEXT_COLOR;
      const lg = opts.lineGap ?? 2;
      const align = opts.align ?? "left";
      const segs = parseInline(text);
      if (!segs.length) return;

      for (let s = 0; s < segs.length; s++) {
        const seg = segs[s];
        let font = F_REG;
        if (seg.bold && seg.italic) font = F_BI;
        else if (seg.bold) font = F_BOLD;
        else if (seg.italic) font = F_ITALIC;

        doc.font(font).fontSize(sz).fillColor(clr);
        const isLast = s === segs.length - 1;

        if (s === 0) {
          doc.text(seg.text, x, doc.y, {
            continued: !isLast,
            lineGap: lg,
            align,
            width: w,
          });
        } else {
          doc.text(seg.text, { continued: !isLast, lineGap: lg });
        }
      }
    }

    /**
     * Measure the height a block of text would occupy.
     */
    function measureText(text: string, font: string, size: number, width: number): number {
      const clean = text.replace(/\*\*/g, "").replace(/\*/g, "");
      return doc.font(font).fontSize(size).heightOfString(clean, { width });
    }

    /* ─── Drawing helpers ─── */

    function drawHR() {
      ensureSpace(10);
      doc.y += 3;
      doc.moveTo(LEFT, doc.y).lineTo(LEFT + pageW, doc.y)
        .strokeColor(BORDER).lineWidth(0.75).stroke();
      doc.y += 5;
    }

    function drawH2(text: string) {
      ensureSpace(28);
      doc.y += 10;
      doc.font(F_BOLD).fontSize(10.5).fillColor(TEXT_COLOR)
        .text(text.toUpperCase(), LEFT, doc.y, { width: pageW, characterSpacing: 1.2 });
      doc.y += 2;
      doc.moveTo(LEFT, doc.y).lineTo(LEFT + pageW, doc.y)
        .strokeColor(ACCENT).lineWidth(1.5).stroke();
      doc.y += 5;
    }

    function drawH3(text: string) {
      ensureSpace(18);
      doc.y += 6;
      renderRichText(text, LEFT, pageW, { fontSize: 10.5, color: TEXT_COLOR });
    }

    /**
     * Draw a proper grid table. Each row's cells are at the same Y.
     * Uses explicit X,Y positioning to avoid PDFKit's auto-flow staircase.
     */
    function drawTable(tableLines: string[]) {
      // Filter out separator rows (|---|---|)
      const dataRows = tableLines.filter((r) => !r.match(/^\|[\s\-:|]+\|$/));
      const parsed = dataRows.map((row) =>
        row.split("|").slice(1, -1).map((c) => c.trim().replace(/\*\*/g, ""))
      );
      if (!parsed.length) return;

      const numCols = parsed[0].length;
      const colW = pageW / numCols;
      const cellPad = 5;

      for (let r = 0; r < parsed.length; r++) {
        const cells = parsed[r];

        // Measure max cell height for this row
        let maxH = 16;
        for (let c = 0; c < numCols; c++) {
          const txt = cells[c] || "";
          const h = measureText(txt, r === 0 ? F_BOLD : F_REG, 8.5, colW - cellPad * 2 - 4) + cellPad * 2;
          if (h > maxH) maxH = h;
        }

        ensureSpace(maxH + 2);
        const rowY = doc.y;

        // Draw each cell at the SAME rowY
        for (let c = 0; c < numCols; c++) {
          const cellX = LEFT + c * colW;
          const txt = cells[c] || "";

          // Left accent border
          doc.save();
          doc.moveTo(cellX, rowY).lineTo(cellX, rowY + maxH)
            .strokeColor(ACCENT).lineWidth(2.5).stroke();
          doc.restore();

          // Cell text — use explicit x, y to prevent staircase
          doc.font(r === 0 ? F_BOLD : F_REG).fontSize(8.5).fillColor(TEXT_COLOR)
            .text(txt, cellX + cellPad + 3, rowY + cellPad, {
              width: colW - cellPad * 2 - 4,
              lineBreak: true,
            });
        }

        // Move Y past this row
        doc.y = rowY + maxH + 1;
      }
      doc.y += 3;
    }

    /**
     * Draw Career Impact boxes side-by-side.
     * Each group is a separate dark box with metric + description.
     */
    function drawImpactBoxes(groups: string[][]) {
      const count = groups.length;
      const gap = 6;
      const boxW = (pageW - gap * (count - 1)) / count;
      const boxH = 46;

      ensureSpace(boxH + 10);
      const startY = doc.y + 4;

      for (let g = 0; g < count; g++) {
        const boxX = LEFT + g * (boxW + gap);

        // Dark background
        doc.save();
        doc.rect(boxX, startY, boxW, boxH).fill(DARK_BG);
        doc.restore();

        let textY = startY + 7;
        for (const bl of groups[g]) {
          const content = bl.replace(/^>\s*/, "").trim();
          if (!content) continue;

          const boldMatch = content.match(/^\*\*(.+?)\*\*$/);
          if (boldMatch) {
            doc.font(F_BOLD).fontSize(12).fillColor(WHITE)
              .text(boldMatch[1], boxX + 8, textY, { width: boxW - 16 });
            textY += 15;
          } else {
            doc.font(F_REG).fontSize(7.5).fillColor(LIGHT_GRAY)
              .text(content, boxX + 8, textY, { width: boxW - 16 });
            textY += 10;
          }
        }
      }
      doc.y = startY + boxH + 6;
    }

    /**
     * Draw a single full-width blockquote box.
     */
    function drawBlockquote(bqLines: string[]) {
      // Measure content
      let contentH = 12;
      for (const bl of bqLines) {
        const c = bl.replace(/^>\s*/, "").trim();
        if (!c) continue;
        const isBold = /^\*\*(.+?)\*\*$/.test(c);
        contentH += isBold ? 18 : 12;
      }
      contentH += 8;

      ensureSpace(contentH + 4);
      const startY = doc.y + 2;

      doc.save();
      doc.rect(LEFT, startY, pageW, contentH).fill(DARK_BG);
      doc.restore();

      let textY = startY + 8;
      for (const bl of bqLines) {
        const content = bl.replace(/^>\s*/, "").trim();
        if (!content) continue;
        const boldMatch = content.match(/^\*\*(.+?)\*\*$/);
        if (boldMatch) {
          doc.font(F_BOLD).fontSize(13).fillColor(WHITE)
            .text(boldMatch[1], LEFT + 12, textY, { width: pageW - 24 });
          textY += 18;
        } else {
          doc.font(F_REG).fontSize(8.5).fillColor(LIGHT_GRAY)
            .text(content, LEFT + 12, textY, { width: pageW - 24 });
          textY += 12;
        }
      }
      doc.y = startY + contentH + 4;
    }

    /**
     * Draw a bullet point with teal vector triangle and indented rich text.
     */
    function drawBullet(text: string) {
      const indent = 14;
      const bulletW = pageW - indent;
      const textH = measureText(text, F_REG, 9.5, bulletW);
      ensureSpace(textH + 6);

      const bulletY = doc.y;

      // Draw a small teal triangle as a vector path (no font dependency)
      const triX = LEFT + 1;
      const triY = bulletY + 3;
      const triSize = 4;
      doc.save();
      doc.path(`M ${triX} ${triY} L ${triX + triSize} ${triY + triSize / 2} L ${triX} ${triY + triSize} Z`)
        .fill(ACCENT);
      doc.restore();

      // Render text with indent, starting at the same Y
      doc.y = bulletY;
      renderRichText(text, LEFT + indent, bulletW, { fontSize: 9.5, color: TEXT_COLOR });
      doc.y += 2;
    }

    /* ─── Main rendering loop ─── */
    while (i < lines.length) {
      const trimmed = lines[i].trim();

      // Skip empty lines
      if (!trimmed) { i++; continue; }

      // H1 — Name
      if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
        const name = trimmed.replace(/^#\s+/, "");
        ensureSpace(28);
        doc.font(F_BOLD).fontSize(24).fillColor(TEXT_COLOR)
          .text(name.toUpperCase(), LEFT, doc.y, { width: pageW, characterSpacing: 2 });
        doc.y += 2;
        i++;
        continue;
      }

      // H2 — Section headers
      if (trimmed.startsWith("## ")) {
        drawH2(trimmed.replace(/^##\s+/, ""));
        i++;
        continue;
      }

      // H3 — Role titles
      if (trimmed.startsWith("### ")) {
        drawH3(trimmed.replace(/^###\s+/, ""));
        i++;
        continue;
      }

      // Horizontal rule
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        drawHR();
        i++;
        continue;
      }

      // Blockquotes — collect all consecutive > lines, then look ahead for more groups
      if (trimmed.startsWith(">")) {
        const allBlockLines: string[] = [];
        // Collect consecutive > lines AND blank lines between blockquote groups
        while (i < lines.length) {
          const lt = lines[i].trim();
          if (lt.startsWith(">")) {
            allBlockLines.push(lines[i]);
            i++;
          } else if (lt === "" && i + 1 < lines.length && lines[i + 1].trim().startsWith(">")) {
            // blank line between blockquote groups — include as separator
            allBlockLines.push("");
            i++;
          } else {
            break;
          }
        }

        // Split into groups by blank lines
        const groups: string[][] = [];
        let cur: string[] = [];
        for (const bl of allBlockLines) {
          const content = bl.replace(/^>\s*/, "").trim();
          if (bl.trim() === "" || content === "") {
            if (cur.length > 0) { groups.push(cur); cur = []; }
          } else {
            cur.push(bl);
          }
        }
        if (cur.length > 0) groups.push(cur);

        // Multiple groups → side-by-side impact boxes
        if (groups.length >= 2) {
          drawImpactBoxes(groups);
        } else if (groups.length === 1) {
          drawBlockquote(groups[0]);
        }
        continue;
      }

      // Table
      if (trimmed.startsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          drawTable(tableLines);
        }
        continue;
      }

      // Bullet list
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^[\u25B8\u25B9\u25BA\u25BB\u25B6\u25B7]/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[-*\u25B8\u25B9\u25BA\u25BB\u25B6\u25B7]\s+/, "");
        drawBullet(bulletText);
        i++;
        continue;
      }

      // Code block
      if (trimmed.startsWith("```")) {
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          const cl = lines[i].trim();
          if (cl) {
            ensureSpace(13);
            doc.font(F_REG).fontSize(9).fillColor(TEXT_MUTED)
              .text(cl, LEFT, doc.y, { width: pageW });
          }
          i++;
        }
        if (i < lines.length) i++;
        continue;
      }

      // Regular paragraph
      ensureSpace(14);
      renderRichText(trimmed, LEFT, pageW, { fontSize: 9.5, color: TEXT_COLOR });
      doc.y += 2;
      i++;
    }

    doc.end();
  });
}

/* ═══════════════════════════════════════════════════════════════
   generateResume — orchestrates LLM call, PDF conversion, S3 upload
   ═══════════════════════════════════════════════════════════════ */

export async function generateResume(
  input: GenerateResumeInput
): Promise<GenerateResumeResult> {
  const startTime = Date.now();

  const job = await getJobById(input.jobId);
  if (!job) throw new Error(`Job not found: ${input.jobId}`);

  const logId = await insertResumeLog({
    jobId: job.id,
    jobTitle: job.title,
    jobCompany: job.company,
    requestedBy: input.requestedBy,
    requestedByUserId: input.requestedByUserId,
  });

  try {
    await updateResumeLog(logId, { status: "generating" });

    const [profile, promptTemplate] = await Promise.all([
      getResumeConfig("profile"),
      getResumeConfig("prompt_template"),
    ]);

    if (!profile) throw new Error("Master profile not found in resume_config");
    if (!promptTemplate) throw new Error("Prompt template not found in resume_config");

    const jobContext = [
      `JOB TITLE: ${job.title}`,
      `COMPANY: ${job.company}`,
      job.location ? `LOCATION: ${job.location}` : "",
      job.source ? `SOURCE/ATS: ${job.source}` : "",
      "",
      "JOB DESCRIPTION:",
      job.description || job.descriptionHtml || "(No description available)",
    ].filter(Boolean).join("\n");

    console.log(`[Resume Generator] Starting LLM generation for job ${job.id}: ${job.title} @ ${job.company}`);

    const response = await invokeLLM({
      messages: [
        { role: "system", content: promptTemplate },
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

    console.log(`[Resume Generator] LLM generated ${resumeMarkdown.length} chars of markdown`);

    const companyName = sanitizeForFilename(job.company);
    const baseName = `${companyName}_AlanAbbas`;
    const timestamp = Date.now();
    const uniqueBaseName = `${baseName}_${timestamp}`;
    const pdfPath = path.join(RESUME_DIR, `${uniqueBaseName}.pdf`);

    console.log(`[Resume Generator] Converting markdown to PDF via PDFKit...`);
    const pdfBuffer = await markdownToPdf(resumeMarkdown);
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`[Resume Generator] PDF generated at ${pdfPath} (${pdfBuffer.length} bytes)`);

    let fileUrl = "";
    try {
      const s3Key = `resumes/${baseName}_${timestamp}.pdf`;
      const result = await storagePut(s3Key, pdfBuffer, "application/pdf");
      fileUrl = result.url;
      console.log(`[Resume Generator] Uploaded to S3: ${fileUrl}`);
    } catch (s3Error: any) {
      console.warn(`[Resume Generator] S3 upload failed, using local path:`, s3Error.message);
    }

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens ?? null;
    const completionTokens = usage?.completion_tokens ?? null;
    const totalTokens = usage?.total_tokens ?? null;
    const creditCost = totalTokens
      ? Number(
          (((promptTokens ?? 0) / 1000) * 0.003 + ((completionTokens ?? 0) / 1000) * 0.015).toFixed(4)
        )
      : null;

    if (usage) {
      console.log(`[Resume Generator] Token usage — prompt: ${promptTokens}, completion: ${completionTokens}, total: ${totalTokens}, est. cost: $${creditCost}`);
    }

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

    if (fileUrl) {
      try { fs.unlinkSync(pdfPath); } catch {}
    }

    console.log(`[Resume Generator] Completed in ${durationMs}ms for job ${job.id}`);
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
