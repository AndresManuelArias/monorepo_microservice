
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  cedula: string;

  @Column()
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}