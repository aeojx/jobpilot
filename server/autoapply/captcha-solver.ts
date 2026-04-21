/**
 * CapSolver CAPTCHA solver integration.
 * Supports hCaptcha, reCAPTCHA v2, reCAPTCHA v3, Turnstile, and FunCaptcha.
 */

import { ENV } from "../_core/env";

const CAPSOLVER_API = "https://api.capsolver.com";

type CaptchaType =
  | "hcaptcha"
  | "recaptcha_v2"
  | "recaptcha_v3"
  | "turnstile"
  | "funcaptcha";

interface CaptchaDetectionResult {
  found: boolean;
  type?: CaptchaType;
  siteKey?: string;
  pageUrl?: string;
}

interface CaptchaSolveResult {
  success: boolean;
  token?: string;
  error?: string;
}

/** Detection script to inject into the page to find CAPTCHAs */
export const CAPTCHA_DETECTION_SCRIPT = `
(() => {
  const result = { found: false, type: null, siteKey: null };

  // hCaptcha
  const hcaptchaEl = document.querySelector('[data-sitekey][data-hcaptcha-widget-id], .h-captcha[data-sitekey], iframe[src*="hcaptcha.com"]');
  if (hcaptchaEl) {
    result.found = true;
    result.type = 'hcaptcha';
    result.siteKey = hcaptchaEl.getAttribute('data-sitekey') || '';
    if (!result.siteKey) {
      const parent = document.querySelector('.h-captcha[data-sitekey]');
      if (parent) result.siteKey = parent.getAttribute('data-sitekey');
    }
    return result;
  }

  // reCAPTCHA v2
  const recaptchaV2 = document.querySelector('.g-recaptcha[data-sitekey], iframe[src*="recaptcha/api2"]');
  if (recaptchaV2) {
    result.found = true;
    result.type = 'recaptcha_v2';
    result.siteKey = recaptchaV2.getAttribute('data-sitekey') || '';
    if (!result.siteKey) {
      const iframe = document.querySelector('iframe[src*="recaptcha"]');
      if (iframe) {
        const src = iframe.getAttribute('src') || '';
        const match = src.match(/[?&]k=([^&]+)/);
        if (match) result.siteKey = match[1];
      }
    }
    return result;
  }

  // reCAPTCHA v3 (invisible)
  const recaptchaV3Scripts = document.querySelectorAll('script[src*="recaptcha/api.js?render="], script[src*="recaptcha/enterprise.js?render="]');
  for (const script of recaptchaV3Scripts) {
    const src = script.getAttribute('src') || '';
    const match = src.match(/render=([^&]+)/);
    if (match && match[1] !== 'explicit') {
      result.found = true;
      result.type = 'recaptcha_v3';
      result.siteKey = match[1];
      return result;
    }
  }

  // Turnstile (Cloudflare)
  const turnstile = document.querySelector('.cf-turnstile[data-sitekey], iframe[src*="challenges.cloudflare.com"]');
  if (turnstile) {
    result.found = true;
    result.type = 'turnstile';
    result.siteKey = turnstile.getAttribute('data-sitekey') || '';
    return result;
  }

  // FunCaptcha (Arkose Labs)
  const funcaptcha = document.querySelector('#FunCaptcha, iframe[src*="funcaptcha.com"], iframe[src*="arkoselabs.com"]');
  if (funcaptcha) {
    result.found = true;
    result.type = 'funcaptcha';
    const publicKey = document.querySelector('[data-pkey]');
    result.siteKey = publicKey ? publicKey.getAttribute('data-pkey') : '';
    return result;
  }

  return result;
})()
`;

/** Map our type names to CapSolver task types */
function getTaskType(captchaType: CaptchaType): string {
  switch (captchaType) {
    case "hcaptcha":
      return "HCaptchaTaskProxyLess";
    case "recaptcha_v2":
      return "ReCaptchaV2TaskProxyLess";
    case "recaptcha_v3":
      return "ReCaptchaV3TaskProxyLess";
    case "turnstile":
      return "AntiTurnstileTaskProxyLess";
    case "funcaptcha":
      return "FunCaptchaTaskProxyLess";
    default:
      throw new Error(`Unsupported CAPTCHA type: ${captchaType}`);
  }
}

