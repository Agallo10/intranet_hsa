import { mkdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

export function resolveUploadDir(configured?: string): string {
  const dir = resolve(process.cwd(), configured ?? 'uploads');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function resolveUploadPath(uploadDir: string, filePath: string): string {
  const full = resolve(uploadDir, filePath);
  if (!full.startsWith(resolve(uploadDir))) {
    throw new Error('Ruta de archivo inválida');
  }
  return full;
}

export function ensureParentDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

export function safeExt(originalName: string): string {
  const ext = extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return ext.length > 0 && ext.length <= 10 ? ext : '';
}
