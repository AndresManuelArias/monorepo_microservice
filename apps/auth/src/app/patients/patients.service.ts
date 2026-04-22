import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '@medical/database';
import { CreatePatientDto } from '@medical/shared-dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const { cedula, email,password } = createPatientDto;

    const existingPatient = await this.patientRepository.findOne({
      where: { cedula },
    });

    if (existingPatient) {
      throw new ConflictException('El paciente con esta cédula ya existe');
    }


    const salt = await bcrypt.genSalt(10);
    const initialPassword = password
    const hashedPassword = await bcrypt.hash(initialPassword, salt);

    const newPatient = this.patientRepository.create({
      ...createPatientDto,
      passwordHash: hashedPassword,
    });

    return await this.patientRepository.save(newPatient);
  }
}