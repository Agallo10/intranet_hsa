import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  findAll(includeInactive = false): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  findById(id: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({ where: { id } });
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = slugify(dto.name);
    const existing = await this.categoriesRepository.findOne({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
    const category = this.categoriesRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      order: dto.order ?? 0,
      isActive: true,
    });
    return this.categoriesRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    if (dto.name !== undefined) {
      const slug = slugify(dto.name);
      const duplicate = await this.categoriesRepository.findOne({
        where: { slug },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      category.name = dto.name;
      category.slug = slug;
    }
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.order !== undefined) category.order = dto.order;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;
    return this.categoriesRepository.save(category);
  }
}
