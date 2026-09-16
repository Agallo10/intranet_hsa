import { BadRequestException } from '@nestjs/common';
import { open } from 'node:fs/promises';
import { ContentType } from '../common/content-type.enum.js';

const ALLOWED_VIDEO = new Set(['video/mp4', 'video/webm']);
const ALLOWED_DOCUMENT = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export function validateContentFile(
  mimeType: string,
  type: ContentType,
  sizeBytes: number,
  maxSizeBytes: number,
): void {
  const allowed = type === ContentType.Video ? ALLOWED_VIDEO : ALLOWED_DOCUMENT;
  if (!allowed.has(mimeType)) {
    throw new BadRequestException(
      `Tipo de archivo no permitido para contenido de tipo "${type}"`,
    );
  }
  if (sizeBytes <= 0) {
    throw new BadRequestException('El archivo está vacío');
  }
  if (sizeBytes > maxSizeBytes) {
    throw new BadRequestException(
      `El archivo excede el tamaño máximo permitido`,
    );
  }
}

const SIGNATURE_LENGTH = 8;

interface SignatureRule {
  mimeTypes: string[];
  matches: (buf: Buffer) => boolean;
}

const SIGNATURE_RULES: SignatureRule[] = [
  {
    mimeTypes: ['video/mp4'],
    matches: (buf) =>
      buf.length >= 8 && buf.toString('ascii', 4, 8) === 'ftyp',
  },
  {
    mimeTypes: ['video/webm'],
    matches: (buf) =>
      buf.length >= 4 &&
      buf[0] === 0x1a &&
      buf[1] === 0x45 &&
      buf[2] === 0xdf &&
      buf[3] === 0xa3,
  },
  {
    mimeTypes: ['application/pdf'],
    matches: (buf) => buf.length >= 4 && buf.toString('ascii', 0, 4) === '%PDF',
  },
  {
    mimeTypes: ['application/msword', 'application/vnd.ms-excel'],
    matches: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0xd0 &&
      buf[1] === 0xcf &&
      buf[2] === 0x11 &&
      buf[3] === 0xe0 &&
      buf[4] === 0xa1 &&
      buf[5] === 0xb1 &&
      buf[6] === 0x1a &&
      buf[7] === 0xe1,
  },
  {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    matches: (buf) => buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b,
  },
];

export async function validateFileSignature(
  filePath: string,
  mimeType: string,
): Promise<void> {
  const rule = SIGNATURE_RULES.find((r) => r.mimeTypes.includes(mimeType));
  if (!rule) {
    throw new BadRequestException('Tipo de archivo no soportado');
  }

  const handle = await open(filePath, 'r');
  try {
    const buf = Buffer.alloc(SIGNATURE_LENGTH);
    const { bytesRead } = await handle.read(buf, 0, SIGNATURE_LENGTH, 0);
    if (!rule.matches(buf.subarray(0, bytesRead))) {
      throw new BadRequestException(
        'El contenido del archivo no coincide con su tipo declarado',
      );
    }
  } finally {
    await handle.close();
  }
}
