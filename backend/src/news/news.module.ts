import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { Noticia } from './noticia.entity.js';
import { NewsService } from './news.service.js';
import { NewsController } from './news.controller.js';
import { resolveUploadDir, safeExt } from '../common/storage.js';

const ALLOWED_IMAGES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Module({
  imports: [
    TypeOrmModule.forFeature([Noticia]),
    JwtModule.register({}),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDir = resolveUploadDir(config.get<string>('UPLOAD_DIR'));
        const newsDir = join(uploadDir, 'news');
        return {
          storage: diskStorage({
            destination: (_req, _file, cb) => {
              mkdirSync(newsDir, { recursive: true });
              cb(null, newsDir);
            },
            filename: (_req, file, cb) => {
              cb(null, `${randomUUID()}${safeExt(file.originalname)}`);
            },
          }),
          limits: { fileSize: 10 * 1024 * 1024 },
          fileFilter: (_req, file, cb) => {
            if (ALLOWED_IMAGES.has(file.mimetype)) {
              cb(null, true);
            } else {
              cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'), false);
            }
          },
        };
      },
    }),
  ],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
