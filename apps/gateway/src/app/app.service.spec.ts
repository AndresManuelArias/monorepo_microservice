import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { RequestPasswordDto, LoginDto } from '@medical/shared-dto';

describe('AppService', () => {
  let service: AppService;
  let httpService: HttpService;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPassword', () => {
    it('should call auth service request-password endpoint', async () => {
      const dto: RequestPasswordDto = { cedula: '12345678' };
      const expectedResponse = { message: 'Clave enviada' };
      
      mockHttpService.post.mockReturnValue(of({ data: expectedResponse }));

      const result = await service.requestPassword(dto);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:3001/api-auth/auth/request-password',
        dto
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle error when auth service fails', async () => {
      const dto: RequestPasswordDto = { cedula: '12345678' };
      
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Service unavailable')));

      await expect(service.requestPassword(dto)).rejects.toThrow('Service unavailable');
    });
  });

  describe('login', () => {
    it('should call auth service login endpoint', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'password123' };
      const expectedResponse = { access_token: 'jwt-token', token_type: 'Bearer' };
      
      mockHttpService.post.mockReturnValue(of({ data: expectedResponse }));

      const result = await service.login(dto);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:3001/api-auth/auth/login',
        dto
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle error when login fails', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'wrong-password' };
      
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Unauthorized')));

      await expect(service.login(dto)).rejects.toThrow('Unauthorized');
    });
  });

  describe('getDocuments', () => {
    it('should call document service with auth token', async () => {
      const token = 'valid-jwt-token';
      const expectedResponse = [{ id: '1', name: 'doc1.pdf' }];
      
      mockHttpService.get.mockReturnValue(of({ data: expectedResponse }));

      const result = await service.getDocuments(token);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://localhost:3002/api-document/documents',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle error when fetching documents fails', async () => {
      const token = 'valid-jwt-token';
      
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Forbidden')));

      await expect(service.getDocuments(token)).rejects.toThrow('Forbidden');
    });
  });

  describe('getDocument', () => {
    it('should call document service for specific document', async () => {
      const token = 'valid-jwt-token';
      const docId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResponse = { id: docId, name: 'document.pdf', patient_id: 'patient-1' };
      
      mockHttpService.get.mockReturnValue(of({ data: expectedResponse }));

      const result = await service.getDocument(docId, token);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        `http://localhost:3002/api-document/documents/${docId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle 404 when document not found', async () => {
      const token = 'valid-jwt-token';
      const docId = 'invalid-id';
      
      mockHttpService.get.mockReturnValue(throwError(() => ({ response: { status: 404 } })));

      await expect(service.getDocument(docId, token)).rejects.toEqual({ response: { status: 404 } });
    });
  });

  describe('downloadDocument', () => {
    it('should return signed download URL', async () => {
      const token = 'valid-jwt-token';
      const docId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResponse = { url: 'https://minio.example.com/bucket/doc.pdf?signature=xxx' };
      
      mockHttpService.get.mockReturnValue(of({ data: expectedResponse }));

      const result = await service.downloadDocument(docId, token);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        `http://localhost:3002/api-document/documents/${docId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle 403 when access denied', async () => {
      const token = 'valid-jwt-token';
      const docId = '550e8400-e29b-41d4-a716-446655440000';
      
      mockHttpService.get.mockReturnValue(throwError(() => ({ response: { status: 403 } })));

      await expect(service.downloadDocument(docId, token)).rejects.toEqual({ response: { status: 403 } });
    });
  });
});
