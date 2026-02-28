export const APP_NAME = "DevMetrics";

export const GITHUB_API_BASE = "https://api.github.com";
export const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
export const GITHUB_TOKEN_URL =
  "https://github.com/login/oauth/access_token";

export const CACHE_TTL = {
  SHORT: 60,          // 1 min
  MEDIUM: 300,        // 5 min
  LONG: 3600,         // 1 hour
  AGGREGATIONS: 7200, // 2 hours
  SESSION: 86400,     // 24 hours
} as const;

export const SYNC_CONFIG = {
  INITIAL_DAYS: 90,
  MAX_RETRIES: 3,
  BATCH_SIZE: 100,
} as const;

export const JOB_TYPES = {
  SYNC_COMMITS: "sync-commits",
  SYNC_PRS: "sync-pull-requests",
  AGGREGATE_METRICS: "aggregate-metrics",
  CLEANUP: "cleanup-old-data",
} as const;

export const JOB_PRIORITIES = {
  HIGH: 10,   // webhooks, real-time
  NORMAL: 5,  // scheduled syncs
  LOW: 1,     // backfills
} as const;