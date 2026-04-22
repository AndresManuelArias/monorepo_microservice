import { Controller, Post, Body, UseInterceptors, UploadedFile, Get, Param, Request, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiConsumes, 
  ApiBody, 
  ApiOperation, 
  ApiTags, 
  ApiResponse, 
  ApiParam,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from '@medical/shared-dto';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { ClinicalDocument } from 'libs/database/src/lib/entities/document.entity';
import { JwtAuthGuard } from '@medical/auth-guard';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

    @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir un nuevo documento PDF' })
  @ApiBody({
    description: 'Archivo PDF y metadatos del documento',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF del examen o concepto médico',
        },
        patient_id: { type: 'string', description: 'UUID del paciente' },
        type: { type: 'string', description: 'Tipo de documento (ej: Paraclínico)', example: 'Paraclínico' },
        metadata: { 
          type: 'string', 
          description: 'JSON con información extra', 
          example: '{"laboratorio": "laboratorio", "prioridad": "alta"}' 
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Documento subido y registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o formato de archivo no soportado.' })
  async uploadDocument(
    @Body() body: CreateDocumentDto,
    @UploadedFile() file: any 
  ) {
    return this.documentsService.uploadAndCreate(body, file);
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Consultar detalle de un documento específico',
    description: 'Retorna la información completa de un documento siempre que pertenezca al paciente autenticado.' 
  })
  @ApiParam({ name: 'id', description: 'UUID del documento', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Detalle del documento obtenido.', type: ClinicalDocument })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.documentsService.findOne(id, req.user.sub);
  }
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ 
    summary: 'Listar documentos del paciente autenticado',
    description: 'Retorna todos los documentos asociados al paciente extraído del token JWT.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de documentos obtenida exitosamente.',
    type: [ClinicalDocument] 
  })
  async findAll(@Request() req) {
    const patientId = req.user.sub;
    return this.documentsService.findAllByPatient(patientId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/download')
  @ApiOperation({ 
    summary: 'Obtener URL segura de descarga', 
    description: 'Genera una URL firmada de MinIO que expira en 5 minutos. Solo el propietario del documento puede acceder.' 
  })
  @ApiParam({ name: 'id', description: 'UUID del documento clínico', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'URL generada exitosamente.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: El documento no pertenece al paciente autenticado.' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async download(@Param('id') id: string, @Request() req) {
    console.log(req.user);
    return this.documentsService.getSecureDownloadUrl(id, req.user.sub);
  }


}