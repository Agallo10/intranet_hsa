import { createReadStream, statSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import type { Response } from 'express';
import { NewsService, toMediaDto, toNewsDto } from './news.service.js';
import { MediaMeta, UpdateNewsDto } from './dto/news.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { Role } from '../common/role.enum.js';
import { extractToken, verifyAccessToken } from '../common/jwt.helper.js';

const buildMedia = (files: Express.Multer.File[]): MediaMeta[] =>
  files.map((f) => ({
    type: f.mimetype.startsWith('video/') ? 'video' : 'audio',
    path: `news-media/${f.filename}`,
    name: f.originalname,
    mime: f.mimetype,
    size: f.size,
  }));

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async findAll(
    @Query() query: { q?: string; category?: string; page?: string; limit?: string },
    @Req() req: { user: AuthUser },
  ) {
    return this.newsService.findAll(
      {
        q: query.q,
        category: query.category,
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      },
      req.user.role,
    );
  }

  @Post()
  @Roles(Role.Admin, Role.Comunicador)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cover', maxCount: 1 },
      { name: 'media', maxCount: 10 },
    ]),
  )
  async create(
    @UploadedFiles()
    files: { cover?: Express.Multer.File[]; media?: Express.Multer.File[] },
    @Body()
    body: {
      title?: string;
      summary?: string;
      body?: string;
      categoryId?: string;
      isPublished?: string;
    },
    @Req() req: { user: AuthUser },
  ) {
    const cover = files?.cover?.[0];
    const mediaFiles = files?.media ?? [];
    try {
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
          categoryId: body.categoryId || null,
          isPublished: body.isPublished === 'true',
        },
        req.user,
        cover,
        buildMedia(mediaFiles),
      );

      return toNewsDto(noticia);
    } catch (err) {
      if (cover) {
        await unlink(cover.path).catch(() => undefined);
      }
      for (const f of mediaFiles) {
        await unlink(f.path).catch(() => undefined);
      }
      throw err;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    const noticia = await this.newsService.findOne(id, req.user.role);
    const media = await this.newsService.listMedia(id);
    return { ...toNewsDto(noticia), media: media.map(toMediaDto) };
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

  @Get(':id/media')
  async listMedia(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    await this.newsService.findOne(id, req.user.role);
    const media = await this.newsService.listMedia(id);
    return media.map(toMediaDto);
  }

  @Post(':id/media')
  @Roles(Role.Admin, Role.Comunicador)
  @UseInterceptors(FilesInterceptor('media', 10))
  async addMedia(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: { user: AuthUser },
  ) {
    const mediaFiles = files ?? [];
    try {
      const media = await this.newsService.addMedia(
        id,
        buildMedia(mediaFiles),
        req.user,
      );
      return media.map(toMediaDto);
    } catch (err) {
      for (const f of mediaFiles) {
        await unlink(f.path).catch(() => undefined);
      }
      throw err;
    }
  }

  @Delete(':id/media/:mediaId')
  @Roles(Role.Admin, Role.Comunicador)
  async removeMedia(
    @Param('mediaId') mediaId: string,
    @Req() req: { user: AuthUser },
  ) {
    await this.newsService.removeMedia(mediaId, req.user);
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

  @Public()
  @Get(':id/media/:mediaId/file')
  async getMediaFile(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @Query('token') queryToken: string | undefined,
    @Req() req: { headers: { authorization?: string; range?: string } },
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

    await this.newsService.findOne(id, user.role);
    const media = await this.newsService.findMedia(mediaId);
    if (!media || media.noticiaId !== id) {
      res.status(404).json({ message: 'Medio no encontrado' });
      return;
    }

    const filePath = this.newsService.getMediaPath(media);
    let stats;
    try {
      stats = statSync(filePath);
    } catch {
      res.status(404).json({ message: 'Archivo no encontrado' });
      return;
    }

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');

    const range = req.headers.range;
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (!match) {
        res.status(416).setHeader('Content-Range', `bytes */${stats.size}`);
        res.end();
        return;
      }
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : stats.size - 1;
      if (start >= stats.size || end >= stats.size || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${stats.size}`);
        res.end();
        return;
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
      res.setHeader('Content-Length', end - start + 1);
      createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.setHeader('Content-Length', stats.size);
      createReadStream(filePath).pipe(res);
    }
  }
}
