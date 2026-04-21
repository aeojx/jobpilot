/**
 * AutoApply Agent: LLM-driven browser automation for job applications.
 * Uses Playwright for browser control and the Forge LLM for decision-making.
 */

import type { Page, Browser, BrowserContext } from "playwright";
import { invokeLLM } from "../_core/llm";
import {
  buildSystemPrompt,
  buildPageAnalysisPrompt,
  type ApplyContext,
} from "./prompt-builder";
import {
  CAPTCHA_DETECTION_SCRIPT,
  solveCaptcha,
  buildInjectionScript,
} from "./captcha-solver";
import { isSSOUrl } from "./blocked-sites";
import { storageGet } from "../storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AgentAction =
  | { action: "fill_field"; selector: string; value: string; clear?: boolean }
  | { action: "select_option"; selector: string; value: string }
  | { action: "click"; selector: string; reason: string }
  | { action: "upload_file"; selector: string }
  | { action: "wait"; ms: number; reason: string }
  | { action: "scroll_down"; reason: string }
  | {
      action: "captcha_detected";
      type: "hcaptcha" | "recaptcha_v2" | "recaptcha_v3" | "turnstile" | "funcaptcha";
      siteKey: string;
    }
  | {
      action: "done";
      result: "APPLIED" | "EXPIRED" | "FAILED" | "CAPTCHA" | "LOGIN_ISSUE";
      reason: string;
    };

export type AgentResult = {
  status: "applied" | "failed" | "expired" | "captcha" | "login_issue";
  error?: string;
  durationMs: number;
  steps: number;
};

type AgentLog = {
  step: number;
  action: string;
  detail: string;
  timestamp: number;
};

// ─── DOM Extraction Helpers ─────────────────────────────────────────────────

/** Extract visible form fields from the page */
const EXTRACT_FORM_FIELDS_SCRIPT = `
(() => {
  const fields = [];
  const inputs = document.querySelectorAll('input, select, textarea, [contenteditable="true"]');
  for (const el of inputs) {
    if (el.offsetParent === null && el.type !== 'hidden') continue; // skip hidden
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && el.type !== 'hidden') continue;

    const label = el.labels?.[0]?.textContent?.trim() ||
      el.getAttribute('aria-label') ||
      el.getAttribute('placeholder') ||
      el.closest('label')?.textContent?.trim() ||
      el.getAttribute('name') || '';

    const field = {
      tag: el.tagName.toLowerCase(),
      type: el.type || el.tagName.toLowerCase(),
      name: el.name || '',
      id: el.id || '',
      label: label.slice(0, 100),
      value: el.value || '',
      required: el.required || el.getAttribute('aria-required') === 'true',
      selector: el.id ? '#' + CSS.escape(el.id) : (el.name ? el.tagName.toLowerCase() + '[name="' + el.name + '"]' : ''),
    };

    if (el.tagName === 'SELECT') {
      field.options = Array.from(el.options).map(o => ({ value: o.value, text: o.textContent?.trim() })).slice(0, 20);
    }

    fields.push(field);
  }
  return JSON.stringify(fields);
})()
`;

/** Extract visible text from the page (truncated) */
const EXTRACT_PAGE_TEXT_SCRIPT = `
(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const texts = [];
  let total = 0;
  while (walker.nextNode() && total < 5000) {
    const text = walker.currentNode.textContent?.trim();
    if (text && text.length > 1) {
      texts.push(text);
      total += text.length;
    }
  }
  return texts.join(' ').slice(0, 5000);
})()
`;

// ─── Agent Core ─────────────────────────────────────────────────────────────

const MAX_STEPS = 60;
const STEP_TIMEOUT_MS = 10000;

