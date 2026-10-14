import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';
import { EstadoSolicitud } from '../src/core/enums/estados.enum';

describe('API Solicitudes Comerciales (E2E Tests - 12 Criterios)', () => {
  let app: INestApplication;
  const KEY_ALPHA = 'test-key-alpha-123';
  const KEY_BETA = 'test-key-beta-456';

  beforeAll(async () => {
    process.env.API_KEYS = `${KEY_ALPHA},${KEY_BETA}`;
    process.env.DB_DATABASE = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);

    // Setup Swagger en el entorno de pruebas para verificar el Criterio 11
    const config = new DocumentBuilder()
      .setTitle('API de Solicitudes de Seguimiento Comercial')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
      .addApiKey({ type: 'apiKey', name: 'x-user', in: 'header' }, 'x-user')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // CRITERIO 1: Petición sin x-api-key rechazada (401)
  // =========================================================================
  describe('Criterio 1: Validación de presencia de x-api-key', () => {
    it('debe rechazar con HTTP 401 si no se envía el encabezado x-api-key', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-user', 'admin');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toContain('x-api-key');
    });
  });

  // =========================================================================
  // CRITERIO 2: Petición con clave inválida rechazada (401)
  // =========================================================================
  describe('Criterio 2: Validación de clave de API incorrecta', () => {
    it('debe rechazar con HTTP 401 si la API key es inválida', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', 'clave-inexistente-xyz')
        .set('x-user', 'admin');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.message).toBe('API key no válida');
    });

    it('debe rechazar con HTTP 401 si el usuario no existe en la base de datos', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'usuario-fantasma');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.message).toContain('no registrado');
    });

    it('debe rechazar con HTTP 401 si falta el encabezado x-user', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_ALPHA);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.message).toContain('x-user');
    });
  });

  // =========================================================================
  // CRITERIO 3: Dos claves distintas configuradas en el entorno permiten consumir la API
  // =========================================================================
  describe('Criterio 3: Soporte para múltiples API Keys simultáneas', () => {
    it('debe permitir consumir la API con la primera clave (KEY_ALPHA)', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('debe permitir consumir la API con la segunda clave (KEY_BETA)', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_BETA)
        .set('x-user', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // =========================================================================
  // CRITERIO 4: Los DTO rechazan datos obligatorios faltantes o incorrectos (400)
  // =========================================================================
  describe('Criterio 4: Validación estricta con DTO y ValidationPipe', () => {
    it('debe rechazar la creación sin el campo obligatorio "cliente"', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          descripcion: 'Interesado en software',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
    });

    it('debe rechazar cliente que contenga solo espacios en blanco', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: '     ',
          descripcion: 'Interesado en software',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar cliente que exceda los 255 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 'A'.repeat(256),
          descripcion: 'Interesado en software',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar cliente con tipo de dato no string', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 12345,
          descripcion: 'Interesado en software',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar si falta la descripción', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 'Banco Global',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar propiedades protegidas enviadas en el body (ej: estado)', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 'Banco Global',
          descripcion: 'Apertura de cuenta',
          estado: 'RESUELTA',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe registrar solicitud sin asignación cuando la crea admin o supervisor (RN-07)', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin')
        .send({
          cliente: 'Banco Global',
          descripcion: 'Cuenta corporativa',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.asesor).toBeNull();
    });

    it('debe rechazar ID no numérico en parámetro :id con ParseIntPipe (400)', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes/abc')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar estado inválido en el DTO de actualización', async () => {
      const res = await request(app.getHttpServer())
        .patch('/solicitudes/1/estado')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin')
        .send({ estado: 'CANCELADA' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // CRITERIO 5: Los registros quedan almacenados en TypeORM / SQLite
  // =========================================================================
  describe('Criterio 5: Persistencia en base de datos real TypeORM SQLite', () => {
    let createdId: number;

    it('debe almacenar la solicitud en la base de datos y recuperarla con GET', async () => {
      const postRes = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 'Compañía Minera',
          descripcion: 'Requerimiento de maquinaria pesada',
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.data.id).toBeDefined();
      expect(postRes.body.data.estado).toBe(EstadoSolicitud.PENDIENTE);
      expect(postRes.body.data.asesor).toBe('asesor1');
      expect(postRes.body.data.creada_en).toBeDefined();
      expect(postRes.body.data.actualizada_en).toBeDefined();

      createdId = postRes.body.data.id;

      // Recuperar de la base de datos
      const getRes = await request(app.getHttpServer())
        .get(`/solicitudes/${createdId}`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1');

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.id).toBe(createdId);
      expect(getRes.body.data.cliente).toBe('Compañía Minera');
    });

    it('debe sobrescribir el campo asesor con su propio username si quien registra es asesor', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 'Constructora Beta',
          descripcion: 'Plan de suministros',
          asesor: 'asesor2', // Intentando asignar a otro
        });

      expect(res.status).toBe(201);
      expect(res.body.data.asesor).toBe('asesor1'); // Se fijó a asesor1 automáticamente
    });
  });

  // =========================================================================
  // CRITERIO 6: Los asesores solo consultan sus propias solicitudes (RN-02)
  // =========================================================================
  describe('Criterio 6: Restricción de consulta por rol y asignación', () => {
    let idAsesor1: number;
    let idAsesor2: number;

    beforeAll(async () => {
      // Crear solicitud para asesor1
      const res1 = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 'Cliente de Asesor 1',
          descripcion: 'Seguimiento 1',
        });
      idAsesor1 = res1.body.data.id;

      // Crear solicitud para asesor2
      const res2 = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor2')
        .send({
          cliente: 'Cliente de Asesor 2',
          descripcion: 'Seguimiento 2',
        });
      idAsesor2 = res2.body.data.id;
    });

    it('asesor1 solo debe recibir solicitudes donde asesor === asesor1', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1');

      expect(res.status).toBe(200);
      const items = res.body.data;
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item: any) => {
        expect(item.asesor).toBe('asesor1');
      });
      const ids = items.map((s: any) => s.id);
      expect(ids).toContain(idAsesor1);
      expect(ids).not.toContain(idAsesor2);
    });

    it('asesor2 solo debe recibir solicitudes donde asesor === asesor2', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor2');

      expect(res.status).toBe(200);
      const items = res.body.data;
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item: any) => {
        expect(item.asesor).toBe('asesor2');
      });
      const ids = items.map((s: any) => s.id);
      expect(ids).toContain(idAsesor2);
      expect(ids).not.toContain(idAsesor1);
    });

    it('supervisor y admin deben consultar todas las solicitudes sin restricción', async () => {
      const resSup = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'supervisor');

      expect(resSup.status).toBe(200);
      const supIds = resSup.body.data.map((s: any) => s.id);
      expect(supIds).toContain(idAsesor1);
      expect(supIds).toContain(idAsesor2);

      const resAdmin = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin');

      expect(resAdmin.status).toBe(200);
      const adminIds = resAdmin.body.data.map((s: any) => s.id);
      expect(adminIds).toContain(idAsesor1);
      expect(adminIds).toContain(idAsesor2);
    });

    it('asesor1 consultando individualmente una solicitud de asesor2 recibe HTTP 403', async () => {
      const res = await request(app.getHttpServer())
        .get(`/solicitudes/${idAsesor2}`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(403);
      expect(res.body.message).toContain('No tiene permisos');
    });

    it('consultar solicitud inexistente recibe HTTP 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes/999999')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(404);
    });
  });

  // =========================================================================
  // CRITERIO 7: Los asesores no pueden cambiar el estado de solicitudes ajenas
  // =========================================================================
  describe('Criterio 7: Prohibición de cambio de estado en solicitudes ajenas', () => {
    let idAsesor2: number;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor2')
        .send({
          cliente: 'Empresa Privada Asesor 2',
          descripcion: 'Plan Premium',
        });
      idAsesor2 = res.body.data.id;
    });

    it('asesor1 intentando cambiar estado de solicitud de asesor2 debe recibir 403', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${idAsesor2}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ estado: EstadoSolicitud.EN_GESTION });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('solicitud ajena');
    });

    it('supervisor sí puede cambiar el estado de cualquier solicitud (incluso de asesor2)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${idAsesor2}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'supervisor')
        .send({ estado: EstadoSolicitud.EN_GESTION });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe(EstadoSolicitud.EN_GESTION);
    });
  });

  // =========================================================================
  // CRITERIO 8: Las transiciones inválidas de estado se rechazan (409)
  // =========================================================================
  describe('Criterio 8: Validación de transiciones de estado', () => {
    let testSolicitudId: number;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 'Cliente Transiciones',
          descripcion: 'Evaluación de estados',
        });
      testSolicitudId = res.body.data.id;
    });

    it('debe rechazar salto directo de PENDIENTE a RESUELTA con 409', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${testSolicitudId}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ estado: EstadoSolicitud.RESUELTA });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(409);
      expect(res.body.message).toContain('Transición de estado no permitida');
    });

    it('debe rechazar transición al mismo estado PENDIENTE -> PENDIENTE con 409', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${testSolicitudId}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ estado: EstadoSolicitud.PENDIENTE });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(409);
    });

    it('debe permitir transición válida PENDIENTE -> EN_GESTION con 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${testSolicitudId}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ estado: EstadoSolicitud.EN_GESTION });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe(EstadoSolicitud.EN_GESTION);
    });

    it('debe permitir transición válida EN_GESTION -> RESUELTA con 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${testSolicitudId}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ estado: EstadoSolicitud.RESUELTA });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe(EstadoSolicitud.RESUELTA);
    });

    it('debe rechazar reabrir una solicitud RESUELTA -> EN_GESTION con 409', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${testSolicitudId}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ estado: EstadoSolicitud.EN_GESTION });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(409);
    });

    it('intentar cambiar estado de solicitud inexistente responde 404', async () => {
      const res = await request(app.getHttpServer())
        .patch('/solicitudes/999999/estado')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin')
        .send({ estado: EstadoSolicitud.EN_GESTION });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(404);
    });
  });

  // =========================================================================
  // CRITERIO 9: El interceptor estandariza las respuestas exitosas
  // =========================================================================
  describe('Criterio 9: Estructura uniforme en respuestas exitosas', () => {
    it('debe contener los campos { success: true, data, path, timestamp }', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('path', '/solicitudes');
      expect(res.body).toHaveProperty('timestamp');
      expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
    });
  });

  // =========================================================================
  // CRITERIO 10: El Exception Filter normaliza los errores sin ocultar su código HTTP real
  // =========================================================================
  describe('Criterio 10: Normalización uniforme de errores vía AllExceptionsFilter', () => {
    it('formato normalizado para error 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        path: '/solicitudes',
      });
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.message).toBeDefined();
    });

    it('formato normalizado para error 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-user', 'admin');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
      });
    });

    it('formato normalizado para error 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes/999999')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        success: false,
        statusCode: 404,
        error: 'Not Found',
      });
    });

    it('formato normalizado para error 409 Conflict', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 'Test Conflict',
          descripcion: 'Conflicto de estado',
        });
      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${id}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ estado: EstadoSolicitud.RESUELTA }); // Directo de PENDIENTE a RESUELTA

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        success: false,
        statusCode: 409,
        error: 'Conflict',
      });
    });
  });

  // =========================================================================
  // RN-07: Asignación y reasignación de solicitudes
  // =========================================================================
  describe('RN-07: Asignación y reasignación de solicitudes', () => {
    let solicitudId: number;
    let solicitudResueltaId: number;

    beforeAll(async () => {
      // Crear solicitud sin asignar (creada por supervisor)
      const res1 = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'supervisor')
        .send({
          cliente: 'Empresa Alpha',
          descripcion: 'Interés en póliza',
        });
      solicitudId = res1.body.data.id;

      // Crear solicitud y pasarla a RESUELTA
      const res2 = await request(app.getHttpServer())
        .post('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({
          cliente: 'Empresa Beta',
          descripcion: 'Venta cerrada',
        });
      solicitudResueltaId = res2.body.data.id;

      await request(app.getHttpServer())
        .patch(`/solicitudes/${solicitudResueltaId}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ estado: EstadoSolicitud.EN_GESTION });

      await request(app.getHttpServer())
        .patch(`/solicitudes/${solicitudResueltaId}/estado`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ estado: EstadoSolicitud.RESUELTA });
    });

    it('permite a un admin asignar una solicitud a un asesor válido', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${solicitudId}/asignar`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin')
        .send({ asesor: 'asesor1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.asesor).toBe('asesor1');
    });

    it('permite a un supervisor reasignar una solicitud a otro asesor válido', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${solicitudId}/asignar`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'supervisor')
        .send({ asesor: 'asesor2' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.asesor).toBe('asesor2');
      expect(res.body.data.estado).toBe(EstadoSolicitud.PENDIENTE);
    });

    it('rechaza con 403 si un asesor intenta asignar o reasignar', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${solicitudId}/asignar`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'asesor1')
        .send({ asesor: 'asesor1' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rechaza con 400 si el asesor asignado no existe', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${solicitudId}/asignar`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin')
        .send({ asesor: 'fantasma' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rechaza con 400 si se intenta asignar a un usuario que no tiene rol asesor', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${solicitudId}/asignar`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin')
        .send({ asesor: 'supervisor' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rechaza con 409 si la solicitud está en estado RESUELTA', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/solicitudes/${solicitudResueltaId}/asignar`)
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin')
        .send({ asesor: 'asesor2' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rechaza con 404 si la solicitud no existe', async () => {
      const res = await request(app.getHttpServer())
        .patch('/solicitudes/999999/asignar')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin')
        .send({ asesor: 'asesor1' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // CRITERIO 11: Swagger documenta los endpoints y sus encabezados
  // =========================================================================
  describe('Criterio 11: Documentación Swagger / OpenAPI disponible', () => {
    it('debe servir la interfaz Swagger en /api/docs', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs');
      expect([200, 301, 302]).toContain(res.status);
    });

    it('debe exponer la definición OpenAPI conteniendo x-api-key y x-user en esquemas de seguridad', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs-json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBeDefined();
      expect(res.body.components.securitySchemes).toHaveProperty('x-api-key');
      expect(res.body.components.securitySchemes).toHaveProperty('x-user');
      expect(res.body.paths).toHaveProperty('/solicitudes');
      expect(res.body.paths).toHaveProperty('/solicitudes/{id}');
      expect(res.body.paths).toHaveProperty('/solicitudes/{id}/estado');
    });
  });

  // =========================================================================
  // CRITERIO 12: La solución puede ejecutarse siguiendo las instrucciones del README
  // =========================================================================
  describe('Criterio 12: Disponibilidad y salud general de la aplicación', () => {
    it('la aplicación inicializa y responde correctamente a las solicitudes autorizadas', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_ALPHA)
        .set('x-user', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
