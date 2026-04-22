import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PatientsController } from './patients/patients.controller';
import { AuthController } from './auth/auth.controller';

import { AppService } from './app.service';
import { PatientsService } from './patients/patients.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule, Patient } from '@medical/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TypeOrmModule.forFeature([Patient]),
  ],
  controllers: [AppController,PatientsController,AuthController],
  providers: [AppService,PatientsService,AuthService],
})
export class AppModule {}
