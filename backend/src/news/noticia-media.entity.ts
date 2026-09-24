import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('noticia_media')
export class NoticiaMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  noticiaId: string;

  @Column()
  type: string;

  @Column()
  filePath: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  sizeBytes: number;

  @CreateDateColumn()
  createdAt: Date;
}
