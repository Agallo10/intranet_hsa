import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Content } from './content.entity.js';
import { Curso } from '../courses/curso.entity.js';
import { ContentsService } from './contents.service.js';
import { ContentsController } from './contents.controller.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ensureParentDir, resolveUploadDir } from '../common/storage.js';

const safeExt = (originalName: string): string => {
  const ext = extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return ext.length > 0 && ext.length <= 10 ? ext : '';
};

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, Curso]),
    JwtModule.register({}),
    CategoriesModule,
    AuditModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDir = resolveUploadDir(config.get<string>('UPLOAD_DIR'));
        const maxSizeMb = Number(config.get('MAX_FILE_SIZE_MB') ?? 2048);
        return {
          storage: diskStorage({
            destination: (_req, _file, cb) => {
              ensureParentDir(uploadDir);
              cb(null, uploadDir);
            },
            filename: (_req, file, cb) => {
              cb(null, `${randomUUID()}${safeExt(file.originalname)}`);
            },
          }),
          limits: { fileSize: maxSizeMb * 1024 * 1024 },
        };
      },
    }),
  ],
  controllers: [ContentsController],
  providers: [ContentsService],
  exports: [ContentsService],
})
export class ContentsModule {}
