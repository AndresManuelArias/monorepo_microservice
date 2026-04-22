import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { Patient } from '@medical/database';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let repository: any;
  let jwtService: any;

  const mockPatient = {
    id: 'patient-uuid',
    cedula: '12345678',
    email: 'test@test.com',
    tempPasswordHash: null,
    tempPasswordExpiry: null,
  };

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get(getRepositoryToken(Patient));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPassword', () => {
    it('should throw NotFoundException when patient not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.requestPassword('00000000')).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { cedula: '00000000' } });
    });

    it('should generate temp password and save to patient', async () => {
      const patientWithEmail = { ...mockPatient, email: 'test@test.com' };
      mockRepository.findOne.mockResolvedValue(patientWithEmail);
      mockRepository.save.mockResolvedValue(patientWithEmail);

      const result = await service.requestPassword('12345678');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { cedula: '12345678' } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.message).toContain('Si el usuario existe');
    });

    it('should save temp password with 15 minute expiry', async () => {
      const patientWithEmail = { ...mockPatient, email: 'test@test.com' };
      mockRepository.findOne.mockResolvedValue(patientWithEmail);
      
      let savedPatient: any;
      mockRepository.save.mockImplementation((patient) => {
        savedPatient = patient;
        return Promise.resolve(patient);
      });

      await service.requestPassword('12345678');

      expect(savedPatient.tempPasswordHash).toBeDefined();
      expect(savedPatient.tempPasswordExpiry).toBeInstanceOf(Date);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when patient not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const dto = { email: 'notfound@test.com', password: 'password' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no temp password exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockPatient);

      const dto = { email: 'test@test.com', password: 'password' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when temp password expired', async () => {
      const expiredPatient = {
        ...mockPatient,
        tempPasswordHash: 'hash',
        tempPasswordExpiry: new Date(Date.now() - 1000),
      };
      mockRepository.findOne.mockResolvedValue(expiredPatient);

      const dto = { email: 'test@test.com', password: 'password' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const validPatient = {
        ...mockPatient,
        tempPasswordHash: await bcrypt.hash('correct-password', 10),
        tempPasswordExpiry: new Date(Date.now() + 60000),
      };
      mockRepository.findOne.mockResolvedValue(validPatient);

      const dto = { email: 'test@test.com', password: 'wrong-password' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return JWT token when credentials are valid', async () => {
      const validPatient = {
        ...mockPatient,
        tempPasswordHash: await bcrypt.hash('correct-password', 10),
        tempPasswordExpiry: new Date(Date.now() + 60000),
      };
      mockRepository.findOne.mockResolvedValue(validPatient);
      mockRepository.save.mockResolvedValue(validPatient);

      const dto = { email: 'test@test.com', password: 'correct-password' };
      const result = await service.login(dto);

      expect(result.access_token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(validPatient.id);
      expect(result.user.email).toBe(validPatient.email);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: validPatient.id, email: validPatient.email, cedula: validPatient.cedula });
    });
  });
});