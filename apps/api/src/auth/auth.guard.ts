// apps/api/src/auth/auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// JwtAuthGuard — úsalo con @UseGuards(JwtAuthGuard) en controllers que requieren auth
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// GithubAuthGuard — inicia el OAuth dance
@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {}
