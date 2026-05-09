import { QueryClient } from "@tanstack/react-query";

/**
 * Phase 11A — Tuned defaults for owner-snappy experience.
 *  - staleTime 30s: most read endpoints are aggregations, refresh after 30s
 *  - gcTime 5min: keep the cache around so back-nav is instant
 *  - retry 1: fail fast on bad networks
 *  - refetchOnWindowFocus disabled: avoids unwanted refetch storms
 *  - refetchOnReconnect: yes, so going-online re-syncs
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      networkMode: "online",
    },
    mutations: {
      retry: 0,
      networkMode: "online",
    },
  },
});
