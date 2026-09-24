import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { NewsCategoriesService } from './news-categories.service.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/role.enum.js';

@Controller('news-categories')
export class NewsCategoriesController {
  constructor(private readonly service: NewsCategoriesService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(Role.Admin)
  async create(@Body('name') name: string) {
    return this.service.create(name);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(
    @Param('id') id: string,
    @Body() dto: { name?: string; isActive?: boolean },
  ) {
    return this.service.update(id, dto);
  }
}
