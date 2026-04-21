// apps/auth/src/app/patients/patients.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '@medical/database';
import { CreatePatientDto } from '@medical/shared-dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const existingPatient = await this.patientRepository.findOne({
      where: { cedula: createPatientDto.cedula },
    });

    if (existingPatient) {
      throw new ConflictException('El paciente con esta cédula ya existe');
    }

    const newPatient = this.patientRepository.create(createPatientDto);
    return await this.patientRepository.save(newPatient);
  }
}