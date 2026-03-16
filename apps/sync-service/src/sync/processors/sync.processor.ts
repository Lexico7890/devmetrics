import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaClient } from '@devmetrics/database';
import { Octokit } from 'octokit';
import { CryptoService } from '../../common/crypto.service';

@Processor('github-sync')
export class SyncProcessor extends WorkerHost {
    private readonly logger = new Logger(SyncProcessor.name);

    constructor(
        private prisma: PrismaClient,
        private crypto: CryptoService,
    ) {
        super();
    }

    // Este método procesa todo lo que entra a la cola 'github-sync'
    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Procesando Job BullMQ: ${job.id} - Tipo: ${job.name}`);

        const { syncJobId, userId } = job.data;

        try {
            // 1. Actualizar DB indicando que empezamos
            await this.prisma.syncJob.update({
                where: { id: syncJobId },
                data: { status: 'processing', startedAt: new Date() },
            });

            // 2. Obtener el token del usuario desde la DB (Esquema Auth)
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user || !user.accessToken) {
                throw new Error('Usuario o Access Token no encontrado');
            }

            // Desencriptamos el token
            const decryptedToken = this.crypto.decrypt(user.accessToken);

            // 3. Inicializar GitHub API (Octokit)
            const octokit = new Octokit({ auth: decryptedToken });

            // 4. Lógica pesada: Obtener repositorios
            if (job.name === 'sync-user-repos') {
                const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
                    visibility: 'all',
                    per_page: 100, // Manejar paginación en el futuro
                });

                // 5. Guardar repositorios en tu tabla analytics.Repository
                for (const repo of repos) {
                    await this.prisma.repository.upsert({
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
                }
            }

            // 6. Marcar como completado en tu DB
            await this.prisma.syncJob.update({
                where: { id: syncJobId },
                data: { status: 'completed', completedAt: new Date() },
            });

            this.logger.log(`Job ${job.id} completado con éxito`);
            return { status: 'success', reposSynced: true };

        } catch (error) {
            this.logger.error(`Error en Job ${job.id}:`, error.message);

            // Marcar como fallido en tu DB si agota los reintentos
            await this.prisma.syncJob.update({
                where: { id: syncJobId },
                data: {
                    status: 'failed',
                    errorMessage: error.message,
                    attempts: job.attemptsMade + 1
                },
            });

            throw error; // Lanzar el error hace que BullMQ cuente el intento fallido
        }
    }
}