export async function runAgent(
  page: Page,
  context: ApplyContext,
  resumePdfPath: string | null,
  onLog?: (log: AgentLog) => void
): Promise<AgentResult> {
  const startTime = Date.now();
  const logs: AgentLog[] = [];
  let steps = 0;

  const log = (action: string, detail: string) => {
    const entry: AgentLog = {
      step: steps,
      action,
      detail,
      timestamp: Date.now(),
    };
    logs.push(entry);
    onLog?.(entry);
    console.log(`[Agent Step ${steps}] ${action}: ${detail}`);
  };

  const systemPrompt = buildSystemPrompt(context);

  // Navigate to the apply URL
  const applyUrl = context.job.applyUrl || "";
  if (!applyUrl) {
    return {
      status: "failed",
      error: "No apply URL available",
      durationMs: Date.now() - startTime,
      steps: 0,
    };
  }

  try {
    log("navigate", `Going to ${applyUrl}`);
    await page.goto(applyUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000); // Let JS render
  } catch (err) {
    return {
      status: "failed",
      error: `Navigation failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - startTime,
      steps: 0,
    };
  }

  // Main agent loop
  while (steps < MAX_STEPS) {
    steps++;

    try {
      // Check for SSO redirect
      const currentUrl = page.url();
      if (isSSOUrl(currentUrl)) {
        log("sso_detected", `SSO login page detected: ${currentUrl}`);
        return {
          status: "login_issue",
          error: "SSO login required — cannot automate",
          durationMs: Date.now() - startTime,
          steps,
        };
      }

      // Detect CAPTCHAs
      const captchaResult = await page.evaluate(CAPTCHA_DETECTION_SCRIPT).catch(() => ({
        found: false,
        type: null,
        siteKey: null,
      })) as { found: boolean; type: string | null; siteKey: string | null };

      if (captchaResult.found && captchaResult.type && captchaResult.siteKey) {
        log("captcha_detected", `${captchaResult.type} found, solving...`);
        const solved = await solveCaptcha(
          captchaResult.type as any,
          captchaResult.siteKey,
          currentUrl
        );
        if (solved.success && solved.token) {
          const injectionScript = buildInjectionScript(
            captchaResult.type as any,
            solved.token
          );
          await page.evaluate(injectionScript);
          log("captcha_solved", `Injected ${captchaResult.type} token`);
          await page.waitForTimeout(1000);
          continue; // Re-evaluate the page after solving
        } else {
          log("captcha_failed", solved.error || "Unknown CAPTCHA error");
          return {
            status: "captcha",
            error: `CAPTCHA solve failed: ${solved.error}`,
            durationMs: Date.now() - startTime,
            steps,
          };
        }
      }

      // Extract page state
      const pageTitle = await page.title();
      const formFields = await page.evaluate(EXTRACT_FORM_FIELDS_SCRIPT).catch(() => "[]");
      const visibleText = await page.evaluate(EXTRACT_PAGE_TEXT_SCRIPT).catch(() => "");

      // Ask the LLM what to do next
      const userPrompt = buildPageAnalysisPrompt(
        currentUrl,
        pageTitle,
        visibleText as string,
        formFields as string,
        `Step ${steps}/${MAX_STEPS}`
      );

      let agentAction: AgentAction;
      try {
        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        });

        const content = llmResponse.choices?.[0]?.message?.content;
        const parsed = JSON.parse(
          typeof content === "string" ? content : JSON.stringify(content)
        );
        agentAction = parsed as AgentAction;
      } catch (llmErr) {
        log("llm_error", `LLM call failed: ${llmErr instanceof Error ? llmErr.message : String(llmErr)}`);
        // Retry once after a delay
        await page.waitForTimeout(2000);
        continue;
      }

      // Execute the action
      switch (agentAction.action) {
        case "fill_field": {
          log("fill_field", `${agentAction.selector} = "${agentAction.value.slice(0, 50)}..."`);
          try {
            const el = page.locator(agentAction.selector).first();
            if (agentAction.clear) {
              await el.fill("");
            }
            await el.fill(agentAction.value);
          } catch (e) {
            log("fill_error", `Failed to fill ${agentAction.selector}: ${e}`);
          }
          break;
        }

        case "select_option": {
          log("select_option", `${agentAction.selector} = "${agentAction.value}"`);
          try {
            await page.locator(agentAction.selector).first().selectOption({
              label: agentAction.value,
            }).catch(() =>
              page.locator(agentAction.selector).first().selectOption(agentAction.value)
            );
          } catch (e) {
            log("select_error", `Failed to select ${agentAction.selector}: ${e}`);
          }
          break;
        }

        case "click": {
          log("click", `${agentAction.selector} — ${agentAction.reason}`);
          try {
            await page.locator(agentAction.selector).first().click({ timeout: STEP_TIMEOUT_MS });
            await page.waitForTimeout(1500); // Wait for page reaction
          } catch (e) {
            log("click_error", `Failed to click ${agentAction.selector}: ${e}`);
          }
          break;
        }

        case "upload_file": {
          log("upload_file", `Uploading resume to ${agentAction.selector}`);
          if (resumePdfPath) {
            try {
              const fileInput = page.locator(agentAction.selector).first();
              await fileInput.setInputFiles(resumePdfPath);
              log("upload_success", "Resume uploaded");
            } catch (e) {
              log("upload_error", `Failed to upload: ${e}`);
            }
          } else {
            log("upload_skip", "No resume PDF available");
          }
          break;
        }

        case "wait": {
          log("wait", `${agentAction.ms}ms — ${agentAction.reason}`);
          await page.waitForTimeout(Math.min(agentAction.ms, 10000));
          break;
        }

        case "scroll_down": {
          log("scroll_down", agentAction.reason);
          await page.evaluate("window.scrollBy(0, 500)");
          await page.waitForTimeout(500);
          break;
        }

        case "captcha_detected": {
          log("captcha_manual", `Agent detected ${agentAction.type}`);
          if (agentAction.siteKey) {
            const solved = await solveCaptcha(
              agentAction.type,
              agentAction.siteKey,
              currentUrl
            );
            if (solved.success && solved.token) {
              await page.evaluate(buildInjectionScript(agentAction.type, solved.token));
              log("captcha_solved", "Token injected via agent detection");
            } else {
              return {
                status: "captcha",
                error: `CAPTCHA solve failed: ${solved.error}`,
                durationMs: Date.now() - startTime,
                steps,
              };
            }
          }
          break;
        }

        case "done": {
          const resultMap: Record<string, AgentResult["status"]> = {
            APPLIED: "applied",
            EXPIRED: "expired",
            FAILED: "failed",
            CAPTCHA: "captcha",
            LOGIN_ISSUE: "login_issue",
          };
          const status = resultMap[agentAction.result] || "failed";
          log("done", `${agentAction.result}: ${agentAction.reason}`);
          return {
            status,
            error: status !== "applied" ? agentAction.reason : undefined,
            durationMs: Date.now() - startTime,
            steps,
          };
        }

        default: {
          log("unknown_action", JSON.stringify(agentAction));
          break;
        }
      }
    } catch (stepErr) {
      log("step_error", `Step ${steps} failed: ${stepErr instanceof Error ? stepErr.message : String(stepErr)}`);
    }
  }

  // Max steps exceeded
  return {
    status: "failed",
    error: `Max steps (${MAX_STEPS}) exceeded without completion`,
    durationMs: Date.now() - startTime,
    steps,
  };
}

/** Download a resume from S3 storage to a local temp path */
export async function downloadResume(
  resumePath: string
): Promise<string | null> {
  try {
    if (resumePath.startsWith("http://") || resumePath.startsWith("https://")) {
      // Already a URL — download it
      const response = await fetch(resumePath);
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      const tmpPath = `/tmp/resume_${Date.now()}.pdf`;
      const fs = await import("fs/promises");
      await fs.writeFile(tmpPath, buffer);
      return tmpPath;
    }

    // It's a storage key — get a signed URL
    const result = await storageGet(resumePath);
    if (!result || !result.url) return null;
    const response = await fetch(result.url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const tmpPath = `/tmp/resume_${Date.now()}.pdf`;
    const fs = await import("fs/promises");
    await fs.writeFile(tmpPath, buffer);
    return tmpPath;
  } catch (err) {
    console.error("[Agent] Failed to download resume:", err);
    return null;
  }
}
