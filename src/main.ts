import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Configuración global de pipes, interceptores y filtros
  setupApp(app);

  // Configuración de documentación OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Solicitudes de Seguimiento Comercial')
    .setDescription(
      'API REST desarrollada con NestJS para la gestión de solicitudes comerciales con control de acceso por roles y API Key.',
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Clave de API configurada en la variable API_KEYS',
      },
      'x-api-key',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-user',
        in: 'header',
        description:
          'Nombre de usuario autenticado en la base de datos (admin, supervisor, asesor1, asesor2)',
      },
      'x-user',
    )
    .addSecurityRequirements('x-api-key')
    .addSecurityRequirements('x-user')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Servidor iniciado y escuchando en el puerto ${port}`);
  logger.log(`Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}

void bootstrap();
