
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateDocumentDto {
  @ApiProperty({ example: 'uuid-del-paciente' })
  @IsUUID()
  @IsNotEmpty()
  patient_id: string;

  @ApiProperty({ example: 'Paraclínicos' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: { laboratorio: 'Sura', prioridad: 'alta' } })
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => {
    // Si el valor llega como string (común en multipart/form-data), lo parseamos
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  metadata: any;
}