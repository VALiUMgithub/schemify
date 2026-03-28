/**
 * Re-exports the canonical API client so code that already imports
 * from `lib/api-client` continues to work without changes.
 *
 * Prefer importing from `services/api.ts` in new code.
 */
export { api as apiClient } from "../services/api";
