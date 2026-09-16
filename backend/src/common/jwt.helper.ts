import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from './role.enum.js';
import { AuthUser } from './guards/roles.guard.js';

export async function verifyAccessToken(
  jwtService: JwtService,
  config: ConfigService,
  token: string,
): Promise<AuthUser | null> {
  try {
    const payload = await jwtService.verifyAsync<{
      sub: string;
      username: string;
      role: Role;
      type: string;
    }>(token, { secret: config.get<string>('JWT_ACCESS_SECRET') });
    if (payload.type !== 'access') {
      return null;
    }
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function extractToken(
  queryToken: string | undefined,
  authorization: string | undefined,
): string | undefined {
  if (queryToken) return queryToken;
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
  return undefined;
}
