import { Injectable, NotFoundException } from '@nestjs/common';
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
    private readonly repo: Repository<Patient>
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
      message: 'Si el usuario existe, se ha enviado una clave temporal a su correo electrónico institucional.'+ info
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
}