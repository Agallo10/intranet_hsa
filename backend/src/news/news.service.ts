import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'node:fs/promises';
import { Repository } from 'typeorm';
import sanitizeHtml from 'sanitize-html';
import { Noticia } from './noticia.entity.js';
import { NoticiaMedia } from './noticia-media.entity.js';
import { CreateNewsInput, MediaMeta, UpdateNewsDto } from './dto/news.dto.js';
import { Role } from '../common/role.enum.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { resolveUploadDir, resolveUploadPath } from '../common/storage.js';
import { AuditService } from '../audit/audit.service.js';

const sanitizeBody = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4',
      'ul', 'ol', 'li',
      'a', 'blockquote',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      '*': ['style'],
    },
    allowedStyles: {
      '*': { 'text-align': [/^(left|right|center|justify)$/] },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });

export const toMediaDto = (m: NoticiaMedia) => ({
  id: m.id,
  type: m.type,
  originalName: m.originalName,
  mimeType: m.mimeType,
  sizeBytes: m.sizeBytes,
});

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
  category: noticia.category
    ? { id: noticia.category.id, name: noticia.category.name, slug: noticia.category.slug }
    : null,
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
    @InjectRepository(NoticiaMedia)
    private readonly mediaRepository: Repository<NoticiaMedia>,
    config: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.uploadDir = resolveUploadDir(config.get<string>('UPLOAD_DIR'));
  }

  async create(
    input: CreateNewsInput,
    user: AuthUser,
    coverFile?: Express.Multer.File,
    media: MediaMeta[] = [],
  ): Promise<Noticia> {
    const noticia = this.newsRepository.create({
      title: input.title,
      summary: input.summary ?? null,
      body: sanitizeBody(input.body),
      categoryId: input.categoryId ?? null,
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? new Date() : null,
      coverImagePath: coverFile ? `news/${coverFile.filename}` : null,
      authorId: user.userId,
    });
    const saved = await this.newsRepository.save(noticia);

    if (media.length > 0) {
      const rows = media.map((m) =>
        this.mediaRepository.create({
          noticiaId: saved.id,
          type: m.type,
          filePath: m.path,
          originalName: m.name,
          mimeType: m.mime,
          sizeBytes: m.size,
        }),
      );
      await this.mediaRepository.save(rows);
    }

    return this.findOne(saved.id, user.role);
  }

  async findAll(
    query: { q?: string; category?: string; page?: number; limit?: number },
    role: Role,
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const qb = this.newsRepository
      .createQueryBuilder('noticia')
      .leftJoinAndSelect('noticia.author', 'author')
      .leftJoinAndSelect('noticia.category', 'category');

    if (role === Role.Lector || role === Role.Editor) {
      qb.andWhere('noticia.isPublished = :published', { published: true });
    }

    if (query.category) {
      qb.andWhere('noticia.categoryId = :category', { category: query.category });
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
      relations: { author: true, category: true },
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
    if (dto.body !== undefined) noticia.body = sanitizeBody(dto.body);
    if (dto.categoryId !== undefined) noticia.categoryId = dto.categoryId;
    if (dto.isPublished !== undefined) {
      noticia.isPublished = dto.isPublished;
      noticia.publishedAt = dto.isPublished
        ? noticia.publishedAt ?? new Date()
        : noticia.publishedAt;
    }

    return this.newsRepository.save(noticia);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const noticia = await this.findOne(id, user.role);
    this.assertCanModify(noticia, user);

    const media = await this.mediaRepository.find({ where: { noticiaId: id } });
    const coverPath = noticia.coverImagePath;

    await this.mediaRepository.remove(media);
    await this.newsRepository.remove(noticia);

    for (const m of media) {
      await unlink(resolveUploadPath(this.uploadDir, m.filePath)).catch(
        () => undefined,
      );
    }
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

  async listMedia(noticiaId: string): Promise<NoticiaMedia[]> {
    return this.mediaRepository.find({
      where: { noticiaId },
      order: { createdAt: 'ASC' },
    });
  }

  async addMedia(
    noticiaId: string,
    media: MediaMeta[],
    user: AuthUser,
  ): Promise<NoticiaMedia[]> {
    const noticia = await this.findOne(noticiaId, user.role);
    this.assertCanModify(noticia, user);

    const rows = media.map((m) =>
      this.mediaRepository.create({
        noticiaId,
        type: m.type,
        filePath: m.path,
        originalName: m.name,
        mimeType: m.mime,
        sizeBytes: m.size,
      }),
    );
    return this.mediaRepository.save(rows);
  }

  async removeMedia(mediaId: string, user: AuthUser): Promise<void> {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException('Medio no encontrado');
    }
    const noticia = await this.findOne(media.noticiaId, user.role);
    this.assertCanModify(noticia, user);

    await this.mediaRepository.remove(media);
    await unlink(resolveUploadPath(this.uploadDir, media.filePath)).catch(
      () => undefined,
    );
  }

  async findMedia(mediaId: string): Promise<NoticiaMedia | null> {
    return this.mediaRepository.findOne({ where: { id: mediaId } });
  }

  getMediaPath(media: NoticiaMedia): string {
    return resolveUploadPath(this.uploadDir, media.filePath);
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
