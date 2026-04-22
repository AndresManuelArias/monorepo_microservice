import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PatientsController } from './patients/patients.controller';
import { AuthController } from './auth/auth.controller';

import { AppService } from './app.service';
import { PatientsService } from './patients/patients.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule, Patient } from '@medical/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TypeOrmModule.forFeature([Patient]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'secretKey'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AppController,PatientsController,AuthController],
  providers: [AppService,PatientsService,AuthService],
})
export class AppModule {}
