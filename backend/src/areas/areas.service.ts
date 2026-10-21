import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './area.entity.js';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private readonly areasRepository: Repository<Area>,
  ) {}

  findAll(includeInactive = false): Promise<Area[]> {
    return this.areasRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<Area | null> {
    return this.areasRepository.findOne({ where: { id } });
  }

  async create(name: string): Promise<Area> {
    const slug = slugify(name);
    const existing = await this.areasRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Ya existe un área con ese nombre');
    }
    const area = this.areasRepository.create({ name, slug, isActive: true });
    return this.areasRepository.save(area);
  }

  async update(
    id: string,
    dto: { name?: string; isActive?: boolean },
  ): Promise<Area> {
    const area = await this.findById(id);
    if (!area) {
      throw new NotFoundException('Área no encontrada');
    }
    if (dto.name !== undefined) {
      const slug = slugify(dto.name);
      const duplicate = await this.areasRepository.findOne({ where: { slug } });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Ya existe un área con ese nombre');
      }
      area.name = dto.name;
      area.slug = slug;
    }
    if (dto.isActive !== undefined) area.isActive = dto.isActive;
    return this.areasRepository.save(area);
  }
}
