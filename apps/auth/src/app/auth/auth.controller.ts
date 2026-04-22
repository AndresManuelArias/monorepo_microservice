import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestPasswordDto } from '@medical/shared-dto'; // Importa tu DTO
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('request-password')
  @ApiOperation({ summary: 'Solicitar clave temporal mediante cédula' })
  @ApiResponse({ status: 200, description: 'Clave temporal enviada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  async requestPassword(@Body() requestPasswordDto: RequestPasswordDto) {
    return this.authService.requestPassword(requestPasswordDto.cedula);
  }
}