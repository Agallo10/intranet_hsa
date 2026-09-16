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
import { ContentsService, toContentDto } from './contents.service.js';
import { UpdateContentDto } from './dto/content.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { Role } from '../common/role.enum.js';
import { ContentType } from '../common/content-type.enum.js';

@Controller('contents')
export class ContentsController {
  constructor(
    private readonly contentsService: ContentsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async findAll(
    @Query()
    query: {
      q?: string;
      category?: string;
      type?: string;
      from?: string;
      to?: string;
      page?: string;
      limit?: string;
      scope?: string;
    },
    @Req() req: { user: AuthUser },
  ) {
    if (query.type && !Object.values(ContentType).includes(query.type as ContentType)) {
      throw new BadRequestException('Tipo de contenido inválido');
    }
    return this.contentsService.findAll(
      {
        q: query.q,
        category: query.category,
        type: query.type,
        from: query.from,
        to: query.to,
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        scope: query.scope === 'mine' ? 'mine' : undefined,
      },
      req.user,
    );
  }

  @Post()
  @Roles(Role.Admin, Role.Editor)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      title?: string;
      description?: string;
      type?: string;
      categoryId?: string;
      cursoId?: string;
      position?: string;
      isPublished?: string;
    },
    @Req() req: { user: AuthUser },
  ) {
    if (!file) {
      throw new BadRequestException('Debe adjuntar un archivo');
    }
    if (!body.title) {
      throw new BadRequestException('El título es obligatorio');
    }
    if (!body.type || !Object.values(ContentType).includes(body.type as ContentType)) {
      throw new BadRequestException('Tipo de contenido inválido');
    }

    const content = await this.contentsService.create(
      {
        title: body.title,
        description: body.description,
        type: body.type as ContentType,
        categoryId: body.categoryId || null,
        cursoId: body.cursoId || null,
        position: body.position ? Number(body.position) : undefined,
        isPublished: body.isPublished === 'true',
      },
      file,
      req.user,
    );

    return toContentDto(content);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    const content = await this.contentsService.findOne(id, req.user.role);
    return toContentDto(content);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Editor)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
    @Req() req: { user: AuthUser },
  ) {
    const content = await this.contentsService.update(id, dto, req.user);
    return toContentDto(content);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Editor)
  async remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    await this.contentsService.remove(id, req.user);
    return { ok: true };
  }

  @Public()
  @Get(':id/file')
  async getFile(
    @Param('id') id: string,
    @Query('token') queryToken: string | undefined,
    @Req()
    req: {
      headers: {
        range?: string;
        authorization?: string;
      };
    },
    @Res() res: Response,
  ) {
    const user = await this.resolveFileUser(queryToken, req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const content = await this.contentsService.findOne(id, user.role);
    const filePath = this.contentsService.getFilePath(content);

    let stats;
    try {
      stats = statSync(filePath);
    } catch {
      res.status(404).json({ message: 'Archivo no encontrado' });
      return;
    }

    const range = req.headers.range;
    const isVideo = content.type === ContentType.Video;

    res.setHeader('Content-Type', content.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');

    if (!isVideo) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(content.originalName)}`,
      );
    }

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

  private async resolveFileUser(
    queryToken: string | undefined,
    authorization: string | undefined,
  ): Promise<AuthUser | null> {
    let token = queryToken;
    if (!token && authorization?.startsWith('Bearer ')) {
      token = authorization.slice(7);
    }
    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        username: string;
        role: Role;
        type: string;
      }>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.type !== 'access') {
        return null;
      }
      return {
        userId: payload.sub,
        username: payload.username,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }
}
