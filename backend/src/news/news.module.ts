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
import { NoticiaMedia } from './noticia-media.entity.js';
import { NewsCategory } from './news-category.entity.js';
import { NewsService } from './news.service.js';
import { NewsController } from './news.controller.js';
import { NewsCategoriesService } from './news-categories.service.js';
import { NewsCategoriesController } from './news-categories.controller.js';
import { AuditModule } from '../audit/audit.module.js';
import { resolveUploadDir, safeExt } from '../common/storage.js';

const ALLOWED_IMAGES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Module({
  imports: [
    TypeOrmModule.forFeature([Noticia, NoticiaMedia, NewsCategory]),
    JwtModule.register({}),
    AuditModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDir = resolveUploadDir(config.get<string>('UPLOAD_DIR'));
        const newsDir = join(uploadDir, 'news');
        const mediaDir = join(uploadDir, 'news-media');
        return {
          storage: diskStorage({
            destination: (_req, file, cb) => {
              const dir = file.fieldname === 'media' ? mediaDir : newsDir;
              mkdirSync(dir, { recursive: true });
              cb(null, dir);
            },
            filename: (_req, file, cb) => {
              cb(null, `${randomUUID()}${safeExt(file.originalname)}`);
            },
          }),
          limits: { fileSize: 500 * 1024 * 1024 },
          fileFilter: (_req, file, cb) => {
            if (file.fieldname === 'cover') {
              if (ALLOWED_IMAGES.has(file.mimetype)) cb(null, true);
              else cb(new Error('Solo imágenes JPG, PNG o WEBP para la portada'), false);
            } else if (
              file.mimetype.startsWith('video/') ||
              file.mimetype.startsWith('audio/')
            ) {
              cb(null, true);
            } else {
              cb(new Error('Solo se permiten videos o audios'), false);
            }
          },
        };
      },
    }),
  ],
  controllers: [NewsController, NewsCategoriesController],
  providers: [NewsService, NewsCategoriesService],
  exports: [NewsService],
})
export class NewsModule {}
