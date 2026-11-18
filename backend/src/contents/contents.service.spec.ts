import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentsService } from './contents.service.js';
import { Content } from './content.entity.js';
import { ContentType } from '../common/content-type.enum.js';
import { Role } from '../common/role.enum.js';
import { AuthUser } from '../common/guards/roles.guard.js';
import { CategoriesService } from '../categories/categories.service.js';
import { AuditService } from '../audit/audit.service.js';

const PDF_SIGNATURE = Buffer.from('%PDF-1.4\n');

const admin: AuthUser = {
  userId: 'admin-1',
  username: 'admin',
  role: Role.Admin,
};

function baseContent(overrides: Partial<Content> = {}): Content {
  return {
    id: 'content-1',
    title: 'Protocolo',
    description: null,
    code: null,
    version: null,
    elaborationDate: null,
    updateDate: null,
    type: ContentType.Document,
    filePath: 'old-file.pdf',
    embedUrl: null,
    originalName: 'protocolo.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
    isPublished: true,
    categoryId: null,
    category: null,
    areaId: null,
    area: null,
    cursoId: null,
    curso: null,
    position: 0,
    uploadedById: 'user-1',
    uploadedBy: undefined as never,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Content;
}

describe('ContentsService.update (reemplazo de archivo)', () => {
  let uploadDir: string;
  let contentsRepository: {
    findOne: ReturnType<typeof vi.fn>;
    findOneOrFail: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let service: ContentsService;

  beforeEach(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), 'intranet-contents-'));
    contentsRepository = {
      findOne: vi.fn(),
      findOneOrFail: vi.fn(),
      save: vi.fn(async (value: Content) => value),
      remove: vi.fn(),
    };
    const config = {
      get: (key: string) => {
        if (key === 'UPLOAD_DIR') return uploadDir;
        if (key === 'MAX_FILE_SIZE_MB') return '1';
        return undefined;
      },
    } as unknown as ConfigService;
    service = new ContentsService(
      contentsRepository as never,
      config,
      {} as CategoriesService,
      {} as never,
      { findOne: vi.fn() } as never,
      {} as AuditService,
    );
  });

  afterEach(async () => {
    await rm(uploadDir, { recursive: true, force: true });
  });

  async function uploadedFile(name: string, content: Buffer) {
    const path = join(uploadDir, `upload-${name}`);
    await writeFile(path, content);
    return {
      path,
      filename: name,
      originalname: `nuevo-${name}`,
      mimetype: 'application/pdf',
      size: content.length,
    } as Express.Multer.File;
  }

  it('reemplaza el archivo y elimina el anterior', async () => {
    const stored = baseContent();
    contentsRepository.findOne.mockResolvedValue({ ...stored });
    contentsRepository.findOneOrFail.mockResolvedValue({ ...stored });
    await writeFile(join(uploadDir, 'old-file.pdf'), PDF_SIGNATURE);

    const file = await uploadedFile('new.pdf', PDF_SIGNATURE);
    await service.update('content-1', { title: 'Actualizado' }, admin, file);

    const saved = contentsRepository.save.mock.calls[0][0] as Content;
    expect(saved.filePath).toBe('new.pdf');
    expect(saved.originalName).toBe('nuevo-new.pdf');
    expect(saved.mimeType).toBe('application/pdf');
    expect(saved.sizeBytes).toBe(PDF_SIGNATURE.length);
    expect(saved.title).toBe('Actualizado');
    await expect(stat(file.path)).resolves.toBeTruthy();
    await expect(stat(join(uploadDir, 'old-file.pdf'))).rejects.toThrow();
  });

  it('mantiene el archivo actual cuando no se envía uno nuevo', async () => {
    const stored = baseContent();
    contentsRepository.findOne.mockResolvedValue({ ...stored });
    contentsRepository.findOneOrFail.mockResolvedValue({ ...stored });
    await writeFile(join(uploadDir, 'old-file.pdf'), PDF_SIGNATURE);

    await service.update('content-1', { version: '2.0' }, admin);

    const saved = contentsRepository.save.mock.calls[0][0] as Content;
    expect(saved.filePath).toBe('old-file.pdf');
    expect(saved.version).toBe('2.0');
    const unchanged = await readFile(join(uploadDir, 'old-file.pdf'));
    expect(unchanged.equals(PDF_SIGNATURE)).toBe(true);
  });

  it('rechaza el reemplazo de un usuario que no es autor ni admin', async () => {
    contentsRepository.findOne.mockResolvedValue(baseContent());
    const file = await uploadedFile('new.pdf', PDF_SIGNATURE);
    const otherUser: AuthUser = {
      userId: 'user-2',
      username: 'otro',
      role: Role.Editor,
    };

    await expect(
      service.update('content-1', { title: 'x' }, otherUser, file),
    ).rejects.toThrow(ForbiddenException);
    await expect(stat(file.path)).rejects.toThrow();
    expect(contentsRepository.save).not.toHaveBeenCalled();
  });

  it('rechaza un archivo con tipo no permitido y conserva el anterior', async () => {
    contentsRepository.findOne.mockResolvedValue(baseContent());
    await writeFile(join(uploadDir, 'old-file.pdf'), PDF_SIGNATURE);
    const file = await uploadedFile('new.pdf', PDF_SIGNATURE);

    await expect(
      service.update(
        'content-1',
        {},
        admin,
        { ...file, mimetype: 'application/zip' } as Express.Multer.File,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(stat(file.path)).rejects.toThrow();
    await expect(stat(join(uploadDir, 'old-file.pdf'))).resolves.toBeTruthy();
    expect(contentsRepository.save).not.toHaveBeenCalled();
  });

  it('al reemplazar un video por un archivo limpia la URL embebida', async () => {
    const mp4 = Buffer.from('\x00\x00\x00\x18ftypmp42');
    const stored = baseContent({
      type: ContentType.Video,
      filePath: 'old.mp4',
      originalName: 'viejo.mp4',
      mimeType: 'video/mp4',
      embedUrl: 'https://example.com/video',
      cursoId: 'curso-1',
    });
    contentsRepository.findOne.mockResolvedValue({ ...stored });
    contentsRepository.findOneOrFail.mockResolvedValue({ ...stored });
    await writeFile(join(uploadDir, 'old.mp4'), mp4);
    const path = join(uploadDir, 'upload-new.mp4');
    await writeFile(path, mp4);

    await service.update('content-1', {}, admin, {
      path,
      filename: 'new.mp4',
      originalname: 'nuevo.mp4',
      mimetype: 'video/mp4',
      size: mp4.length,
    } as Express.Multer.File);

    const saved = contentsRepository.save.mock.calls[0][0] as Content;
    expect(saved.embedUrl).toBeNull();
    expect(saved.filePath).toBe('new.mp4');
    expect(saved.cursoId).toBe('curso-1');
  });

  it('rechaza un archivo cuyo contenido no coincide con el tipo declarado', async () => {
    contentsRepository.findOne.mockResolvedValue(baseContent());
    await writeFile(join(uploadDir, 'old-file.pdf'), PDF_SIGNATURE);
    const file = await uploadedFile('fake.pdf', Buffer.from('no es un pdf'));

    await expect(
      service.update('content-1', {}, admin, file),
    ).rejects.toThrow(BadRequestException);
    await expect(stat(file.path)).rejects.toThrow();
    await expect(stat(join(uploadDir, 'old-file.pdf'))).resolves.toBeTruthy();
  });
});
