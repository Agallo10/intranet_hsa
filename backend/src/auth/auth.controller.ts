import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { Public } from '../common/decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { UsersService, toUserDto } from '../users/users.service.js';
import { AuditService } from '../audit/audit.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip ?? null;
    const userAgent = req.headers['user-agent'] ?? null;

    const user = await this.authService.validateUser(dto.username, dto.password);
    if (!user) {
      await this.auditService
        .record({
          action: 'auth.login_failure',
          username: dto.username,
          details: 'Credenciales inválidas',
          ip,
          userAgent,
        })
        .catch(() => undefined);
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    await this.auditService
      .record({
        action: 'auth.login_success',
        userId: user.id,
        username: user.username,
        ip,
        userAgent,
      })
      .catch(() => undefined);

    const result = await this.authService.login(user);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  async me(@Req() req: { user: AuthUser }) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return toUserDto(user);
  }

  @Post('change-password')
  async changePassword(
    @Req() req: { user: AuthUser },
    @Body() dto: ChangePasswordDto,
  ) {
    const user = await this.usersService.changePassword(
      req.user.userId,
      dto.password,
    );
    return toUserDto(user);
  }
}
