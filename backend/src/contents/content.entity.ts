import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentType } from '../common/content-type.enum.js';
import { Category } from '../categories/category.entity.js';
import { Curso } from '../courses/curso.entity.js';
import { User } from '../users/user.entity.js';

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ContentType })
  type: ContentType;

  @Column({ type: 'varchar', nullable: true })
  filePath: string | null;

  @Column({ type: 'varchar', nullable: true })
  embedUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  originalName: string | null;

  @Column({ type: 'varchar', nullable: true })
  mimeType: string | null;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  sizeBytes: number | null;

  @Column({ default: false })
  isPublished: boolean;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  cursoId: string | null;

  @ManyToOne(() => Curso, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cursoId' })
  curso: Curso | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column()
  uploadedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
