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
import { User } from '../users/user.entity.js';
import { NewsCategory } from './news-category.entity.js';

@Entity('noticias')
export class Noticia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', nullable: true })
  coverImagePath: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => NewsCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: NewsCategory | null;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column()
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