/** Create a CAPTCHA solving task on CapSolver */
async function createTask(
  captchaType: CaptchaType,
  siteKey: string,
  pageUrl: string
): Promise<string> {
  const apiKey = ENV.capsolverApiKey;
  if (!apiKey) {
    throw new Error("CAPSOLVER_API_KEY is not configured");
  }

  const taskPayload: Record<string, unknown> = {
    type: getTaskType(captchaType),
    websiteURL: pageUrl,
    websiteKey: siteKey,
  };

  // reCAPTCHA v3 needs a minimum score and action
  if (captchaType === "recaptcha_v3") {
    taskPayload.pageAction = "submit";
    taskPayload.minScore = 0.7;
  }

  const response = await fetch(`${CAPSOLVER_API}/createTask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientKey: apiKey,
      task: taskPayload,
    }),
  });

  const data = (await response.json()) as {
    errorId: number;
    errorCode?: string;
    errorDescription?: string;
    taskId?: string;
  };

  if (data.errorId !== 0 || !data.taskId) {
    throw new Error(
      `CapSolver createTask failed: ${data.errorCode} - ${data.errorDescription}`
    );
  }

  return data.taskId;
}

/** Poll for task result */
async function getTaskResult(
  taskId: string,
  maxWaitMs = 120000,
  pollIntervalMs = 3000
): Promise<string> {
  const apiKey = ENV.capsolverApiKey;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${CAPSOLVER_API}/getTaskResult`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientKey: apiKey,
        taskId,
      }),
    });

    const data = (await response.json()) as {
      errorId: number;
      errorCode?: string;
      errorDescription?: string;
      status: string;
      solution?: {
        gRecaptchaResponse?: string;
        token?: string;
      };
    };

    if (data.errorId !== 0) {
      throw new Error(
        `CapSolver getTaskResult failed: ${data.errorCode} - ${data.errorDescription}`
      );
    }

    if (data.status === "ready" && data.solution) {
      return data.solution.gRecaptchaResponse || data.solution.token || "";
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("CapSolver task timed out after " + maxWaitMs + "ms");
}

/** Solve a CAPTCHA: detect, create task, poll, return token */
export async function solveCaptcha(
  captchaType: CaptchaType,
  siteKey: string,
  pageUrl: string
): Promise<CaptchaSolveResult> {
  try {
    console.log(
      `[CAPTCHA] Solving ${captchaType} for ${pageUrl} (siteKey: ${siteKey.slice(0, 10)}...)`
    );
    const taskId = await createTask(captchaType, siteKey, pageUrl);
    console.log(`[CAPTCHA] Task created: ${taskId}`);
    const token = await getTaskResult(taskId);
    console.log(`[CAPTCHA] Solved! Token length: ${token.length}`);
    return { success: true, token };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[CAPTCHA] Failed: ${msg}`);
    return { success: false, error: msg };
  }
}

/** Inject a CAPTCHA token into the page */
export function buildInjectionScript(
  captchaType: CaptchaType,
  token: string
): string {
  switch (captchaType) {
    case "hcaptcha":
      return `
        document.querySelector('[name="h-captcha-response"]').value = ${JSON.stringify(token)};
        document.querySelector('[name="g-recaptcha-response"]') && (document.querySelector('[name="g-recaptcha-response"]').value = ${JSON.stringify(token)});
        if (typeof hcaptcha !== 'undefined') {
          try { hcaptcha.execute(); } catch(e) {}
        }
      `;
    case "recaptcha_v2":
    case "recaptcha_v3":
      return `
        document.querySelector('#g-recaptcha-response') && (document.querySelector('#g-recaptcha-response').value = ${JSON.stringify(token)});
        document.querySelectorAll('[name="g-recaptcha-response"]').forEach(el => el.value = ${JSON.stringify(token)});
        if (typeof ___grecaptcha_cfg !== 'undefined') {
          Object.entries(___grecaptcha_cfg.clients).forEach(([k, v]) => {
            try {
              const callback = Object.values(v).find(x => typeof x === 'object' && x !== null && typeof Object.values(x).find(y => typeof y === 'function') === 'function');
              if (callback) Object.values(callback).find(f => typeof f === 'function')(${JSON.stringify(token)});
            } catch(e) {}
          });
        }
      `;
    case "turnstile":
      return `
        document.querySelector('[name="cf-turnstile-response"]') && (document.querySelector('[name="cf-turnstile-response"]').value = ${JSON.stringify(token)});
        if (typeof turnstile !== 'undefined') {
          try { turnstile.getResponse = () => ${JSON.stringify(token)}; } catch(e) {}
        }
      `;
    case "funcaptcha":
      return `
        document.querySelector('#FunCaptcha-Token') && (document.querySelector('#FunCaptcha-Token').value = ${JSON.stringify(token)});
      `;
    default:
      return "";
  }
}
