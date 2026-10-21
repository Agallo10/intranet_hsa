import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AreasService } from './areas.service.js';
import { CreateAreaDto, UpdateAreaDto } from './dto/area.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/role.enum.js';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.areasService.findAll(includeInactive === 'true');
  }

  @Post()
  @Roles(Role.Admin)
  async create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto.name);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.areasService.update(id, dto);
  }
}
