import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'node:fs/promises';
import { Repository } from 'typeorm';
import { Noticia } from './noticia.entity.js';
import { CreateNewsInput, UpdateNewsDto } from './dto/news.dto.js';
import { Role } from '../common/role.enum.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { resolveUploadDir, resolveUploadPath } from '../common/storage.js';
import { AuditService } from '../audit/audit.service.js';

export const toNewsDto = (noticia: Noticia) => ({
  id: noticia.id,
  title: noticia.title,
  summary: noticia.summary,
  body: noticia.body,
  isPublished: noticia.isPublished,
  hasCover: noticia.coverImagePath !== null,
  publishedAt: noticia.publishedAt,
  createdAt: noticia.createdAt,
  updatedAt: noticia.updatedAt,
  author: noticia.author
    ? { id: noticia.author.id, fullName: noticia.author.fullName }
    : null,
});

@Injectable()
export class NewsService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Noticia)
    private readonly newsRepository: Repository<Noticia>,
    config: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.uploadDir = resolveUploadDir(config.get<string>('UPLOAD_DIR'));
  }

  async create(
    input: CreateNewsInput,
    user: AuthUser,
    coverFile?: Express.Multer.File,
  ): Promise<Noticia> {
    const noticia = this.newsRepository.create({
      title: input.title,
      summary: input.summary ?? null,
      body: input.body,
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? new Date() : null,
      coverImagePath: coverFile ? `news/${coverFile.filename}` : null,
      authorId: user.userId,
    });
    const saved = await this.newsRepository.save(noticia);
    return this.newsRepository.findOneOrFail({
      where: { id: saved.id },
      relations: { author: true },
    });
  }

  async findAll(
    query: { q?: string; page?: number; limit?: number },
    role: Role,
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const qb = this.newsRepository
      .createQueryBuilder('noticia')
      .leftJoinAndSelect('noticia.author', 'author');

    if (role === Role.Lector || role === Role.Editor) {
      qb.andWhere('noticia.isPublished = :published', { published: true });
    }

    if (query.q) {
      qb.andWhere(
        '(noticia.title ILIKE :q OR noticia.summary ILIKE :q OR noticia.body ILIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('noticia.publishedAt', 'DESC')
      .addOrderBy('noticia.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items: items.map(toNewsDto), total, page, limit };
  }

  async findOne(id: string, role: Role): Promise<Noticia> {
    const noticia = await this.newsRepository.findOne({
      where: { id },
      relations: { author: true },
    });
    if (!noticia) {
      throw new NotFoundException('Noticia no encontrada');
    }
    if (
      (role === Role.Lector || role === Role.Editor) &&
      !noticia.isPublished
    ) {
      throw new NotFoundException('Noticia no encontrada');
    }
    return noticia;
  }

  async update(id: string, dto: UpdateNewsDto, user: AuthUser): Promise<Noticia> {
    const noticia = await this.findOne(id, user.role);
    this.assertCanModify(noticia, user);

    if (dto.title !== undefined) noticia.title = dto.title;
    if (dto.summary !== undefined) noticia.summary = dto.summary;
    if (dto.body !== undefined) noticia.body = dto.body;
    if (dto.isPublished !== undefined) {
      noticia.isPublished = dto.isPublished;
      noticia.publishedAt = dto.isPublished ? noticia.publishedAt ?? new Date() : noticia.publishedAt;
    }

    return this.newsRepository.save(noticia);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const noticia = await this.findOne(id, user.role);
    this.assertCanModify(noticia, user);

    const coverPath = noticia.coverImagePath;
    await this.newsRepository.remove(noticia);
    if (coverPath) {
      await unlink(resolveUploadPath(this.uploadDir, coverPath)).catch(
        () => undefined,
      );
    }

    await this.auditService
      .record({
        action: 'news.delete',
        userId: user.userId,
        username: user.username,
        details: `Noticia "${noticia.title}" eliminada`,
      })
      .catch(() => undefined);
  }

  getCoverPath(noticia: Noticia): string | null {
    if (!noticia.coverImagePath) return null;
    return resolveUploadPath(this.uploadDir, noticia.coverImagePath);
  }

  private assertCanModify(noticia: Noticia, user: AuthUser): void {
    if (noticia.authorId !== user.userId && user.role !== Role.Admin) {
      throw new ForbiddenException(
        'Solo el autor o un administrador puede modificar esta noticia',
      );
    }
  }
}
