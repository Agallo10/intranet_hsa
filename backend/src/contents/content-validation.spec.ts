import { BadRequestException } from '@nestjs/common';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validateContentFile,
  validateFileSignature,
} from './content-validation.js';
import { ContentType } from '../common/content-type.enum.js';

describe('validateContentFile', () => {
  it('acepta un video mp4 válido dentro del límite', () => {
    expect(() =>
      validateContentFile('video/mp4', ContentType.Video, 1024, 1024 * 1024),
    ).not.toThrow();
  });

  it('acepta un documento pdf válido', () => {
    expect(() =>
      validateContentFile(
        'application/pdf',
        ContentType.Document,
        1024,
        1024 * 1024,
      ),
    ).not.toThrow();
  });

  it('rechaza un tipo de archivo no permitido', () => {
    expect(() =>
      validateContentFile(
        'application/zip',
        ContentType.Document,
        1024,
        1024 * 1024,
      ),
    ).toThrow(BadRequestException);
  });

  it('rechaza un video cuando el tipo esperado es documento', () => {
    expect(() =>
      validateContentFile(
        'video/mp4',
        ContentType.Document,
        1024,
        1024 * 1024,
      ),
    ).toThrow(BadRequestException);
  });

  it('rechaza archivos que exceden el tamaño máximo', () => {
    expect(() =>
      validateContentFile('video/mp4', ContentType.Video, 2048, 1024),
    ).toThrow(BadRequestException);
  });
});

describe('validateFileSignature', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'content-validation-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const write = async (name: string, bytes: number[]) => {
    const path = join(dir, name);
    await writeFile(path, Buffer.from(bytes));
    return path;
  };

  it('acepta un PDF con firma %PDF', async () => {
    const path = await write('doc.pdf', [0x25, 0x50, 0x44, 0x46, 0x2d]);
    await expect(
      validateFileSignature(path, 'application/pdf'),
    ).resolves.toBeUndefined();
  });

  it('acepta un ZIP (docx/xlsx) con firma PK', async () => {
    const path = await write('doc.docx', [0x50, 0x4b, 0x03, 0x04]);
    await expect(
      validateFileSignature(
        path,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).resolves.toBeUndefined();
  });

  it('rechaza un PDF cuyo contenido no coincide', async () => {
    const path = await write('fake.pdf', [0x4d, 0x5a, 0x90, 0x00, 0x03]);
    await expect(
      validateFileSignature(path, 'application/pdf'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza un mimetype sin regla de firma', async () => {
    const path = await write('doc.pdf', [0x25, 0x50, 0x44, 0x46]);
    await expect(
      validateFileSignature(path, 'application/octet-stream'),
    ).rejects.toThrow(BadRequestException);
  });
});
