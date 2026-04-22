import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from '@medical/shared-dto';


@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        patient_id: { type: 'string' },
        type: { type: 'string' },
        metadata: { type: 'string' }
      },
    },
  })
  async uploadDocument(
    @Body() body: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    const fileName = `${Date.now()}-${file.originalname}`;
    return this.documentsService.create(body, fileName);
  }
}