import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PatientsController } from './patients/patients.controller';

import { AppService } from './app.service';
import { PatientsService } from './patients/patients.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule, Patient } from '@medical/database';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TypeOrmModule.forFeature([Patient]),
  ],
  controllers: [AppController,PatientsController],
  providers: [AppService,PatientsService],
})
export class AppModule {}
