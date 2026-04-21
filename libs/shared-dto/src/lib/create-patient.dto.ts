import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({ example: '12345678', description: 'Número de identificación' })
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @ApiProperty({ example: 'andres@example.com', description: 'Correo para recibir claves temporales' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}