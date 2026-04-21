/**
 * Blocked sites and patterns for AutoApply.
 * Jobs matching these patterns will be skipped automatically.
 */

/** Sites that are too problematic for automation (aggressive bot detection, etc.) */
export const BLOCKED_SITES: string[] = [
  "glassdoor.com",
  "google.com/about/careers",
  "accenture.com",
  "amazon.jobs",
  "meta.com/careers",
];

/** SSO domains the agent cannot authenticate through */
export const BLOCKED_SSO: string[] = [
  "accounts.google.com",
  "login.microsoftonline.com",
  "okta.com",
  "auth0.com",
  "myworkday.com", // Workday SSO
];

/** ATS platforms with unsolvable CAPTCHAs or heavy bot protection */
export const MANUAL_ATS: string[] = [
  "ibegin.tcsapps.com",
  "careers.google.com",
];

/** Check if a URL matches any blocked pattern */
export function isBlockedUrl(url: string): { blocked: boolean; reason?: string } {
  const lower = url.toLowerCase();

  for (const site of BLOCKED_SITES) {
    if (lower.includes(site)) {
      return { blocked: true, reason: `Blocked site: ${site}` };
    }
  }

  for (const ats of MANUAL_ATS) {
    if (lower.includes(ats)) {
      return { blocked: true, reason: `Manual-only ATS: ${ats}` };
    }
  }

  return { blocked: false };
}

/** Check if a URL is an SSO login page */
export function isSSOUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return BLOCKED_SSO.some((domain) => lower.includes(domain));
}
