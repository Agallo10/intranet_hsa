import { createReadStream, statSync } from 'node:fs';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { NewsService, toNewsDto } from './news.service.js';
import { UpdateNewsDto } from './dto/news.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { Role } from '../common/role.enum.js';
import { extractToken, verifyAccessToken } from '../common/jwt.helper.js';

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async findAll(
    @Query() query: { q?: string; page?: string; limit?: string },
    @Req() req: { user: AuthUser },
  ) {
    return this.newsService.findAll(
      {
        q: query.q,
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      },
      req.user.role,
    );
  }

  @Post()
  @Roles(Role.Admin, Role.Comunicador)
  @UseInterceptors(FileInterceptor('cover'))
  async create(
    @UploadedFile() cover: Express.Multer.File | undefined,
    @Body()
    body: {
      title?: string;
      summary?: string;
      body?: string;
      isPublished?: string;
    },
    @Req() req: { user: AuthUser },
  ) {
    if (!body.title) {
      throw new BadRequestException('El título es obligatorio');
    }
    if (!body.body) {
      throw new BadRequestException('El contenido es obligatorio');
    }

    const noticia = await this.newsService.create(
      {
        title: body.title,
        summary: body.summary,
        body: body.body,
        isPublished: body.isPublished === 'true',
      },
      req.user,
      cover,
    );

    return toNewsDto(noticia);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    const noticia = await this.newsService.findOne(id, req.user.role);
    return toNewsDto(noticia);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Comunicador)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
    @Req() req: { user: AuthUser },
  ) {
    const noticia = await this.newsService.update(id, dto, req.user);
    return toNewsDto(noticia);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Comunicador)
  async remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    await this.newsService.remove(id, req.user);
    return { ok: true };
  }

  @Public()
  @Get(':id/cover')
  async getCover(
    @Param('id') id: string,
    @Query('token') queryToken: string | undefined,
    @Req() req: { headers: { authorization?: string } },
    @Res() res: Response,
  ) {
    const token = extractToken(queryToken, req.headers.authorization);
    if (!token) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    const user = await verifyAccessToken(this.jwtService, this.config, token);
    if (!user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const noticia = await this.newsService.findOne(id, user.role);
    const coverPath = this.newsService.getCoverPath(noticia);
    if (!coverPath) {
      res.status(404).json({ message: 'Sin imagen de portada' });
      return;
    }

    let stats;
    try {
      stats = statSync(coverPath);
    } catch {
      res.status(404).json({ message: 'Archivo no encontrado' });
      return;
    }

    const mime =
      noticia.coverImagePath?.endsWith('.png') ? 'image/png'
      : noticia.coverImagePath?.endsWith('.webp') ? 'image/webp'
      : 'image/jpeg';

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', stats.size);
    createReadStream(coverPath).pipe(res);
  }
}
