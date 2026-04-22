import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { ConflictException } from '@nestjs/common';
import { CreatePatientDto } from '@medical/shared-dto';

describe('PatientsController', () => {
  let controller: PatientsController;
  let service: PatientsService;

  const mockPatientsService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        {
          provide: PatientsService,
          useValue: mockPatientsService,
        },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const dto: CreatePatientDto = {
        cedula: '12345678',
        email: 'test@test.com',
        password: 'password123',
      };
      const expectedPatient = { id: 'uuid', ...dto };
      mockPatientsService.create.mockResolvedValue(expectedPatient);

      const result = await controller.create(dto);

      expect(mockPatientsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedPatient);
    });

    it('should throw ConflictException when cedula already exists', async () => {
      const dto: CreatePatientDto = {
        cedula: '12345678',
        email: 'test@test.com',
        password: 'password123',
      };
      mockPatientsService.create.mockRejectedValue(new ConflictException('El paciente con esta cédula ya existe'));

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return list of patients', async () => {
      const patients = [
        { id: '1', cedula: '12345678', email: 'test1@test.com' },
        { id: '2', cedula: '87654321', email: 'test2@test.com' },
      ];
      mockPatientsService.findAll.mockResolvedValue(patients);

      const result = await controller.findAll();

      expect(mockPatientsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(patients);
    });

    it('should return empty array when no patients exist', async () => {
      mockPatientsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });
});