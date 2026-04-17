

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  draft: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
  comments: number;
  review_comments: number;
  merged_at: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  stats?: {
    additions: number;
    deletions: number;
  };
  files?: Array<{ filename: string }>;
}

export function calculateTimeToMerge(createdAt: Date | string, mergedAt: Date | string): string {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const merged = typeof mergedAt === 'string' ? new Date(mergedAt) : mergedAt;
  
  const diffMs = merged.getTime() - created.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (hours > 0) {
    return `${hours}.${Math.floor(minutes / 6)}h`;
  }
  return `${minutes}m`;
}

export function formatPrStatus(state: string, isDraft: boolean, isMerged: boolean): string {
  if (isMerged) return 'Merged';
  if (isDraft) return 'Draft';
  if (state === 'open') return 'Open';
  if (state === 'closed') return 'Closed';
  return state;
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function calculatePrSize(additions: number, deletions: number): 'XS' | 'S' | 'M' | 'L' {
  const totalChanges = additions + deletions;
  if (totalChanges < 10) return 'XS';
  if (totalChanges > 100) return 'M';
  if (totalChanges > 500) return 'L';
  return 'S';
}

export function calculateAverageMergeTime(prs: GitHubPullRequest[]): number | null {
  const mergedPrs = prs.filter(pr => pr.merged_at !== null && pr.created_at !== null);
  if (mergedPrs.length === 0) return null;

  const totalMs = mergedPrs.reduce((acc, pr) => {
    const created = new Date(pr.created_at).getTime();
    const merged = new Date(pr.merged_at!).getTime();
    return acc + (merged - created);
  }, 0);

  return totalMs / mergedPrs.length;
}

export function calculatePrStats(prs: GitHubPullRequest[]): {
  total: number;
  open: number;
  closed: number;
  merged: number;
  averageMergeTime: number | null;
  averageAdditions: number;
  averageDeletions: number;
} {
  const open = prs.filter(pr => pr.state === 'open').length;
  const closed = prs.filter(pr => pr.state === 'closed' && pr.merged_at === null).length;
  const merged = prs.filter(pr => pr.merged_at !== null).length;
  
  const avgAdditions = prs.length > 0 
    ? prs.reduce((acc, pr) => acc + (pr.additions || 0), 0) / prs.length 
    : 0;
  
  const avgDeletions = prs.length > 0 
    ? prs.reduce((acc, pr) => acc + (pr.deletions || 0), 0) / prs.length 
    : 0;

  return {
    total: prs.length,
    open,
    closed,
    merged,
    averageMergeTime: calculateAverageMergeTime(prs),
    averageAdditions: Math.round(avgAdditions),
    averageDeletions: Math.round(avgDeletions),
  };
}

export function calculateCommitStats(commits: GitHubCommit[]): {
  total: number;
  totalAdditions: number;
  totalDeletions: number;
  totalFilesChanged: number;
  averageAdditions: number;
  averageDeletions: number;
} {
  const totalAdditions = commits.reduce((acc, c) => acc + (c.stats?.additions || 0), 0);
  const totalDeletions = commits.reduce((acc, c) => acc + (c.stats?.deletions || 0), 0);
  const totalFilesChanged = commits.reduce((acc, c) => acc + (c.files?.length || 0), 0);

  return {
    total: commits.length,
    totalAdditions,
    totalDeletions,
    totalFilesChanged,
    averageAdditions: commits.length > 0 ? Math.round(totalAdditions / commits.length) : 0,
    averageDeletions: commits.length > 0 ? Math.round(totalDeletions / commits.length) : 0,
  };
}

export function getColorForLanguage(lang: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3b82f6',
    JavaScript: '#facc15',
    Rust: '#6366f1',
    Go: '#a855f7',
    Python: '#34d399',
    Java: '#f43f5e',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    C: '#555555',
    'C++': '#f34b7d',
    PHP: '#4f5d94',
    Ruby: '#701516',
    Swift: '#fa7343',
    Kotlin: '#0096d6',
    Dart: '#00677F',
    'C#': '#519aba',
    PowerShell: '#012456',
    Makefile: '#427819',
    Dockerfile: '#384d54',
    Markdown: '#000000',
    JSON: '#000000',
    YAML: '#cb171f',
    TOML: '#9d2b00',
    Lua: '#000080',
    R: '#276dc3',
    SQL: '#005fcc',
    Assembly: '#000000',
    ObjectiveC: '#438eff',
    Perl: '#0298c3',
    Scala: '#c22d41',
    Haskell: '#5e5086',
    Elixir: '#6e4a7e',
    Clojure: '#db5826',
    'F#': '#31572c',
    'VB.NET': '#945db7',
    'VisualBasic': '#945db7',
  };
  return colors[lang] || '#a1a1aa';
}

export function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function calculateActivityTrend(currentPeriod: number, previousPeriod: number): 'up' | 'down' | 'neutral' {
  if (currentPeriod > previousPeriod) return 'up';
  if (currentPeriod < previousPeriod) return 'down';
  return 'neutral';
}