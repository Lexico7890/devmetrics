// apps/api/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@devmetrics/database';
import { CryptoService } from '../common/crypto.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly crypto: CryptoService,
  ) {}

  async findOrCreate(profile: {
    githubId: number;
    login: string;
    username: string;
    email: string | null;
    avatarUrl: string | null;
    displayName: string | null;
    githubToken: string;
  }) {
    // Encriptamos el token antes de guardarlo
    const encryptedToken = this.crypto.encrypt(profile.githubToken);

    return this.prisma.user.upsert({
      where: { githubId: profile.githubId },
      update: {
        login: profile.login,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        displayName: profile.displayName,
        accessToken: encryptedToken,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        githubId: profile.githubId,
        username: profile.username,
        login: profile.login,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        displayName: profile.displayName,
        accessToken: encryptedToken,
        lastLoginAt: new Date(),
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getDecryptedGithubToken(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.accessToken) return null;
    return this.crypto.decrypt(user.accessToken);
  }
}
