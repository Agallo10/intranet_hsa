import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from '../role.enum.js';

describe('RolesGuard', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  const makeContext = (user: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as never;

  it('permite acceso cuando no hay roles requeridos', () => {
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeContext(undefined))).toBe(true);
  });

  it('permite acceso cuando el usuario tiene el rol requerido', () => {
    reflector.getAllAndOverride = () => [Role.Admin];
    const guard = new RolesGuard(reflector);
    expect(
      guard.canActivate(
        makeContext({ userId: '1', username: 'a', role: Role.Admin }),
      ),
    ).toBe(true);
  });

  it('deniega acceso cuando el usuario no tiene el rol requerido', () => {
    reflector.getAllAndOverride = () => [Role.Admin];
    const guard = new RolesGuard(reflector);
    expect(() =>
      guard.canActivate(
        makeContext({ userId: '1', username: 'a', role: Role.Lector }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('deniega acceso cuando no hay usuario autenticado', () => {
    reflector.getAllAndOverride = () => [Role.Admin];
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
