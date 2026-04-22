import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'paciente@correo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'a1b2c3d4', description: 'La clave recibida por correo' })
  @IsString()
  @IsNotEmpty()
  password: string;
}