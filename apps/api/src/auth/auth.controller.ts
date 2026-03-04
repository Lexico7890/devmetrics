// apps/api/src/auth/auth.controller.ts
import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { type Response, type Request } from 'express';
import { AuthService } from './auth.service';
import { GithubAuthGuard, JwtAuthGuard } from './auth.guard';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 1. Inicia el OAuth dance — redirige a GitHub
  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {
    // Passport intercepta este endpoint antes de que llegue al método
    // El cuerpo nunca se ejecuta — Passport hace la redirección
  }

  // 2. GitHub redirige aquí después de que el usuario autoriza
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    // req.user viene de GithubStrategy.validate()
    const tokens = await this.authService.handleGithubCallback(req.user as any);

    // Guardamos el refresh token en una cookie httpOnly (más seguro que localStorage)
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true, // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
      sameSite: 'lax', // Protección CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
    });

    // Redirigimos al frontend con el access token en la URL
    // El frontend lo guarda en memoria (no localStorage — XSS risk)
    res.redirect(
      `${process.env.WEB_URL}/auth/callback?token=${tokens.accessToken}`,
    );
  }

  // 3. Renovar tokens usando el refresh token de la cookie
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Rotar la cookie también
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken: tokens.accessToken });
  }

  // 4. Logout — revoca la sesión
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out' });
  }

  // 5. Obtener el usuario actual — ruta protegida con JWT
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    // req.user viene de JwtStrategy.validate()
    const user = req.user as {
      id: string;
      login: string;
      email: string;
      avatarUrl: string;
      name: string;
    };
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      avatarUrl: user.avatarUrl,
      name: user.name,
    };
  }
}
