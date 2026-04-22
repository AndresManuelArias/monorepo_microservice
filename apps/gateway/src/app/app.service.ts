import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RequestPasswordDto, LoginDto } from '@medical/shared-dto';

@Injectable()
export class AppService {
  private readonly authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api-auth';
  private readonly documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3002/api-document';

  constructor(private readonly httpService: HttpService) {}

  // Auth endpoints
  async requestPassword(dto: RequestPasswordDto) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/request-password`, dto)
    );
    return response.data;
  }

  async login(dto: LoginDto) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/login`, dto)
    );
    return response.data;
  }

  // Document endpoints
  async getDocuments(token: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.documentServiceUrl}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    return response.data;
  }

  async getDocument(id: string, token: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.documentServiceUrl}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    return response.data;
  }

  async downloadDocument(id: string, token: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.documentServiceUrl}/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    return response.data;
  }
}
