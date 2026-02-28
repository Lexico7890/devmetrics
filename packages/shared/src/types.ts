export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  private: boolean;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  default_branch: string;
}

export interface SyncJobPayload {
  userId: string;
  repositoryId?: string;
  since?: string;
  until?: string;
}

export type JobStatus = "pending" | "running" | "completed" | "failed";
export type PrState = "open" | "closed" | "merged";