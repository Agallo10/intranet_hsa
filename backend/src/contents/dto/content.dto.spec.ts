import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateContentDto } from './content.dto.js';

describe('UpdateContentDto', () => {
  it('mantiene sin definir los campos no enviados', () => {
    const dto = plainToInstance(UpdateContentDto, { title: 'Nuevo' });
    expect(dto.isPublished).toBeUndefined();
    expect(dto.position).toBeUndefined();
  });

  it('normaliza los campos enviados como texto en peticiones multipart', () => {
    const dto = plainToInstance(UpdateContentDto, {
      isPublished: 'false',
      position: '3',
    });
    expect(dto.isPublished).toBe(false);
    expect(dto.position).toBe(3);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('acepta un booleano nativo', () => {
    const dto = plainToInstance(UpdateContentDto, { isPublished: true });
    expect(dto.isPublished).toBe(true);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rechaza un valor no numérico en position', () => {
    const dto = plainToInstance(UpdateContentDto, { position: 'abc' });
    expect(validateSync(dto)).not.toHaveLength(0);
  });
});
