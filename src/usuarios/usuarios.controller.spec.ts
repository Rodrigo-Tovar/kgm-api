import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

describe('UsuariosController authorization', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  const service = {
    listarOpciones: jest.fn().mockResolvedValue([]),
    crear: jest.fn().mockResolvedValue({
      id: 8,
      escuelaId: 3,
      email: 'docente@escuela.edu.mx',
      rol: 'DOCENTE',
      createdAt: null,
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'unit-test-secret-with-at-least-32-bytes' })],
      controllers: [UsuariosController],
      providers: [
        JwtAuthGuard,
        RolesGuard,
        { provide: UsuariosService, useValue: service },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    jwtService = app.get(JwtService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function token(rol: 'ADMINISTRADOR' | 'DOCENTE') {
    return jwtService.signAsync({
      sub: 5,
      escuelaId: 3,
      rol,
    });
  }

  it('rejects unauthenticated requests before listing registration options', async () => {
    await request(app.getHttpServer())
      .get('/usuarios/opciones?rol=DOCENTE')
      .expect(401);

    expect(service.listarOpciones).not.toHaveBeenCalled();
  });

  it('rejects a signed non-administrator from registration endpoints', async () => {
    await request(app.getHttpServer())
      .get('/usuarios/opciones?rol=DOCENTE')
      .set('Authorization', `Bearer ${await token('DOCENTE')}`)
      .expect(403);

    expect(service.listarOpciones).not.toHaveBeenCalled();
  });

  it('uses the authenticated school for administrator option requests', async () => {
    await request(app.getHttpServer())
      .get('/usuarios/opciones?rol=TUTOR')
      .set('Authorization', `Bearer ${await token('ADMINISTRADOR')}`)
      .expect(200)
      .expect([]);

    expect(service.listarOpciones).toHaveBeenCalledWith(3, 'TUTOR');
  });

  afterAll(async () => {
    await app.close();
  });
});
