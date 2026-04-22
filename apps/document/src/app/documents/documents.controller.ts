import { Controller, Post, Body, UseInterceptors, UploadedFile, Get, Param, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody,ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from '@medical/shared-dto';


@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get(':id/download')
  @ApiOperation({ summary: 'Obtener URL segura de descarga' })
  async download(@Param('id') id: string, @Request() req) {
    // req.user viene del payload del JWT que configuramos en el login
    return this.documentsService.getSecureDownloadUrl(id, req.user.sub);
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadDocument(
    @Body() body: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.documentsService.uploadAndCreate(body, file);
  }
}