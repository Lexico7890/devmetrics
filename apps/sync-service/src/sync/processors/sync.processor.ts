import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaClient } from '@devmetrics/database';
import { CryptoService } from '../../common/crypto.service';
import { RateLimiterService } from '../../common/rate-limiter.service';

@Processor('github-sync')
export class SyncProcessor extends WorkerHost {
    private readonly logger = new Logger(SyncProcessor.name);

    constructor(
        private prisma: PrismaClient,
        private crypto: CryptoService,
        private rateLimiter: RateLimiterService,
        @InjectQueue('github-sync') private readonly syncQueue: Queue
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Procesando Job BullMQ: ${job.id} - Tipo: ${job.name}`);

        try {
            switch (job.name) {
                case 'sync-user-repos':
                    return await this.handleSyncUserRepos(job);
                case 'sync-repo-commits':
                    return await this.handleSyncRepoCommits(job);
                case 'sync-commits':
                    return await this.handleWebhookCommits(job);
                case 'sync-pr':
                    return await this.handleWebhookPR(job);
                default:
                    this.logger.warn(`Job type ${job.name} no soportado`);
            }
        } catch (error) {
            this.logger.error(`Error en Job ${job.id} (${job.name}):`, error.message);

            const syncJobId = job.data?.syncJobId;
            if (syncJobId) {
                await this.prisma.syncJob.update({
                    where: { id: syncJobId },
                    data: {
                        status: 'failed',
                        errorMessage: error.message,
                        attempts: job.attemptsMade + 1
                    },
                });
            }
            throw error;
        }
    }

    private async handleSyncUserRepos(job: Job) {
        const { syncJobId, userId } = job.data;

        await this.prisma.syncJob.update({
            where: { id: syncJobId },
            data: { status: 'processing', startedAt: new Date() },
        });

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.accessToken) throw new Error('Usuario o Access Token no encontrado');

        const isLimited = await this.rateLimiter.isRateLimited(`gh-api-${userId}`, 4000, 3600000);
        if (isLimited) throw new Error('RateLimitExceeded');

        const { Octokit } = await eval('import("octokit")');
        const octokit = new Octokit({ auth: this.crypto.decrypt(user.accessToken) });
        const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
            visibility: 'all',
            per_page: 100,
        });

        for (const repo of repos) {
            const savedRepo = await this.prisma.repository.upsert({
                where: { userId_githubId: { userId: user.id, githubId: repo.id } },
                update: {
                    name: repo.name,
                    fullName: repo.full_name,
                    stargazersCount: repo.stargazers_count,
                    language: repo.language,
                    updatedAt: new Date(),
                },
                create: {
                    githubId: repo.id,
                    userId: user.id,
                    name: repo.name,
                    fullName: repo.full_name,
                    isPrivate: repo.private,
                    stargazersCount: repo.stargazers_count || 0,
                    defaultBranch: repo.default_branch,
                    language: repo.language,
                },
            });

            const commitJobRecord = await this.prisma.syncJob.create({
                data: {
                    userId,
                    repositoryId: savedRepo.id,
                    jobType: 'SYNC_COMMITS',
                    status: 'pending',
                    priority: 5,
                },
            });

            await this.syncQueue.add('sync-repo-commits', {
                syncJobId: commitJobRecord.id,
                userId,
                repositoryId: savedRepo.id,
                owner: repo.owner.login,
                repo: repo.name,
            }, {
                jobId: commitJobRecord.id
            });
        }

        await this.prisma.syncJob.update({
            where: { id: syncJobId },
            data: { status: 'completed', completedAt: new Date() },
        });

        return { status: 'success', reposSynced: repos.length };
    }

    private async handleSyncRepoCommits(job: Job) {
        const { syncJobId, userId, repositoryId, owner, repo } = job.data;

        await this.prisma.syncJob.update({
            where: { id: syncJobId },
            data: { status: 'processing', startedAt: new Date() },
        });

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.accessToken) throw new Error('Usuario o Access Token no encontrado');

        const isLimited = await this.rateLimiter.isRateLimited(`gh-api-${userId}`, 4000, 3600000);
        if (isLimited) throw new Error('RateLimitExceeded');

        const { Octokit } = await eval('import("octokit")');
        const octokit = new Octokit({ auth: this.crypto.decrypt(user.accessToken) });

        const { data: commits } = await octokit.rest.repos.listCommits({
            owner,
            repo,
            author: user.login,
            per_page: 100,
        });

        for (const commitData of commits) {
            let additions = 0;
            let deletions = 0;
            let filesChanged = 0;

            const existing = await this.prisma.commit.findUnique({
                where: { sha_repositoryId: { sha: commitData.sha, repositoryId } }
            });

            if (!existing) {
                const isDetailLimited = await this.rateLimiter.isRateLimited(`gh-api-${userId}`, 4000, 3600000);
                if (!isDetailLimited) {
                    try {
                        const { data: detail } = await octokit.rest.repos.getCommit({
                            owner,
                            repo,
                            ref: commitData.sha
                        });
                        additions = detail.stats?.additions ?? 0;
                        deletions = detail.stats?.deletions ?? 0;
                        filesChanged = detail.files?.length ?? 0;
                    } catch (e) {
                        this.logger.warn(`Could not fetch details for historical commit ${commitData.sha}`);
                    }
                }

                await this.prisma.commit.create({
                    data: {
                        sha: commitData.sha,
                        repositoryId,
                        userId,
                        message: commitData.commit.message,
                        additions,
                        deletions,
                        filesChanged,
                        committedAt: new Date(commitData.commit.author.date || commitData.commit.committer.date || new Date()),
                    }
                });
            }
        }

        // --- Fetch Historical Pull Requests ---
        const { data: prs } = await octokit.rest.pulls.list({
            owner,
            repo,
            state: 'all',
            per_page: 100,
        });

        for (const pr of prs) {
            // Only sync PRs where the author belongs to the user being synced
            if (pr.user?.login?.toLowerCase() !== user.login.toLowerCase()) {
                continue;
            }

            const existingPR = await this.prisma.pullRequest.findUnique({
                where: { githubId_repositoryId: { githubId: pr.id, repositoryId } }
            });

            if (!existingPR) {
                let fullPr = pr as any;
                const isDetailLimited = await this.rateLimiter.isRateLimited(`gh-api-${userId}`, 4000, 3600000);
                if (!isDetailLimited) {
                    try {
                        const { data: detail } = await octokit.rest.pulls.get({
                            owner,
                            repo,
                            pull_number: pr.number
                        });
                        fullPr = detail;
                    } catch (e) {
                        this.logger.warn(`Could not fetch details for historical PR ${pr.number}`);
                    }
                }

                await this.prisma.pullRequest.create({
                    data: {
                        githubId: fullPr.id,
                        repositoryId,
                        userId,
                        number: fullPr.number,
                        title: fullPr.title,
                        state: fullPr.state,
                        isDraft: fullPr.draft ?? false,
                        additions: fullPr.additions || 0,
                        deletions: fullPr.deletions || 0,
                        changedFiles: fullPr.changed_files || 0,
                        commits: fullPr.commits || 0,
                        comments: fullPr.comments || 0,
                        reviewComments: fullPr.review_comments || 0,
                        mergedAt: fullPr.merged_at ? new Date(fullPr.merged_at) : null,
                        closedAt: fullPr.closed_at ? new Date(fullPr.closed_at) : null,
                        createdAt: fullPr.created_at ? new Date(fullPr.created_at) : new Date(),
                    }
                });
            }
        }
        // -------------------------------------

        await this.prisma.syncJob.update({
            where: { id: syncJobId },
            data: { status: 'completed', completedAt: new Date() },
        });

        await this.prisma.repository.update({
            where: { id: repositoryId },
            data: { lastSyncedAt: new Date() }
        });

        return { status: 'success', commitsSynced: commits.length };
    }

    private async handleWebhookCommits(job: Job) {
        const { repositoryId: githubRepoId, commits } = job.data;

        // repositoryId here is the github ID from the webhook payload!
        const repositories = await this.prisma.repository.findMany({
            where: { githubId: githubRepoId },
            include: { user: true }
        });

        if (repositories.length === 0) {
            this.logger.warn(`Webhook Commit omitido: Repositorio ${githubRepoId} no encontrado en DB para ningún usuario.`);
            return { status: 'ignored' };
        }

        for (const repository of repositories) {
            let octokit;
            if (repository.user?.accessToken) {
                const isLimited = await this.rateLimiter.isRateLimited(`gh-api-${repository.userId}`, 4000, 3600000);
                if (!isLimited) {
                    const { Octokit } = await eval('import("octokit")');
                    octokit = new Octokit({ auth: this.crypto.decrypt(repository.user.accessToken) });
                }
            }

            const [owner, repoName] = repository.fullName.split('/');

            for (const commit of commits) {
                let additions = 0;
                let deletions = 0;
                let filesChanged = (commit.added?.length ?? 0) + (commit.removed?.length ?? 0) + (commit.modified?.length ?? 0);

                if (octokit) {
                    const isDetailLimited = await this.rateLimiter.isRateLimited(`gh-api-${repository.userId}`, 4000, 3600000);
                    if (!isDetailLimited) {
                        try {
                            const { data: detail } = await octokit.rest.repos.getCommit({
                                owner,
                                repo: repoName,
                                ref: commit.id
                            });
                            if (detail.stats) {
                                additions = detail.stats.additions ?? 0;
                                deletions = detail.stats.deletions ?? 0;
                                filesChanged = detail.files?.length ?? filesChanged;
                            }
                        } catch (e) {
                            this.logger.warn(`Could not fetch details for webhook commit ${commit.id}`);
                        }
                    }
                }

                await this.prisma.commit.upsert({
                    where: {
                        sha_repositoryId: { sha: commit.id, repositoryId: repository.id }
                    },
                    update: {
                        message: commit.message,
                        additions,
                        deletions,
                        filesChanged
                    },
                    create: {
                        sha: commit.id,
                        repositoryId: repository.id,
                        userId: repository.userId,
                        message: commit.message,
                        additions,
                        deletions,
                        filesChanged,
                        committedAt: new Date(commit.timestamp),
                    }
                });
            }
        }

        return { status: 'success' };
    }

    private async handleWebhookPR(job: Job) {
        const { repositoryId: githubRepoId, pullRequest } = job.data;

        const repositories = await this.prisma.repository.findMany({
            where: { githubId: githubRepoId },
            include: { user: true }
        });

        if (repositories.length === 0) {
            this.logger.warn(`Webhook PR omitido: Repositorio ${githubRepoId} no encontrado en DB para ningún usuario.`);
            return { status: 'ignored' };
        }

        for (const repository of repositories) {
            // Only allow PRs if the author login matches the local user login
            if (pullRequest.user?.login?.toLowerCase() !== repository.user?.login?.toLowerCase()) {
                this.logger.log(`Webhook PR omitido para usuario ${repository.user?.login}: Autor ${pullRequest.user?.login} no coincide.`);
                continue;
            }

            await this.prisma.pullRequest.upsert({
                where: {
                    githubId_repositoryId: { githubId: pullRequest.id, repositoryId: repository.id }
                },
                update: {
                    title: pullRequest.title,
                    state: pullRequest.state,
                    isDraft: pullRequest.draft,
                    additions: pullRequest.additions,
                    deletions: pullRequest.deletions,
                    changedFiles: pullRequest.changed_files,
                    commits: pullRequest.commits,
                    comments: pullRequest.comments,
                    reviewComments: pullRequest.review_comments,
                    mergedAt: pullRequest.merged_at ? new Date(pullRequest.merged_at) : null,
                    closedAt: pullRequest.closed_at ? new Date(pullRequest.closed_at) : null,
                    updatedAt: new Date(),
                },
                create: {
                    githubId: pullRequest.id,
                    repositoryId: repository.id,
                    userId: repository.userId,
                    number: pullRequest.number,
                    title: pullRequest.title,
                    state: pullRequest.state,
                    isDraft: pullRequest.draft,
                    additions: pullRequest.additions || 0,
                    deletions: pullRequest.deletions || 0,
                    changedFiles: pullRequest.changed_files || 0,
                    commits: pullRequest.commits || 0,
                    comments: pullRequest.comments || 0,
                    reviewComments: pullRequest.review_comments || 0,
                    mergedAt: pullRequest.merged_at ? new Date(pullRequest.merged_at) : null,
                    closedAt: pullRequest.closed_at ? new Date(pullRequest.closed_at) : null,
                }
            });
        }

        return { status: 'success' };
    }
}
