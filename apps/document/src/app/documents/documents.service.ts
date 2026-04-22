import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { S3Client, PutObjectCommand,GetObjectCommand } from '@aws-sdk/client-s3';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalDocument } from '@medical/database';
import { CreateDocumentDto } from '@medical/shared-dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface MulterFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

@Injectable()
export class DocumentsService {
  private s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:9000',
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
  async getSecureDownloadUrl(documentId: string, requestUserId: string) {
    const doc = await this.documentRepo.findOne({ where: { id: documentId } });

    if (!doc) throw new NotFoundException('Documento no encontrado');


    if (doc.patient_id !== requestUserId) {
      throw new ForbiddenException('No tienes permiso para acceder a este documento');
    }

  
    const command = new GetObjectCommand({
      Bucket: 'clinical-documents',
      Key: doc.file_url,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    return { download_url: url };
  }
  async uploadAndCreate(dto: CreateDocumentDto, file: MulterFile) {
    const fileName = `${Date.now()}-${file.originalname}`;

    try {

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.BUCKET_NAME,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );


      const newDoc = this.documentRepo.create({
        ...dto,
        file_url: fileName,
        state: 'active',
      });

      return await this.documentRepo.save(newDoc);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      throw new InternalServerErrorException('No se pudo procesar el documento');
    }
  }
  async findAllByPatient(patientId: string): Promise<ClinicalDocument[]> {
    return await this.documentRepo.find({
      where: { 
        patient_id: patientId,
        state: 'active' 
      },
      order: {
        created_at: 'DESC'
      }
    });
  }

  async findOne(docId: string, patientId: string): Promise<ClinicalDocument> {
    const document = await this.documentRepo.findOne({
      where: { id: docId }
    });

    if (!document) {
      throw new NotFoundException('El documento solicitado no existe');
    }

    if (document.patient_id !== patientId) {
      throw new ForbiddenException('No tienes permisos para ver el detalle de este documento');
    }

    return document;
  }
}