import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('health público', () => {
    return request(app.getHttpServer()).get('/api').expect(200);
  });

  it('login con credenciales inválidas → 401', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'contraseña-incorrecta' })
      .expect(401);
  });

  it('contenido sin token → 401', () => {
    return request(app.getHttpServer()).get('/api/contents').expect(401);
  });

  it('usuarios sin token → 401', () => {
    return request(app.getHttpServer()).get('/api/users').expect(401);
  });
});
