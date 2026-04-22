import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({
    description: 'Número de identificación único del paciente',
    example: '10203040',
  })
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @ApiProperty({
    description: 'Correo electrónico para envío de claves temporales',
    example: 'paciente@correo.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;


  @ApiProperty({
    description: 'Password para el paciente',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}