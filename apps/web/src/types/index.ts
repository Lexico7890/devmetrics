export type NavigationItem = 'dashboard' | 'pr-analytics' | 'repositories' | 'onboarding' | 'settings' | 'repo-detail' | 'pr-list';

export interface KPIData {
  label: string;
  value: string;
  change: number;
  subtext: string;
  trend: 'up' | 'down' | 'neutral';
  color?: string;
}

export interface ChartData {
  name: string;
  main: number;
  development: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  repo: string;
  time: string;
  author: string;
  authorImage: string;
  status: 'merged' | 'open' | 'closed';
  type: 'pr' | 'commit' | 'issue';
  impact?: { additions: number; deletions: number };
}

export interface LanguageData {
  name: string;
  value: number;
  color: string;
}

export interface RepositoryExtended {
  id: string;
  name: string;
  visibility: 'Public' | 'Private';
  language: string;
  langColor: string;
  stars: number;
  commits: number;
  contributors: number;
  loc: string;
  lastActivity: string;
}
