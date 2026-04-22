import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalDocument } from '@medical/database';
import { CreateDocumentDto } from '@medical/shared-dto';

@Injectable()
export class DocumentsService {
  private s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:9000', // Tu contenedor de MinIO
    forcePathStyle: true,
    credentials: {
      accessKeyId: 'admin',
      secretAccessKey: 'medical_password',
    },
  });

  private readonly BUCKET_NAME = 'clinical-documents';
  constructor(
    @InjectRepository(ClinicalDocument)
    private readonly documentRepo: Repository<ClinicalDocument>,
  ) {}
  async uploadAndCreate(dto: CreateDocumentDto, file: Express.Multer.File) {
    const fileName = `${Date.now()}-${file.originalname}`;

    try {
      // 1. Subir el archivo físico a MinIO
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.BUCKET_NAME,
          Key: fileName,
          Body: file.buffer, // Los bytes del archivo
          ContentType: file.mimetype,
        }),
      );

      // 2. Guardar el registro en PostgreSQL
      const newDoc = this.documentRepo.create({
        patient_id: dto.patient_id,
        type: dto.type,
        metadata: typeof dto.metadata === 'string' ? JSON.parse(dto.metadata) : dto.metadata,
        file_url: fileName,
        state: 'active',
      });

      return await this.documentRepo.save(newDoc);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      throw new InternalServerErrorException('No se pudo procesar el documento');
    }
  }
  async create(dto: CreateDocumentDto, fileName: string) {
    const newDoc = this.documentRepo.create({
      ...dto,
      file_url: fileName, 
      state: 'active',
    });
    return await this.documentRepo.save(newDoc);
  }
}