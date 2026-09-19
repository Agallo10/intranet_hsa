import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from './curso.entity.js';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto.js';
import { Role } from '../common/role.enum.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { AuditService } from '../audit/audit.service.js';

export const toCourseDto = (curso: Curso) => ({
  id: curso.id,
  title: curso.title,
  description: curso.description,
  isPublished: curso.isPublished,
  createdAt: curso.createdAt,
  updatedAt: curso.updatedAt,
  createdBy: curso.createdBy
    ? { id: curso.createdBy.id, fullName: curso.createdBy.fullName }
    : null,
});

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Curso)
    private readonly coursesRepository: Repository<Curso>,
    private readonly auditService: AuditService,
  ) {}

  async findById(id: string): Promise<Curso | null> {
    return this.coursesRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
  }

  async findAll(query: { q?: string }, role: Role) {
    const qb = this.coursesRepository
      .createQueryBuilder('curso')
      .leftJoinAndSelect('curso.createdBy', 'createdBy');

    if (role === Role.Lector || role === Role.Comunicador) {
      qb.andWhere('curso.isPublished = :published', { published: true });
    }

    if (query.q) {
      qb.andWhere('(curso.title ILIKE :q OR curso.description ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    const cursos = await qb
      .orderBy('curso.createdAt', 'DESC')
      .getMany();

    const ids = cursos.map((c) => c.id);
    const counts: { cursoId: string; count: string }[] = ids.length
      ? await this.coursesRepository.manager
          .createQueryBuilder()
          .select('content.cursoId', 'cursoId')
          .addSelect('COUNT(*)', 'count')
          .from('contents', 'content')
          .where('content.cursoId IN (:...ids)', { ids })
          .groupBy('content.cursoId')
          .getRawMany()
      : [];
    const countMap = new Map(counts.map((c) => [c.cursoId, Number(c.count)]));

    return cursos.map((c) => ({
      ...toCourseDto(c),
      videoCount: countMap.get(c.id) ?? 0,
    }));
  }

  async create(dto: CreateCourseDto, user: AuthUser): Promise<Curso> {
    const curso = this.coursesRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      isPublished: dto.isPublished ?? false,
      createdById: user.userId,
    });
    return this.coursesRepository.save(curso);
  }

  async update(id: string, dto: UpdateCourseDto, user: AuthUser): Promise<Curso> {
    const curso = await this.findById(id);
    if (!curso) throw new NotFoundException('Curso no encontrado');
    this.assertCanModify(curso, user);

    if (dto.title !== undefined) curso.title = dto.title;
    if (dto.description !== undefined) curso.description = dto.description;
    if (dto.isPublished !== undefined) curso.isPublished = dto.isPublished;

    return this.coursesRepository.save(curso);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const curso = await this.findById(id);
    if (!curso) throw new NotFoundException('Curso no encontrado');
    this.assertCanModify(curso, user);

    const videoCount = await this.coursesRepository.manager.count(
      'contents',
      { where: { cursoId: id } },
    );
    if (videoCount > 0) {
      throw new ConflictException(
        'El curso tiene videos. Elimínelos antes de eliminar el curso.',
      );
    }

    await this.coursesRepository.remove(curso);

    await this.auditService
      .record({
        action: 'course.delete',
        userId: user.userId,
        username: user.username,
        details: `Curso "${curso.title}" eliminado`,
      })
      .catch(() => undefined);
  }

  private assertCanModify(curso: Curso, user: AuthUser): void {
    if (curso.createdById !== user.userId && user.role !== Role.Admin) {
      throw new ForbiddenException(
        'Solo el autor o un administrador puede modificar este curso',
      );
    }
  }
}
