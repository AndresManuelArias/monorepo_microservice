/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger,ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Importa Swagger
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api-auth';
  app.setGlobalPrefix(globalPrefix);

  const config = new DocumentBuilder()
    .setTitle('Medical Records - Auth Service')
    .setDescription('API para la autenticación y gestión de pacientes')
    .setVersion('1.0')
    .addTag('Patients')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // La URL será /api/docs

  // 2. Habilitar validaciones globales (para que funcionen los DTOs)
  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
