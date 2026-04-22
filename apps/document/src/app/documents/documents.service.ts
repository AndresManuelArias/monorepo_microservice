import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalDocument } from '@medical/database';
import { CreateDocumentDto } from '@medical/shared-dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(ClinicalDocument)
    private readonly documentRepo: Repository<ClinicalDocument>,
  ) {}

  async create(dto: CreateDocumentDto, fileName: string) {
    const newDoc = this.documentRepo.create({
      ...dto,
      file_url: fileName, 
      state: 'active',
    });
    return await this.documentRepo.save(newDoc);
  }
}