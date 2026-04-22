import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from '@medical/shared-dto';
import { Patient } from 'libs/database/src/lib/entities/patient.entity';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente creado exitosamente.' })
  @ApiResponse({ status: 409, description: 'Cédula ya registrada.' })
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener listado de todos los pacientes' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de pacientes obtenida correctamente.',
    type: [Patient]
  })
  findAll() {
    return this.patientsService.findAll();
  }
}