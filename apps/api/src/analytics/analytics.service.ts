import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@devmetrics/database';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaClient) {}

  async getDashboardOverview(userId: string) {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const sixtyDaysAgo = subDays(today, 60);

    // 1. Total Commits
    const commitsCurrentPeriod = await this.prisma.commit.count({
      where: { userId, committedAt: { gte: thirtyDaysAgo } }
    });
    
    const commitsPreviousPeriod = await this.prisma.commit.count({
      where: { userId, committedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });

    const commitChangePercent = commitsPreviousPeriod === 0 
      ? 100 
      : ((commitsCurrentPeriod - commitsPreviousPeriod) / commitsPreviousPeriod) * 100;

    // 2. PRs Merged
    const prsCurrentPeriod = await this.prisma.pullRequest.count({
      where: { userId, state: 'closed', mergedAt: { not: null }, createdAt: { gte: thirtyDaysAgo } }
    });

    const prsPreviousPeriod = await this.prisma.pullRequest.count({
      where: { userId, state: 'closed', mergedAt: { not: null }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });

    const prChangePercent = prsPreviousPeriod === 0 
      ? 100 
      : ((prsCurrentPeriod - prsPreviousPeriod) / prsPreviousPeriod) * 100;

    // 3. Lines Changed
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

    // 4. Commits Timeline (Daily)
    const commitsTimeline = [];
    for (let i = 29; i >= 0; i--) {
        const date = subDays(today, i);
        const start = startOfDay(date);
        const end = endOfDay(date);

        const countMain = await this.prisma.commit.count({
            where: {
                userId,
                committedAt: { gte: start, lte: end },
                // Idealmente, filtrar por "branch", pero `Commit` no tiene `branch` en el schema.
                // Simulamos con data o usamos reporistory defaultBranch en query futura.
            }
        });

        // Simplemente mapeamos a "main" al carecer modelo de rama
        commitsTimeline.push({
            name: format(date, 'MMM dd'),
            main: countMain,
            development: Math.floor(countMain * 0.3) // Solo un pequeño mockup para no romper UI si hay 2 ramas
        });
    }

    // 5. Active Days
    const commitsForActive = await this.prisma.commit.findMany({
      where: { userId, committedAt: { gte: thirtyDaysAgo } },
      select: { committedAt: true }
    });
    
    const uniqueDays = new Set(commitsForActive.map(c => format(c.committedAt, 'yyyy-MM-dd')));
    const activeDaysCount = uniqueDays.size;

    // 6. Languages from top repos
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

    return {
      stats: {
        totalCommits: {
            value: commitsCurrentPeriod,
            change: `${commitChangePercent > 0 ? '+' : ''}${commitChangePercent.toFixed(1)}%`,
            trend: commitChangePercent >= 0 ? 'up' : 'down',
            subtext: `${commitsCurrentPeriod - commitsPreviousPeriod > 0 ? '+' : ''}${commitsCurrentPeriod - commitsPreviousPeriod} vs prev period`
        },
        prsMerged: {
            value: prsCurrentPeriod,
            change: `${prChangePercent > 0 ? '+' : ''}${prChangePercent.toFixed(1)}%`,
            trend: prChangePercent >= 0 ? 'up' : 'down',
            subtext: `Average ${(prsCurrentPeriod / 30).toFixed(1)}/day`
        },
        linesChanged: {
            value: totalLinesCurrent >= 1000 ? `${(totalLinesCurrent/1000).toFixed(1)}k` : totalLinesCurrent.toString(),
            change: `${linesChangePercent > 0 ? '+' : ''}${linesChangePercent.toFixed(1)}%`,
            trend: linesChangePercent >= 0 ? 'up' : 'down',
            subtext: `Net ${(changesAgg._sum.additions || 0) >= 1000 ? `+${((changesAgg._sum.additions || 0)/1000).toFixed(1)}k` : `+${changesAgg._sum.additions || 0}`} additions`
        },
        activeDays: {
            value: activeDaysCount,
            change: '0%', // Mock for now
            trend: 'neutral',
            subtext: 'Out of last 30 days'
        }
      },
      timeline: commitsTimeline,
      languages: languages.length > 0 ? languages : [{ name: 'Unknown', value: 100, color: '#52525b' }],
      heatmap: [] // El frontend lo maneja con su loop simulado por ahora debido a límites de la tabla Commit
    };
  }

  private getColorForLanguage(lang: string): string {
    const colors = {
        TypeScript: '#3b82f6',
        JavaScript: '#facc15',
        Rust: '#6366f1',
        Go: '#a855f7',
        Python: '#34d399',
        Java: '#f43f5e',
    };
    return colors[lang] || '#a1a1aa';
  }
}
