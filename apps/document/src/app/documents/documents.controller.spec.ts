import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClinicalDocument } from '@medical/database';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockDocument: ClinicalDocument = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    patient_id: 'patient-123',
    type: 'Paraclínicos',
    file_url: 'test-file.pdf',
    metadata: { laboratorio: 'test-lab' },
    state: 'active',
    created_at: new Date(),
  };

  const mockUser = { sub: 'patient-123' };
  const mockRequest = { user: mockUser };

  beforeEach(async () => {
    const mockService = {
      uploadAndCreate: jest.fn(),
      getSecureDownloadUrl: jest.fn(),
      findOne: jest.fn(),
      findAllByPatient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should upload and create a document', async () => {
      const mockDto = {
        patient_id: 'patient-123',
        type: 'Paraclínicos',
        metadata: { laboratorio: 'test-lab' },
      };
      const mockFile = { originalname: 'test.pdf' } as any;

      jest.spyOn(service, 'uploadAndCreate').mockResolvedValue(mockDocument);

      const result = await controller.uploadDocument(mockDto, mockFile);

      expect(service.uploadAndCreate).toHaveBeenCalledWith(mockDto, mockFile);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('download', () => {
    it('should return signed download URL', async () => {
      const signedUrl = { download_url: 'https://signed-url.com' };
      jest.spyOn(service, 'getSecureDownloadUrl').mockResolvedValue(signedUrl);

      const result = await controller.download(mockDocument.id, mockRequest);

      expect(service.getSecureDownloadUrl).toHaveBeenCalledWith(
        mockDocument.id,
        mockUser.sub,
      );
      expect(result).toEqual(signedUrl);
    });
  });

  describe('findOne', () => {
    it('should return document details', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);

      const result = await controller.findOne(mockDocument.id, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(mockDocument.id, mockUser.sub);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('findAll', () => {
    it('should return all documents for the authenticated patient', async () => {
      const documents = [mockDocument];
      jest.spyOn(service, 'findAllByPatient').mockResolvedValue(documents);

      const result = await controller.findAll(mockRequest);

      expect(service.findAllByPatient).toHaveBeenCalledWith(mockUser.sub);
      expect(result).toEqual(documents);
    });
  });
});