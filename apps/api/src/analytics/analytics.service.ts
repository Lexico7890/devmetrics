import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@devmetrics/database';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaClient) {}

  async getSyncStatus(userId: string) {
    const activeJob = await this.prisma.syncJob.findFirst({
      where: {
        userId,
        status: {
          in: ['pending', 'active'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      isSyncing: !!activeJob,
      jobType: activeJob?.jobType || null,
    };
  }

  async getDashboardOverview(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { personalBests: true },
    });
    if (!user) throw new Error('User not found');
    
    let personalBests = typeof user.personalBests === 'string' 
      ? JSON.parse(user.personalBests) 
      : (user.personalBests as Record<string, number> || { commits: 0, prs: 0, lines: 0, activeDays: 0 });
    
    if (!personalBests.commits && !personalBests.prs) {
      personalBests = await this.seedHistoricalPersonalBests(userId);
    }

    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const sixtyDaysAgo = subDays(today, 60);

    const commitFilter = {
      userId,
      AND: [
        { message: { not: { startsWith: 'Merge ' } } },
        { message: { not: { startsWith: 'Merge branch' } } },
        { message: { not: { startsWith: 'Merge pull request' } } },
        { message: { not: { startsWith: 'merge ' } } },
      ],
    };

    // --- Deduplicated Counts using GroupBy SHA ---
    const commitsCurrentPeriodRaw = await this.prisma.commit.groupBy({
      by: ['sha'],
      where: { ...commitFilter, committedAt: { gte: thirtyDaysAgo } },
    });
    const commitsCurrentPeriod = commitsCurrentPeriodRaw.length;

    const commitsPreviousPeriodRaw = await this.prisma.commit.groupBy({
      by: ['sha'],
      where: {
        ...commitFilter,
        committedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });
    const commitsPreviousPeriod = commitsPreviousPeriodRaw.length;

    const commitChangePercent =
      commitsPreviousPeriod === 0
        ? 100
        : ((commitsCurrentPeriod - commitsPreviousPeriod) /
            commitsPreviousPeriod) *
          100;

    const prsCurrentPeriod = await this.prisma.pullRequest.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
    });

    const prsPreviousPeriod = await this.prisma.pullRequest.count({
      where: { userId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });

    const prChangePercent =
      prsPreviousPeriod === 0
        ? 100
        : ((prsCurrentPeriod - prsPreviousPeriod) / prsPreviousPeriod) * 100;

    // --- Deduplicated Lines Aggregate ---
    const commitDetailsCurrent = await this.prisma.commit.findMany({
      where: { ...commitFilter, committedAt: { gte: thirtyDaysAgo } },
      select: { sha: true, additions: true, deletions: true },
    });

    // Deduplicate in memory for sum (since groupBy doesn't allow sum over the groups easily in one call without Raw SQL)
    const uniqueCommitsMapCurrent = new Map<string, { a: number, d: number }>();
    commitDetailsCurrent.forEach(c => {
      if (!uniqueCommitsMapCurrent.has(c.sha)) {
        uniqueCommitsMapCurrent.set(c.sha, { a: c.additions, d: c.deletions });
      }
    });

    let totalAdditionsCurrent = 0;
    let totalDeletionsCurrent = 0;
    uniqueCommitsMapCurrent.forEach(val => {
      totalAdditionsCurrent += val.a;
      totalDeletionsCurrent += val.d;
    });

    const commitDetailsPrev = await this.prisma.commit.findMany({
      where: {
        ...commitFilter,
        committedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      select: { sha: true, additions: true, deletions: true },
    });

    const uniqueCommitsMapPrev = new Map<string, { a: number, d: number }>();
    commitDetailsPrev.forEach(c => {
      if (!uniqueCommitsMapPrev.has(c.sha)) {
        uniqueCommitsMapPrev.set(c.sha, { a: c.additions, d: c.deletions });
      }
    });

    let totalAdditionsPrev = 0;
    let totalDeletionsPrev = 0;
    uniqueCommitsMapPrev.forEach(val => {
      totalAdditionsPrev += val.a;
      totalDeletionsPrev += val.d;
    });

    const totalLinesCurrent = totalAdditionsCurrent + totalDeletionsCurrent;
    const totalLinesPrev = totalAdditionsPrev + totalDeletionsPrev;

    const linesChangePercent =
      totalLinesPrev === 0
        ? 100
        : ((totalLinesCurrent - totalLinesPrev) / totalLinesPrev) * 100;

    const commitsTimeline = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const countRaw = await this.prisma.commit.groupBy({
        by: ['sha'],
        where: {
          ...commitFilter,
          committedAt: { gte: start, lte: end },
        },
      });

      commitsTimeline.push({
        name: format(date, 'MMM dd'),
        commits: countRaw.length,
      });
    }

    const commitsForActive = await this.prisma.commit.findMany({
      where: { ...commitFilter, committedAt: { gte: thirtyDaysAgo } },
      select: { sha: true, committedAt: true },
    });

    // Deduplicate by SHA first for active days calculation
    const shaDateMap = new Map<string, string>();
    commitsForActive.forEach(c => {
        shaDateMap.set(c.sha, format(c.committedAt, 'yyyy-MM-dd'));
    });

    const uniqueDays = new Set(shaDateMap.values());
    const activeDaysCount = uniqueDays.size;

    let pbUpdated = false;
    if (commitsCurrentPeriod > (personalBests.commits || 0)) { personalBests.commits = commitsCurrentPeriod; pbUpdated = true; }
    if (prsCurrentPeriod > (personalBests.prs || 0)) { personalBests.prs = prsCurrentPeriod; pbUpdated = true; }
    if (totalLinesCurrent > (personalBests.lines || 0)) { personalBests.lines = totalLinesCurrent; pbUpdated = true; }
    if (activeDaysCount > (personalBests.activeDays || 0)) { personalBests.activeDays = activeDaysCount; pbUpdated = true; }

    if (pbUpdated) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { personalBests },
      });
    }

    const userRepos = await this.prisma.repository.findMany({
      where: { userId },
      select: { language: true },
    });

    const langCounts: Record<string, number> = {};
    let totalReposWithLang = 0;
    for (const repo of userRepos) {
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        totalReposWithLang++;
      }
    }

    const languages = Object.entries(langCounts)
      .map(([name, count]) => {
        return {
          name,
          value: Math.round((count / totalReposWithLang) * 100),
          color: this.getColorForLanguage(name),
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5

    const oneYearAgo = subDays(today, 364);
    const commitsForHeatmap = await this.prisma.commit.findMany({
      where: { ...commitFilter, committedAt: { gte: oneYearAgo } },
      select: { committedAt: true },
    });

    const heatmapData = Array.from({ length: 364 }).map((_, i) => {
      const d = subDays(today, 363 - i);
      return { date: format(d, 'yyyy-MM-dd'), count: 0 };
    });

    const heatmapMap = new Map(heatmapData.map((d) => [d.date, d]));

    for (const c of commitsForHeatmap) {
      const dateStr = format(c.committedAt, 'yyyy-MM-dd');
      if (heatmapMap.has(dateStr)) {
        heatmapMap.get(dateStr).count++;
      }
    }

    // --- POPULAR DAILY_METRICS IMPLÍCITAMENTE ---
    const totalPrsMerged = await this.prisma.pullRequest.count({
      where: { userId, state: 'closed', mergedAt: { not: null } },
    });

    const totalPrsOpened = await this.prisma.pullRequest.count({
      where: { userId, state: 'open' },
    });

    const topReposData = await this.prisma.repository.findMany({
      where: { userId },
      orderBy: { stargazersCount: 'desc' },
      take: 3,
      select: { name: true, stargazersCount: true },
    });

    await this.prisma.dailyMetric.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfDay(today),
        },
      },
      update: {
        totalCommits: commitsCurrentPeriod,
        totalAdditions: totalAdditionsCurrent,
        totalDeletions: totalDeletionsCurrent,
        totalPrsMerged,
        totalPrsOpened,
        languages: JSON.stringify(
          languages.length > 0
            ? languages
            : [{ name: 'Unknown', value: 100, color: '#52525b' }],
        ),
        topRepos: JSON.stringify(topReposData),
      },
      create: {
        userId,
        date: startOfDay(today),
        totalCommits: commitsCurrentPeriod,
        totalAdditions: totalAdditionsCurrent,
        totalDeletions: totalDeletionsCurrent,
        totalPrsMerged,
        totalPrsOpened,
        languages: JSON.stringify(
          languages.length > 0
            ? languages
            : [{ name: 'Unknown', value: 100, color: '#52525b' }],
        ),
        topRepos: JSON.stringify(topReposData),
      },
    });
    // ---------------------------------------------

    return {
      stats: {
        totalCommits: {
          value: commitsCurrentPeriod,
          change: `${commitChangePercent > 0 ? '+' : ''}${commitChangePercent.toFixed(1)}%`,
          trend: commitChangePercent >= 0 ? 'up' : 'down',
          subtext: `${commitsCurrentPeriod - commitsPreviousPeriod > 0 ? '+' : ''}${commitsCurrentPeriod - commitsPreviousPeriod} vs prev period`,
          personalBest: personalBests.commits || 0,
        },
        prsActivity: {
          value: prsCurrentPeriod,
          change: `${prChangePercent > 0 ? '+' : ''}${prChangePercent.toFixed(1)}%`,
          trend: prChangePercent >= 0 ? 'up' : 'down',
          subtext: `Average ${(prsCurrentPeriod / 30).toFixed(1)}/day`,
          personalBest: personalBests.prs || 0,
        },
        linesChanged: {
          value:
            totalLinesCurrent >= 1000
              ? `${(totalLinesCurrent / 1000).toFixed(1)}k`
              : totalLinesCurrent.toString(),
          change: `${linesChangePercent > 0 ? '+' : ''}${linesChangePercent.toFixed(1)}%`,
          trend: linesChangePercent >= 0 ? 'up' : 'down',
          subtext: `+${totalAdditionsCurrent >= 1000 ? (totalAdditionsCurrent / 1000).toFixed(1) + 'k' : totalAdditionsCurrent} lines added`,
          personalBest: personalBests.lines || 0,
        },
        activeDays: {
          value: activeDaysCount,
          change: `${Math.round((activeDaysCount / 30) * 100)}%`,
          trend: 'neutral',
          subtext: 'Out of last 30 days',
          personalBest: personalBests.activeDays || 0,
        },
      },
      timeline: commitsTimeline,
      languages:
        languages.length > 0
          ? languages
          : [{ name: 'Unknown', value: 100, color: '#52525b' }],
      heatmap: heatmapData,
    };
  }

  async getPullRequests(
    userId: string,
    options: {
      cursor?: string;
      limit?: number;
      state?: string;
    },
  ) {
    const { cursor, limit = 10, state } = options;

    const where: any = { userId };
    if (state && state !== 'All') {
      where.state = state.toLowerCase();
    }

    const [prs, total] = await Promise.all([
      this.prisma.pullRequest.findMany({
        where,
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { createdAt: 'desc' },
        include: {
          repository: {
            select: { name: true, fullName: true },
          },
          user: {
            select: { username: true, login: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.pullRequest.count({ where }),
    ]);

    const hasNextPage = prs.length > limit;
    const items = hasNextPage ? prs.slice(0, -1) : prs;
    const nextCursor = hasNextPage ? items[items.length - 1]?.id : undefined;

    const formattedPRs = items.map((pr) => {
      const additions = pr.additions || 0;
      const deletions = pr.deletions || 0;
      const totalChanges = additions + deletions;

      let size: 'XS' | 'S' | 'M' | 'L' = 'S';
      if (totalChanges > 100) size = 'M';
      if (totalChanges > 500) size = 'L';
      if (totalChanges < 10) size = 'XS';

      const timeToMerge =
        pr.mergedAt && pr.createdAt
          ? this.calculateTimeToMerge(pr.createdAt, pr.mergedAt)
          : null;

      return {
        id: pr.number,
        githubId: pr.githubId.toString(),
        title: pr.title,
        repo: pr.repository.name,
        repoFullName: pr.repository.fullName,
        author: pr.user.username || pr.user.login,
        authorImg: pr.user.avatarUrl,
        status: this.formatPrStatus(pr.state, pr.isDraft, !!pr.mergedAt),
        size,
        additions,
        deletions,
        time: this.formatTimeAgo(pr.createdAt),
        reviews: pr.reviewComments,
        mergeTime: timeToMerge,
        createdAt: pr.createdAt,
        mergedAt: pr.mergedAt,
        isDraft: pr.isDraft,
      };
    });

    return {
      items: formattedPRs,
      meta: {
        total,
        limit,
        hasNextPage,
        hasPrevPage: !!cursor,
        nextCursor,
        startCount: cursor ? undefined : 1,
        endCount: Math.min(limit, items.length),
      },
    };
  }

  private formatPrStatus(
    state: string,
    isDraft: boolean,
    isMerged: boolean,
  ): string {
    if (isMerged) return 'Merged';
    if (isDraft) return 'Draft';
    if (state === 'open') return 'Open';
    if (state === 'closed') return 'Closed';
    return state;
  }

  private calculateTimeToMerge(createdAt: Date, mergedAt: Date): string {
    const diffMs = mergedAt.getTime() - createdAt.getTime();
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

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  }

  private getColorForLanguage(lang: string): string {
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
      VisualBasic: '#945db7',
    };
    return colors[lang] || '#a1a1aa';
  }

  private async seedHistoricalPersonalBests(userId: string): Promise<Record<string, number>> {
    const commitFilter = {
      userId,
      AND: [
        { message: { not: { startsWith: 'Merge ' } } },
        { message: { not: { startsWith: 'Merge branch' } } },
        { message: { not: { startsWith: 'Merge pull request' } } },
        { message: { not: { startsWith: 'merge ' } } },
      ],
    };

    const allCommitsRaw = await this.prisma.commit.findMany({
      where: commitFilter,
      select: { sha: true, committedAt: true, additions: true, deletions: true },
      orderBy: { committedAt: 'asc' },
    });

    // Deduplicate SHAs while keeping the first occurrence (since they are ordered by date)
    const shaMap = new Map<string, typeof allCommitsRaw[0]>();
    allCommitsRaw.forEach(c => {
        if (!shaMap.has(c.sha)) shaMap.set(c.sha, c);
    });
    const allCommits = Array.from(shaMap.values());


    let maxCommits = 0;
    let maxLines = 0;
    let maxActiveDays = 0;

    let left = 0;
    let currentLines = 0;
    let leftDays = 0;
    const dayCounts = new Map<string, number>();

    const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

    for (let right = 0; right < allCommits.length; right++) {
      currentLines += allCommits[right].additions + allCommits[right].deletions;
      const rightDate = format(allCommits[right].committedAt, 'yyyy-MM-dd');
      dayCounts.set(rightDate, (dayCounts.get(rightDate) || 0) + 1);

      while (allCommits[right].committedAt.getTime() - allCommits[left].committedAt.getTime() > WINDOW_MS) {
        currentLines -= allCommits[left].additions + allCommits[left].deletions;
        left++;
      }
      
      while (allCommits[right].committedAt.getTime() - allCommits[leftDays].committedAt.getTime() > WINDOW_MS) {
        const leftDate = format(allCommits[leftDays].committedAt, 'yyyy-MM-dd');
        const count = dayCounts.get(leftDate);
        if (count === 1) {
          dayCounts.delete(leftDate);
        } else if (count && count > 1) {
          dayCounts.set(leftDate, count - 1);
        }
        leftDays++;
      }

      const currentCommits = right - left + 1;
      if (currentCommits > maxCommits) maxCommits = currentCommits;
      if (currentLines > maxLines) maxLines = currentLines;
      if (dayCounts.size > maxActiveDays) maxActiveDays = dayCounts.size;
    }

    const allPrs = await this.prisma.pullRequest.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    let maxPrs = 0;
    let leftPr = 0;
    for (let right = 0; right < allPrs.length; right++) {
      while (allPrs[right].createdAt.getTime() - allPrs[leftPr].createdAt.getTime() > WINDOW_MS) {
        leftPr++;
      }
      const currentPrs = right - leftPr + 1;
      if (currentPrs > maxPrs) maxPrs = currentPrs;
    }

    const pb = {
      commits: maxCommits,
      prs: maxPrs,
      lines: maxLines,
      activeDays: maxActiveDays,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { personalBests: pb },
    });
    
    return pb;
  }
}
