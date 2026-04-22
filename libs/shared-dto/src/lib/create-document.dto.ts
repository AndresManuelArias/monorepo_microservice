
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ example: 'uuid-del-paciente' })
  @IsUUID()
  @IsNotEmpty()
  patient_id: string;

  @ApiProperty({ example: 'Paraclínico' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: { hospital: 'Central', doctor: 'Dr. Arias' } })
  @IsObject()
  @IsOptional()
  metadata: any;
}