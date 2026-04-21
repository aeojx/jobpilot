/**
 * AutoApply module barrel export.
 */

export {
  startAutoApply,
  stopAutoApply,
  getAutoApplyStatus,
  getAutoApplyHistory,
  isAutoApplyRunning,
  type AutoApplyOptions,
} from "./launcher";

export { isBlockedUrl, isSSOUrl } from "./blocked-sites";
