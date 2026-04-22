import { Controller, Get, Post, Body, Param, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { RequestPasswordDto, LoginDto } from '@medical/shared-dto';
import { JwtAuthGuard } from '@medical/auth-guard';

@ApiTags('Gateway')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Health check
  @Get()
  getData() {
    return { message: 'Gateway API - Medical Microservices' };
  }

  // Auth endpoints
  @Post('auth/request-password')
  @ApiOperation({ summary: 'Solicitar clave temporal mediante cédula' })
  @ApiResponse({ status: 200, description: 'Clave temporal enviada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  async requestPassword(@Body() dto: RequestPasswordDto) {
    return this.appService.requestPassword(dto);
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Iniciar sesión con correo y clave temporal' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna el token.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas o clave expirada.' })
  async login(@Body() dto: LoginDto) {
    return this.appService.login(dto);
  }

  // Document endpoints
  @Get('documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar documentos del paciente autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de documentos obtenida exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async getDocuments(@Headers('authorization') authHeader: string) {
    const token = this.extractToken(authHeader);
    return this.appService.getDocuments(token);
  }

  @Get('documents/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar detalle de un documento específico' })
  @ApiResponse({ status: 200, description: 'Detalle del documento obtenido.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async getDocument(@Param('id') id: string, @Headers('authorization') authHeader: string) {
    const token = this.extractToken(authHeader);
    return this.appService.getDocument(id, token);
  }

  @Get('documents/:id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener URL segura de descarga' })
  @ApiResponse({ status: 200, description: 'URL generada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async downloadDocument(@Param('id') id: string, @Headers('authorization') authHeader: string) {
    const token = this.extractToken(authHeader);
    return this.appService.downloadDocument(id, token);
  }

  private extractToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    return authHeader.substring(7);
  }
}
