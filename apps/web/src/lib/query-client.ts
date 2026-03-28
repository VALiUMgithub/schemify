import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient instance.
 * Imported in main.tsx and can be used for imperative cache updates
 * (e.g. queryClient.invalidateQueries) anywhere in the app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't re-fetch data just because the window regained focus.
      refetchOnWindowFocus: false,
      // Only retry failed requests once before surfacing an error.
      retry: 1,
      // Keep data "fresh" for 30 seconds before marking stale.
      staleTime: 30_000,
    },
    mutations: {
      // Do not auto-retry mutations — let the caller decide.
      retry: false,
    },
  },
});
