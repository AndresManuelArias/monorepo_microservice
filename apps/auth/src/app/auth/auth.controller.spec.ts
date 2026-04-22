import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginDto, RequestPasswordDto } from '@medical/shared-dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    requestPassword: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPassword', () => {
    it('should call requestPassword service with cedula', async () => {
      const dto: RequestPasswordDto = { cedula: '12345678' };
      const expectedResult = { message: 'Clave enviada' };
      mockAuthService.requestPassword.mockResolvedValue(expectedResult);

      const result = await controller.requestPassword(dto);

      expect(mockAuthService.requestPassword).toHaveBeenCalledWith('12345678');
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when patient not found', async () => {
      const dto: RequestPasswordDto = { cedula: '00000000' };
      mockAuthService.requestPassword.mockRejectedValue(new NotFoundException('Paciente no encontrado'));

      await expect(controller.requestPassword(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('login', () => {
    it('should call login service with credentials', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'a1b2c3d4' };
      const expectedResult = { access_token: 'jwt-token', token_type: 'Bearer' };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'wrong-password' };
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Credenciales inválidas'));

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password expired', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'expired-password' };
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('La clave temporal ha expirado'));

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});