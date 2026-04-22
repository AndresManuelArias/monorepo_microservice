import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, RequestPasswordDto } from '@medical/shared-dto';
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

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con correo y clave temporal' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna el token.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas o clave expirada.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}