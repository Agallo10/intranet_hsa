import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentsService } from './contents.service.js';
import { extractPdfText } from './pdf-text.js';
import { CategoriesService } from '../categories/categories.service.js';
import { AuditService } from '../audit/audit.service.js';

vi.mock('./pdf-text.js', () => ({
  extractPdfText: vi.fn(),
}));

const mockedExtractPdfText = vi.mocked(extractPdfText);

describe('ContentsService.extractHeaderMetadata', () => {
  let uploadDir: string;
  let service: ContentsService;

  beforeEach(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), 'intranet-extract-'));
    const config = {
      get: (key: string) => {
        if (key === 'UPLOAD_DIR') return uploadDir;
        if (key === 'MAX_FILE_SIZE_MB') return '1';
        return undefined;
      },
    } as unknown as ConfigService;
    service = new ContentsService(
      {} as never,
      config,
      {} as CategoriesService,
      {} as never,
      {} as never,
      {} as AuditService,
    );
    mockedExtractPdfText.mockReset();
  });

  afterEach(async () => {
    await rm(uploadDir, { recursive: true, force: true });
  });

  async function uploadedFile(name: string, mime: string, body: Buffer) {
    const path = join(uploadDir, name);
    await writeFile(path, body);
    return {
      path,
      filename: name,
      originalname: name,
      mimetype: mime,
      size: body.length,
    } as Express.Multer.File;
  }

  it('precarga los metadatos leyendo el encabezado del PDF y borra el temporal', async () => {
    mockedExtractPdfText.mockResolvedValue({
      totalPages: 37,
      pages: [
        'PLAN DE CONTINGENCIA\nCÓDIGO:\nPLASG-SST-06\nVERSIÓN:\n03\nFECHA DE ELABORACIÓN:\n26 de enero de 2018\nFECHA ACTUALIZACIÓN:\n24 de julio de 2025\nPÁGINA: 1 DE: 37',
      ],
    });
    const file = await uploadedFile(
      'plan.pdf',
      'application/pdf',
      Buffer.from('%PDF-1.4\n'),
    );

    const result = await service.extractHeaderMetadata(file);

    expect(result).toMatchObject({
      supported: true,
      title: 'PLAN DE CONTINGENCIA',
      code: 'PLASG-SST-06',
      version: '3.0',
      elaborationDate: '2018-01-26',
      updateDate: '2025-07-24',
      pageCount: 37,
      message: null,
    });
    await expect(stat(file.path)).rejects.toThrow();
  });

  it('avisa cuando el PDF no tiene texto seleccionable', async () => {
    mockedExtractPdfText.mockResolvedValue({ totalPages: 3, pages: ['', ''] });
    const file = await uploadedFile(
      'escaneado.pdf',
      'application/pdf',
      Buffer.from('%PDF-1.4\n'),
    );

    const result = await service.extractHeaderMetadata(file);

    expect(result.supported).toBe(true);
    expect(result.code).toBeNull();
    expect(result.message).toContain('escaneado');
    await expect(stat(file.path)).rejects.toThrow();
  });

  it('no intenta leer formatos que no son PDF y elimina el temporal', async () => {
    const file = await uploadedFile(
      'plan.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      Buffer.from('PK\x03\x04'),
    );

    const result = await service.extractHeaderMetadata(file);

    expect(result.supported).toBe(false);
    expect(result.message).toContain('solo está disponible para archivos PDF');
    expect(mockedExtractPdfText).not.toHaveBeenCalled();
    await expect(stat(file.path)).rejects.toThrow();
  });

  it('rechaza tipos de archivo no permitidos y elimina el temporal', async () => {
    const file = await uploadedFile(
      'archivo.zip',
      'application/zip',
      Buffer.from('PK\x03\x04'),
    );

    await expect(service.extractHeaderMetadata(file)).rejects.toThrow(
      BadRequestException,
    );
    await expect(stat(file.path)).rejects.toThrow();
  });

  it('informa un error legible si el PDF está dañado', async () => {
    mockedExtractPdfText.mockRejectedValue(new Error('InvalidPDFException'));
    const file = await uploadedFile(
      'roto.pdf',
      'application/pdf',
      Buffer.from('%PDF-1.4\n'),
    );

    await expect(service.extractHeaderMetadata(file)).rejects.toThrow(
      'No se pudo leer el archivo PDF',
    );
    await expect(stat(file.path)).rejects.toThrow();
  });
});
