import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { Message } from './message.entity.js';
import { User } from '../users/user.entity.js';
import { ChatService } from './chat.service.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatController } from './chat.controller.js';
import { resolveUploadDir, safeExt } from '../common/storage.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User]),
    JwtModule.register({}),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDir = resolveUploadDir(config.get<string>('UPLOAD_DIR'));
        const chatDir = join(uploadDir, 'chat');
        return {
          storage: diskStorage({
            destination: (_req, _file, cb) => {
              mkdirSync(chatDir, { recursive: true });
              cb(null, chatDir);
            },
            filename: (_req, file, cb) => {
              cb(null, `${randomUUID()}${safeExt(file.originalname)}`);
            },
          }),
          limits: { fileSize: 20 * 1024 * 1024 },
        };
      },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
