import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CoursesService, toCourseDto } from './courses.service.js';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/role.enum.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { ContentsService, toContentDto } from '../contents/contents.service.js';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly contentsService: ContentsService,
  ) {}

  @Get()
  async findAll(
    @Query('q') q: string | undefined,
    @Req() req: { user: AuthUser },
  ) {
    return this.coursesService.findAll({ q }, req.user.role);
  }

  @Post()
  @Roles(Role.Admin, Role.Editor)
  async create(@Body() dto: CreateCourseDto, @Req() req: { user: AuthUser }) {
    const curso = await this.coursesService.create(dto, req.user);
    return toCourseDto(curso);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    const curso = await this.coursesService.findById(id);
    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }
    if (
      (req.user.role === Role.Lector || req.user.role === Role.Comunicador) &&
      !curso.isPublished
    ) {
      throw new NotFoundException('Curso no encontrado');
    }
    const videos = await this.contentsService.findByCourse(id, req.user.role);
    return { ...toCourseDto(curso), videos: videos.map(toContentDto) };
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Editor)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @Req() req: { user: AuthUser },
  ) {
    const curso = await this.coursesService.update(id, dto, req.user);
    return toCourseDto(curso);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Editor)
  async remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    await this.coursesService.remove(id, req.user);
    return { ok: true };
  }
}
