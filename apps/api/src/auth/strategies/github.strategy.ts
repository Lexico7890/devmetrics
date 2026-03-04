import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
      scope: ['read:user', 'user:email', 'repo'],
    });
  }

  validate(accessToken: string, _refreshToken: string, profile: Profile) {
    return {
      githubId: Number(profile.id),
      username: profile.username ?? profile.id,
      login: profile.username ?? profile.id,
      email: profile.emails?.[0]?.value ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      displayName: profile.displayName ?? null,
      githubToken: accessToken,
    };
  }
}
