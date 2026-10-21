import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'node:fs/promises';
import { Repository } from 'typeorm';
import { Content } from './content.entity.js';
import { CreateContentInput, UpdateContentDto } from './dto/content.dto.js';
import {
  validateContentFile,
  validateFileSignature,
} from './content-validation.js';
import { resolveUploadDir, resolveUploadPath } from '../common/storage.js';
import { Role } from '../common/role.enum.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { CategoriesService } from '../categories/categories.service.js';
import { Curso } from '../courses/curso.entity.js';
import { Area } from '../areas/area.entity.js';
import { ContentType } from '../common/content-type.enum.js';
import { AuditService } from '../audit/audit.service.js';

export interface ListContentsQuery {
  q?: string;
  category?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  scope?: 'mine';
}

export const toContentDto = (content: Content) => ({
  id: content.id,
  title: content.title,
  description: content.description,
  code: content.code,
  version: content.version,
  elaborationDate: content.elaborationDate,
  updateDate: content.updateDate,
  type: content.type,
  originalName: content.originalName,
  mimeType: content.mimeType,
  sizeBytes: content.sizeBytes,
  embedUrl: content.embedUrl,
  isPublished: content.isPublished,
  cursoId: content.cursoId,
  position: content.position,
  createdAt: content.createdAt,
  updatedAt: content.updatedAt,
  category: content.category
    ? {
        id: content.category.id,
        name: content.category.name,
        slug: content.category.slug,
      }
    : null,
  area: content.area
    ? {
        id: content.area.id,
        name: content.area.name,
        slug: content.area.slug,
      }
    : null,
  uploadedBy: content.uploadedBy
    ? { id: content.uploadedBy.id, fullName: content.uploadedBy.fullName }
    : null,
});

@Injectable()
export class ContentsService {
  private readonly uploadDir: string;
  private readonly config: ConfigService;

  constructor(
    @InjectRepository(Content)
    private readonly contentsRepository: Repository<Content>,
    config: ConfigService,
    private readonly categoriesService: CategoriesService,
    @InjectRepository(Curso)
    private readonly cursosRepository: Repository<Curso>,
    @InjectRepository(Area)
    private readonly areasRepository: Repository<Area>,
    private readonly auditService: AuditService,
  ) {
    this.config = config;
    this.uploadDir = resolveUploadDir(config.get<string>('UPLOAD_DIR'));
  }

  maxFileSizeBytes(): number {
    return Number(this.config.get('MAX_FILE_SIZE_MB') ?? 2048) * 1024 * 1024;
  }

  async create(
    input: CreateContentInput,
    file: Express.Multer.File | undefined,
    user: AuthUser,
  ): Promise<Content> {
    try {
      if (input.type === ContentType.Video && !file && !input.embedUrl) {
        throw new BadRequestException(
          'Un video requiere un archivo o una URL embebida',
        );
      }
      if (input.type === ContentType.Document && !file) {
        throw new BadRequestException('Debe adjuntar un archivo');
      }

      if (file) {
        validateContentFile(
          file.mimetype,
          input.type,
          file.size,
          this.maxFileSizeBytes(),
        );
        await validateFileSignature(file.path, file.mimetype);
      }

      if (input.categoryId) {
        await this.assertCategoryValid(input.categoryId);
      }
      if (input.areaId) {
        await this.assertAreaValid(input.areaId);
      }
      if (input.type === ContentType.Video) {
        if (!input.cursoId) {
          throw new BadRequestException(
            'Todo video debe pertenecer a un curso',
          );
        }
        await this.assertCursoValid(input.cursoId);
      }

      const content = this.contentsRepository.create({
        title: input.title,
        description: input.description ?? null,
        code: input.code ?? null,
        version: input.version ?? null,
        elaborationDate: input.elaborationDate ?? null,
        updateDate: input.updateDate ?? null,
        type: input.type,
        filePath: file ? file.filename : null,
        embedUrl: input.embedUrl ?? null,
        originalName: file ? file.originalname : null,
        mimeType: file ? file.mimetype : null,
        sizeBytes: file ? file.size : null,
        isPublished: input.isPublished,
        categoryId: input.categoryId ?? null,
        areaId: input.areaId ?? null,
        cursoId: input.cursoId ?? null,
        position: input.position ?? 0,
        uploadedById: user.userId,
      });

      const saved = await this.contentsRepository.save(content);
      return this.contentsRepository.findOneOrFail({
        where: { id: saved.id },
        relations: { category: true, area: true, uploadedBy: true },
      });
    } catch (err) {
      if (file) {
        await unlink(file.path).catch(() => undefined);
      }
      throw err;
    }
  }

  async findAll(query: ListContentsQuery, user: AuthUser) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const qb = this.contentsRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.category', 'category')
      .leftJoinAndSelect('content.area', 'area')
      .leftJoinAndSelect('content.uploadedBy', 'uploadedBy');

    if (user.role === Role.Lector || user.role === Role.Comunicador) {
      qb.andWhere('content.isPublished = :published', { published: true });
    } else if (user.role === Role.GestorDocumental) {
      qb.andWhere(
        '(content.isPublished = :published OR content.uploadedById = :me)',
        { published: true, me: user.userId },
      );
    }

