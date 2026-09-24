import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsCategory } from './news-category.entity.js';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

@Injectable()
export class NewsCategoriesService {
  constructor(
    @InjectRepository(NewsCategory)
    private readonly repository: Repository<NewsCategory>,
  ) {}

  findAll(includeInactive = false): Promise<NewsCategory[]> {
    return this.repository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<NewsCategory | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(name: string): Promise<NewsCategory> {
    const slug = slugify(name);
    const existing = await this.repository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
    const category = this.repository.create({ name, slug, isActive: true });
    return this.repository.save(category);
  }

  async update(
    id: string,
    dto: { name?: string; isActive?: boolean },
  ): Promise<NewsCategory> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    if (dto.name !== undefined) {
      category.name = dto.name;
      category.slug = slugify(dto.name);
    }
    if (dto.isActive !== undefined) category.isActive = dto.isActive;
    return this.repository.save(category);
  }
}
