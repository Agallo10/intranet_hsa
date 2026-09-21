import { createReadStream, statSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
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
import { ChatService, toMessageDto } from './chat.service.js';
import { ChatGateway } from './chat.gateway.js';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { extractToken, verifyAccessToken } from '../common/jwt.helper.js';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Get('users')
  async users(
    @Query('q') q: string | undefined,
    @Req() req: { user: AuthUser },
  ) {
    return this.chatService.listUsers(req.user.userId, q);
  }

  @Get('conversations')
  async conversations(@Req() req: { user: AuthUser }) {
    return this.chatService.conversations(req.user.userId);
  }

  @Get('unread')
  async unread(@Req() req: { user: AuthUser }) {
    return { total: await this.chatService.unreadTotal(req.user.userId) };
  }

  @Get('messages/:userId')
  async history(
    @Param('userId') otherId: string,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: { user: AuthUser },
  ) {
    return this.chatService.history(
      req.user.userId,
      otherId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Post('messages')
  @UseInterceptors(FileInterceptor('file'))
  async send(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { receiverId?: string; content?: string },
    @Req() req: { user: AuthUser },
  ) {
    try {
      if (!body.receiverId) {
        throw new BadRequestException('Debe indicar el destinatario');
      }
      if ((!body.content || !body.content.trim()) && !file) {
        throw new BadRequestException('Debe enviar un mensaje o un adjunto');
      }

      const message = await this.chatService.send(
        req.user.userId,
        body.receiverId,
        body.content,
        file
          ? {
              path: `chat/${file.filename}`,
              name: file.originalname,
              mime: file.mimetype,
              size: file.size,
            }
          : undefined,
      );

      const dto = toMessageDto(message);
      this.chatGateway.emitToUser(body.receiverId, 'message', { message: dto });
      this.chatGateway.emitToUser(req.user.userId, 'message', { message: dto });

      const receiverTotal = await this.chatService.unreadTotal(body.receiverId);
      this.chatGateway.emitToUser(body.receiverId, 'unread', {
        total: receiverTotal,
      });

      return dto;
    } catch (err) {
      if (file) {
        await unlink(file.path).catch(() => undefined);
      }
      throw err;
    }
  }

  @Post('messages/:userId/read')
  async markRead(
    @Param('userId') otherId: string,
    @Req() req: { user: AuthUser },
  ) {
    await this.chatService.markRead(req.user.userId, otherId);
    const total = await this.chatService.unreadTotal(req.user.userId);
    this.chatGateway.emitToUser(req.user.userId, 'unread', { total });
    return { ok: true, total };
  }

  @Public()
  @Get('attachment/:id')
  async getAttachment(
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

    const message = await this.chatService.findMessage(id);
    if (!message) {
      res.status(404).json({ message: 'Adjunto no encontrado' });
      return;
    }
    if (
      message.senderId !== user.userId &&
      message.receiverId !== user.userId
    ) {
      res.status(403).json({ message: 'Sin acceso al adjunto' });
      return;
    }

    const fullPath = this.chatService.resolveAttachmentFullPath(message);
    if (!fullPath) {
      res.status(404).json({ message: 'Adjunto no encontrado' });
      return;
    }

    let stats;
    try {
      stats = statSync(fullPath);
    } catch {
      res.status(404).json({ message: 'Archivo no encontrado' });
      return;
    }

    res.setHeader('Content-Type', message.attachmentMime ?? 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(message.attachmentName ?? 'adjunto')}`,
    );
    res.setHeader('Content-Length', stats.size);
    createReadStream(fullPath).pipe(res);
  }
}
