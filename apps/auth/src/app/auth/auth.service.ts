import { Injectable, NotFoundException } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@medical/shared-dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Patient } from '@medical/database';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Patient) 
    private readonly repo: Repository<Patient>,
    private readonly jwtService: JwtService,
  ) {}

  async requestPassword(cedula: string) {

    const patient = await this.repo.findOne({ where: { cedula } });
    

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }


    const tempPassword = randomBytes(4).toString('hex'); 
    

    const salt = await bcrypt.genSalt(10);
    patient.tempPasswordHash = await bcrypt.hash(tempPassword, salt);
    patient.tempPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); 
    

    await this.repo.save(patient);


    const info = await this.sendMockEmail(patient.email, tempPassword);

    return { 
      message: 'Si el usuario existe, se ha enviado una clave temporal a su correo electrónico institucional.\n ingresa al siguiente enlace para acceder: ' + info
    };
  }

  private async sendMockEmail(email: string, code: string) {
    // Configuración de cuenta de prueba en Ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Servicios Médicos - Autenticación" <noreply@medical.com>',
      to: email,
      subject: 'Tu Clave Temporal de Acceso',
      text: `Has solicitado una clave de acceso. Tu clave temporal es: ${code}. Recuerda que expira en 15 minutos.`,
      html: `<b>Tu clave temporal es: ${code}</b><br>Expira en 15 minutos.`,
    });
    const infoMail = nodemailer.getTestMessageUrl(info);
    console.log('----------------------------------------------------');
    console.log('CORREO ENVIADO A:', email);
    console.log('URL DE VISTA PREVIA:', infoMail    );
    console.log('----------------------------------------------------');
    return infoMail;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Buscar paciente por email
    const patient = await this.repo.findOne({ where: { email } });
    if (!patient) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar si existe una clave temporal y si no ha expirado
    if (!patient.tempPasswordHash || !patient.tempPasswordExpiry) {
      throw new UnauthorizedException('No hay una clave temporal activa');
    }

    const now = new Date();
    if (now > patient.tempPasswordExpiry) {
      throw new UnauthorizedException('La clave temporal ha expirado');
    }

    // 3. Comparar la contraseña ingresada con el hash temporal
    const isMatch = await bcrypt.compare(password, patient.tempPasswordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 4. Generar el JWT Payload
    const payload = { 
      sub: patient.id, 
      email: patient.email, 
      cedula: patient.cedula 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: patient.id,
        email: patient.email,
        cedula: patient.cedula
      }
    };
  }
}