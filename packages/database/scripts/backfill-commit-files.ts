// packages/database/src/scripts/backfill-commit-files.ts

import { PrismaClient } from '@prisma/client';
import { Octokit } from '@octokit/rest';

const prisma = new PrismaClient();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function backfillCommitFiles() {
    // Obtener commits sin archivos registrados
    const commits = await prisma.commit.findMany({
        where: {
            commitFiles: { none: {} } // commits sin relación con commit_files
        },
        include: {
            repository: true,
            user: true
        },
        take: 100 // Procesar en batches
    });

    for (const commit of commits) {
        try {
            // Obtener detalles del commit desde GitHub API
            const { data } = await octokit.repos.getCommit({
                owner: commit.user.login,
                repo: commit.repository.name,
                ref: commit.sha
            });

            // Guardar archivos
            for (const file of data.files || []) {
                await prisma.commitFile.create({
                    data: {
                        commitId: commit.id,
                        filePath: file.filename,
                        additions: file.additions,
                        deletions: file.deletions,
                        status: file.status
                    }
                });
            }

            console.log(`✅ Commit ${commit.sha.slice(0, 7)}: ${(data.files || []).length} archivos`);

            // Respetar rate limits
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`❌ Error en commit ${commit.sha}:`, error.message);
        }
    }
}

backfillCommitFiles();