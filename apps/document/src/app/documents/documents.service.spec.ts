import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { ClinicalDocument } from '@medical/database';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface MulterFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  fieldname: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  encoding: string;
}

// Variable global para el mock de send
let mockSend: jest.Mock;

beforeAll(() => {
  mockSend = jest.fn();
});

jest.mock('@aws-sdk/client-s3', () => {
  const mockSendFn = jest.fn();
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSendFn,
    })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    __mockSend: mockSendFn,
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.com'),
}));

describe('DocumentsService', () => {
  let service: DocumentsService;
  let mockRepository: any;

  const mockDocument: ClinicalDocument = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    patient_id: 'patient-123',
    type: 'Paraclínico',
    file_url: 'test-file.pdf',
    metadata: { laboratorio: 'test-lab' },
    state: 'active',
    created_at: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    // Resetear el mock de send desde el módulo mockeado
    const awsMock = require('@aws-sdk/client-s3');
    awsMock.__mockSend.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(ClinicalDocument),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadAndCreate', () => {
    it('should upload file to S3 and create document record', async () => {
      const mockFile: MulterFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        fieldname: 'file',
        size: 0,
        destination: '',
        filename: '',
        path: '',
        encoding: '',
      };

      const mockDto = {
        patient_id: 'patient-123',
        type: 'Paraclínico',
        metadata: { laboratorio: 'test-lab' },
      };

      const awsMock = require('@aws-sdk/client-s3');
      awsMock.__mockSend.mockResolvedValue({});
      mockRepository.create.mockReturnValue(mockDocument);
      mockRepository.save.mockResolvedValue(mockDocument);

      const result = await service.uploadAndCreate(mockDto, mockFile);

      expect(awsMock.__mockSend).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...mockDto,
        file_url: expect.any(String),
        state: 'active',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockDocument);
      expect(result).toEqual(mockDocument);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const mockFile: MulterFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        fieldname: 'file',
        size: 0,
        destination: '',
        filename: '',
        path: '',
        encoding: '',
      };

      const awsMock = require('@aws-sdk/client-s3');
      awsMock.__mockSend.mockRejectedValue(new Error('S3 error'));

      await expect(
        service.uploadAndCreate({ patient_id: '123', type: 'Paraclínico', metadata: {} }, mockFile),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getSecureDownloadUrl', () => {
    it('should return signed URL for valid document owner', async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);

      const result = await service.getSecureDownloadUrl(mockDocument.id, mockDocument.patient_id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockDocument.id },
      });
      expect(result).toHaveProperty('download_url');
    });

    it('should throw NotFoundException when document not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getSecureDownloadUrl('non-existent-id', 'patient-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);

      await expect(
        service.getSecureDownloadUrl(mockDocument.id, 'different-patient'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByPatient', () => {
    it('should return all active documents for a patient', async () => {
      const documents = [mockDocument];
      mockRepository.find.mockResolvedValue(documents);

      const result = await service.findAllByPatient('patient-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { patient_id: 'patient-123', state: 'active' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(documents);
    });
  });

  describe('findOne', () => {
    it('should return document when found and owned by patient', async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);

      const result = await service.findOne(mockDocument.id, mockDocument.patient_id);

      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException when document not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', 'patient-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when patient does not own document', async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);

      await expect(
        service.findOne(mockDocument.id, 'different-patient'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});