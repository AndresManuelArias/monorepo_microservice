import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Patient } from '@medical/database';
import { CreatePatientDto } from '@medical/shared-dto';
import * as bcrypt from 'bcrypt';

describe('PatientsService', () => {
  let service: PatientsService;
  let repository: any;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    repository = module.get(getRepositoryToken(Patient));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException when cedula already exists', async () => {
      const createDto: CreatePatientDto = {
        cedula: '12345678',
        email: 'test@test.com',
        password: 'password123',
      };
      mockRepository.findOne.mockResolvedValue({ id: 'existing-patient' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { cedula: '12345678' } });
    });

    it('should create patient with hashed password', async () => {
      const createDto: CreatePatientDto = {
        cedula: '12345678',
        email: 'test@test.com',
        password: 'password123',
      };
      mockRepository.findOne.mockResolvedValue(null);
      
      const createdPatient = { id: 'new-uuid', ...createDto, passwordHash: 'hashed' };
      mockRepository.create.mockReturnValue(createdPatient);
      mockRepository.save.mockResolvedValue(createdPatient);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(createdPatient);
    });

    it('should hash password using bcrypt', async () => {
      const createDto: CreatePatientDto = {
        cedula: '12345678',
        email: 'test@test.com',
        password: 'password123',
      };
      mockRepository.findOne.mockResolvedValue(null);
      
      let savedPatient: any;
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((patient) => {
        savedPatient = patient;
        return Promise.resolve(patient);
      });

      await service.create(createDto);

      expect(savedPatient.passwordHash).toBeDefined();
      const isValid = await bcrypt.compare('password123', savedPatient.passwordHash);
      expect(isValid).toBe(true);
    });

    it('should save all patient data', async () => {
      const createDto: CreatePatientDto = {
        cedula: '12345678',
        email: 'test@test.com',
        password: 'password123',
      };
      mockRepository.findOne.mockResolvedValue(null);
      
      let savedPatient: any;
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((patient) => {
        savedPatient = patient;
        return Promise.resolve(patient);
      });

      await service.create(createDto);

      expect(savedPatient.cedula).toBe('12345678');
      expect(savedPatient.email).toBe('test@test.com');
    });
  });

  describe('findAll', () => {
    it('should return all patients with selected fields', async () => {
      const patients = [
        { id: '1', cedula: '12345678', email: 'test1@test.com', createdAt: new Date() },
        { id: '2', cedula: '87654321', email: 'test2@test.com', createdAt: new Date() },
      ];
      mockRepository.find.mockResolvedValue(patients);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ['id', 'cedula', 'email', 'createdAt'],
      });
      expect(result).toEqual(patients);
    });

    it('should return empty array when no patients', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});