    if (query.scope === 'mine') {
      qb.andWhere('content.uploadedById = :uploadedById', {
        uploadedById: user.userId,
      });
    }

    if (query.q) {
      qb.andWhere(
        '(content.title ILIKE :q OR content.description ILIKE :q)',
        { q: `%${query.q}%` },
      );
    }
    if (query.category) {
      qb.andWhere('content.categoryId = :category', { category: query.category });
    }
    if (query.type) {
      qb.andWhere('content.type = :type', { type: query.type });
    }
    if (query.from) {
      qb.andWhere('content.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('content.createdAt <= :to', { to: new Date(query.to) });
    }

    const [items, total] = await qb
      .orderBy('content.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items: items.map(toContentDto), total, page, limit };
  }

  async findOne(id: string, user: AuthUser): Promise<Content> {
    const content = await this.contentsRepository.findOne({
      where: { id },
      relations: { category: true, area: true, uploadedBy: true },
    });
    if (!content) {
      throw new NotFoundException('Contenido no encontrado');
    }
    const isReader =
      user.role === Role.Lector ||
      user.role === Role.Comunicador ||
      user.role === Role.GestorDocumental;
    if (
      isReader &&
      !content.isPublished &&
      content.uploadedById !== user.userId
    ) {
      throw new NotFoundException('Contenido no encontrado');
    }
    return content;
  }

  async update(
    id: string,
    dto: UpdateContentDto,
    user: AuthUser,
  ): Promise<Content> {
    const content = await this.findOne(id, user);
    this.assertCanModify(content, user);

    if (dto.title !== undefined) content.title = dto.title;
    if (dto.description !== undefined) content.description = dto.description;
    if (dto.code !== undefined) content.code = dto.code;
    if (dto.version !== undefined) content.version = dto.version;
    if (dto.elaborationDate !== undefined)
      content.elaborationDate = dto.elaborationDate;
    if (dto.updateDate !== undefined) content.updateDate = dto.updateDate;
    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        await this.assertCategoryValid(dto.categoryId);
        content.categoryId = dto.categoryId;
      } else {
        content.categoryId = null;
      }
    }
    if (dto.areaId !== undefined) {
      if (dto.areaId) {
        await this.assertAreaValid(dto.areaId);
        content.areaId = dto.areaId;
      } else {
        content.areaId = null;
      }
    }
    if (dto.isPublished !== undefined) content.isPublished = dto.isPublished;
    if (dto.position !== undefined) content.position = dto.position;

    const saved = await this.contentsRepository.save(content);
    return this.contentsRepository.findOneOrFail({
      where: { id: saved.id },
      relations: { category: true, area: true, uploadedBy: true },
    });
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const content = await this.findOne(id, user);
    this.assertCanModify(content, user);

    const fullPath = this.getFilePath(content);
    await this.contentsRepository.remove(content);
    if (fullPath) {
      await unlink(fullPath).catch(() => undefined);
    }

    await this.auditService
      .record({
        action: 'content.delete',
        userId: user.userId,
        username: user.username,
        details: `Documento/video "${content.title}" eliminado`,
      })
      .catch(() => undefined);
  }

  getFilePath(content: Content): string | null {
    if (!content.filePath) return null;
    return resolveUploadPath(this.uploadDir, content.filePath);
  }

  private assertCanModify(content: Content, user: AuthUser): void {
    const isOwner = content.uploadedById === user.userId;
    if (!isOwner && user.role !== Role.Admin) {
      throw new ForbiddenException(
        'Solo el autor o un administrador puede modificar este contenido',
      );
    }
  }

  private async assertCategoryValid(categoryId: string): Promise<void> {
    const category = await this.categoriesService.findById(categoryId);
    if (!category || !category.isActive) {
      throw new BadRequestException('La categoría seleccionada no es válida');
    }
  }

  private async assertAreaValid(areaId: string): Promise<void> {
    const area = await this.areasRepository.findOne({
      where: { id: areaId, isActive: true },
    });
    if (!area) {
      throw new BadRequestException('El área seleccionada no es válida');
    }
  }

  private async assertCursoValid(cursoId: string): Promise<void> {
    const curso = await this.cursosRepository.findOne({ where: { id: cursoId } });
    if (!curso) {
      throw new BadRequestException('El curso seleccionado no es válido');
    }
  }

  async findByCourse(cursoId: string, role: Role): Promise<Content[]> {
    const qb = this.contentsRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.category', 'category')
      .leftJoinAndSelect('content.area', 'area')
      .leftJoinAndSelect('content.uploadedBy', 'uploadedBy')
      .where('content.cursoId = :cursoId', { cursoId });

    if (
      role === Role.Lector ||
      role === Role.Comunicador ||
      role === Role.GestorDocumental
    ) {
      qb.andWhere('content.isPublished = :published', { published: true });
    }

    return qb.orderBy('content.position', 'ASC').addOrderBy('content.createdAt', 'ASC').getMany();
  }
}
