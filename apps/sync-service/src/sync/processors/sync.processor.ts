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
            
            // Mark syncJob as failed if it's a syncJob (has syncJobId)
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
                where: { githubId: repo.id },
                update: {
                    name: repo.name,
                    fullName: repo.full_name,
                    stargazersCount: repo.stargazers_count,
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
                },
            });

            // Enqueue commit sync for this specific repo
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
        
        // Fetch up to 100 commits for initial sync to avoid massive API limits
        const { data: commits } = await octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: 100,
        });

        for (const commitData of commits) {
            // Check if commit already exists
            const existing = await this.prisma.commit.findUnique({
                where: {
                    sha_repositoryId: { sha: commitData.sha, repositoryId }
                }
            });

            if (!existing) {
                await this.prisma.commit.create({
                    data: {
                        sha: commitData.sha,
                        repositoryId,
                        userId,
                        message: commitData.commit.message,
                        committedAt: new Date(commitData.commit.author.date || commitData.commit.committer.date || new Date()),
                    }
                });
            }
        }

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
        const repository = await this.prisma.repository.findUnique({
            where: { githubId: githubRepoId }
        });

        if (!repository) {
            this.logger.warn(`Webhook Commit omitido: Repositorio ${githubRepoId} no encontrado en DB.`);
            return { status: 'ignored' };
        }

        for (const commit of commits) {
            const addedCnt = commit.added?.length ?? 0;
            const removedCnt = commit.removed?.length ?? 0;
            const modifiedCnt = commit.modified?.length ?? 0;

            await this.prisma.commit.upsert({
                where: {
                    sha_repositoryId: { sha: commit.id, repositoryId: repository.id }
                },
                update: {
                    message: commit.message,
                },
                create: {
                    sha: commit.id,
                    repositoryId: repository.id,
                    userId: repository.userId, // El dueño del repo asume el commit inicial en el scope
                    message: commit.message,
                    filesChanged: addedCnt + removedCnt + modifiedCnt,
                    committedAt: new Date(commit.timestamp),
                }
            });
        }
        return { status: 'success' };
    }

    private async handleWebhookPR(job: Job) {
        const { repositoryId: githubRepoId, pullRequest } = job.data;

        const repository = await this.prisma.repository.findUnique({
            where: { githubId: githubRepoId }
        });

        if (!repository) {
            this.logger.warn(`Webhook PR omitido: Repositorio ${githubRepoId} no encontrado en DB.`);
            return { status: 'ignored' };
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

        return { status: 'success' };
    }
}
