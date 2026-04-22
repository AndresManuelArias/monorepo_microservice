import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('documents')
export class ClinicalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column()
  type: string; 

  @Column()
  file_url: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: 'active' })
  state: string;

  @CreateDateColumn()
  created_at: Date;
}