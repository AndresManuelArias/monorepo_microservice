import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UnauthorizedException } from '@nestjs/common';
import { RequestPasswordDto, LoginDto } from '@medical/shared-dto';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  const mockAppService = {
    requestPassword: jest.fn(),
    login: jest.fn(),
    getDocuments: jest.fn(),
    getDocument: jest.fn(),
    downloadDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getData', () => {
    it('should return gateway message', () => {
      const result = controller.getData();
      expect(result).toEqual({ message: 'Gateway API - Medical Microservices' });
    });
  });

  describe('requestPassword', () => {
    it('should call requestPassword service with dto', async () => {
      const dto: RequestPasswordDto = { cedula: '12345678' };
      const expectedResult = { message: 'Clave enviada' };
      mockAppService.requestPassword.mockResolvedValue(expectedResult);

      const result = await controller.requestPassword(dto);

      expect(mockAppService.requestPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call login service with dto', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'password123' };
      const expectedResult = { access_token: 'jwt-token' };
      mockAppService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(dto);

      expect(mockAppService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getDocuments', () => {
    it('should return documents list with valid token', async () => {
      const token = 'Bearer valid-token';
      const expectedResult = [{ id: '1', name: 'doc1.pdf' }];
      mockAppService.getDocuments.mockResolvedValue(expectedResult);

      const result = await controller.getDocuments(token);

      expect(mockAppService.getDocuments).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      await expect(controller.getDocuments('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is not Bearer', async () => {
      await expect(controller.getDocuments('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getDocument', () => {
    it('should return document detail with valid token', async () => {
      const token = 'Bearer valid-token';
      const docId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResult = { id: docId, name: 'document.pdf' };
      mockAppService.getDocument.mockResolvedValue(expectedResult);

      const result = await controller.getDocument(docId, token);

      expect(mockAppService.getDocument).toHaveBeenCalledWith(docId, 'valid-token');
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const docId = '550e8400-e29b-41d4-a716-446655440000';
      await expect(controller.getDocument(docId, '')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('downloadDocument', () => {
    it('should return download URL with valid token', async () => {
      const token = 'Bearer valid-token';
      const docId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResult = { url: 'https://minio.example.com/bucket/doc.pdf?signature=xxx' };
      mockAppService.downloadDocument.mockResolvedValue(expectedResult);

      const result = await controller.downloadDocument(docId, token);

      expect(mockAppService.downloadDocument).toHaveBeenCalledWith(docId, 'valid-token');
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const docId = '550e8400-e29b-41d4-a716-446655440000';
      await expect(controller.downloadDocument(docId, '')).rejects.toThrow(UnauthorizedException);
    });
  });
});
