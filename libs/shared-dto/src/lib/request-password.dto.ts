import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestPasswordDto {
  @ApiProperty({
    description: 'Número de cédula del paciente para generar la clave temporal',
    example: '12345678',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  cedula: string;
}