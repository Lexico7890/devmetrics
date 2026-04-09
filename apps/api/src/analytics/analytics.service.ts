import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@devmetrics/database';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaClient) { }

  async getSyncStatus(userId: string) {
    const activeJob = await this.prisma.syncJob.findFirst({
      where: {
        userId,
        status: {
          in: ['pending', 'active']
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      isSyncing: !!activeJob,
      jobType: activeJob?.jobType || null
    };
  }

  async getDashboardOverview(userId: string) {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const sixtyDaysAgo = subDays(today, 60);

    const commitsCurrentPeriod = await this.prisma.commit.count({
      where: { userId, committedAt: { gte: thirtyDaysAgo } }
    });

    const commitsPreviousPeriod = await this.prisma.commit.count({
      where: { userId, committedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });

    const commitChangePercent = commitsPreviousPeriod === 0
      ? 100
      : ((commitsCurrentPeriod - commitsPreviousPeriod) / commitsPreviousPeriod) * 100;

    const prsCurrentPeriod = await this.prisma.pullRequest.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } }
    });

    const prsPreviousPeriod = await this.prisma.pullRequest.count({
      where: { userId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });

    const prChangePercent = prsPreviousPeriod === 0
      ? 100
      : ((prsCurrentPeriod - prsPreviousPeriod) / prsPreviousPeriod) * 100;

    const changesAgg = await this.prisma.commit.aggregate({
      where: { userId, committedAt: { gte: thirtyDaysAgo } },
      _sum: { additions: true, deletions: true }
    });
    const changesPrevAgg = await this.prisma.commit.aggregate({
      where: { userId, committedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { additions: true, deletions: true }
    });

    const totalLinesCurrent = (changesAgg._sum.additions || 0) + (changesAgg._sum.deletions || 0);
    const totalLinesPrev = (changesPrevAgg._sum.additions || 0) + (changesPrevAgg._sum.deletions || 0);

    const linesChangePercent = totalLinesPrev === 0
      ? 100
      : ((totalLinesCurrent - totalLinesPrev) / totalLinesPrev) * 100;

    const commitsTimeline = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const countMain = await this.prisma.commit.count({
        where: {
          userId,
          committedAt: { gte: start, lte: end },
        }
      });

      commitsTimeline.push({
        name: format(date, 'MMM dd'),
        commits: countMain
      });
    }

    const commitsForActive = await this.prisma.commit.findMany({
      where: { userId, committedAt: { gte: thirtyDaysAgo } },
      select: { committedAt: true }
    });

    const uniqueDays = new Set(commitsForActive.map(c => format(c.committedAt, 'yyyy-MM-dd')));
    const activeDaysCount = uniqueDays.size;

    const userRepos = await this.prisma.repository.findMany({
      where: { userId },
      select: { language: true }
    });

    const langCounts: Record<string, number> = {};
    let totalReposWithLang = 0;
    for (const repo of userRepos) {
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        totalReposWithLang++;
      }
    }

    const languages = Object.entries(langCounts).map(([name, count]) => {
      return {
        name,
        value: Math.round((count / totalReposWithLang) * 100),
        color: this.getColorForLanguage(name),
      };
    }).sort((a, b) => b.value - a.value).slice(0, 5); // top 5

    const oneYearAgo = subDays(today, 364);
    const commitsForHeatmap = await this.prisma.commit.findMany({
      where: { userId, committedAt: { gte: oneYearAgo } },
      select: { committedAt: true }
    });

    const heatmapData = Array.from({ length: 364 }).map((_, i) => {
      const d = subDays(today, 363 - i);
      return { date: format(d, 'yyyy-MM-dd'), count: 0 };
    });

    const heatmapMap = new Map(heatmapData.map(d => [d.date, d]));

    for (const c of commitsForHeatmap) {
      const dateStr = format(c.committedAt, 'yyyy-MM-dd');
      if (heatmapMap.has(dateStr)) {
        heatmapMap.get(dateStr)!.count++;
      }
    }

    // --- POPULAR DAILY_METRICS IMPLÍCITAMENTE ---
    const totalPrsMerged = await this.prisma.pullRequest.count({
      where: { userId, state: 'closed', mergedAt: { not: null } }
    });

    const totalPrsOpened = await this.prisma.pullRequest.count({
      where: { userId, state: 'open' }
    });

    const topReposData = await this.prisma.repository.findMany({
      where: { userId },
      orderBy: { stargazersCount: 'desc' },
      take: 3,
      select: { name: true, stargazersCount: true }
    });

    await this.prisma.dailyMetric.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfDay(today)
        }
      },
      update: {
        totalCommits: commitsCurrentPeriod,
        totalAdditions: changesAgg._sum.additions || 0,
        totalDeletions: changesAgg._sum.deletions || 0,
        totalPrsMerged,
        totalPrsOpened,
        languages: JSON.stringify(languages.length > 0 ? languages : [{ name: 'Unknown', value: 100, color: '#52525b' }]),
        topRepos: JSON.stringify(topReposData)
      },
      create: {
        userId,
        date: startOfDay(today),
        totalCommits: commitsCurrentPeriod,
        totalAdditions: changesAgg._sum.additions || 0,
        totalDeletions: changesAgg._sum.deletions || 0,
        totalPrsMerged,
        totalPrsOpened,
        languages: JSON.stringify(languages.length > 0 ? languages : [{ name: 'Unknown', value: 100, color: '#52525b' }]),
        topRepos: JSON.stringify(topReposData)
      }
    });
    // ---------------------------------------------

    return {
      stats: {
        totalCommits: {
          value: commitsCurrentPeriod,
          change: `${commitChangePercent > 0 ? '+' : ''}${commitChangePercent.toFixed(1)}%`,
          trend: commitChangePercent >= 0 ? 'up' : 'down',
          subtext: `${commitsCurrentPeriod - commitsPreviousPeriod > 0 ? '+' : ''}${commitsCurrentPeriod - commitsPreviousPeriod} vs prev period`
        },
        prsActivity: {
          value: prsCurrentPeriod,
          change: `${prChangePercent > 0 ? '+' : ''}${prChangePercent.toFixed(1)}%`,
          trend: prChangePercent >= 0 ? 'up' : 'down',
          subtext: `Average ${(prsCurrentPeriod / 30).toFixed(1)}/day`
        },
        linesChanged: {
          value: totalLinesCurrent >= 1000 ? `${(totalLinesCurrent / 1000).toFixed(1)}k` : totalLinesCurrent.toString(),
          change: `${linesChangePercent > 0 ? '+' : ''}${linesChangePercent.toFixed(1)}%`,
          trend: linesChangePercent >= 0 ? 'up' : 'down',
          subtext: `Net ${(changesAgg._sum.additions || 0) >= 1000 ? `+${((changesAgg._sum.additions || 0) / 1000).toFixed(1)}k` : `+${changesAgg._sum.additions || 0}`} additions`
        },
        activeDays: {
          value: activeDaysCount,
          change: `${Math.round((activeDaysCount / 30) * 100)}%`,
          trend: 'neutral',
          subtext: 'Out of last 30 days'
        }
      },
      timeline: commitsTimeline,
      languages: languages.length > 0 ? languages : [{ name: 'Unknown', value: 100, color: '#52525b' }],
      heatmap: heatmapData
    };
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
}
