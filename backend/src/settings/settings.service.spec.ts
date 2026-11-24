import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SettingsService } from './settings.service.js';
import {
  DEFAULT_DOCUMENT_TABLE_COLUMNS,
  DOCUMENT_TABLE_COLUMNS,
} from './document-table-columns.js';
import { DocumentTableConfig } from './document-table-config.entity.js';

function createService(config?: Partial<DocumentTableConfig>) {
  const repository = {
    findOne: vi.fn(async () => (config ?? null) as DocumentTableConfig | null),
    save: vi.fn(async (value: DocumentTableConfig) => value),
  };
  const service = new SettingsService(repository as never);
  return { service, repository };
}

describe('SettingsService (tabla de documentos)', () => {
  it('devuelve todas las columnas cuando no hay configuración guardada', async () => {
    const { service } = createService();
    await expect(service.getDocumentTableColumns()).resolves.toEqual(
      DEFAULT_DOCUMENT_TABLE_COLUMNS,
    );
  });

  it('filtra columnas desconocidas guardadas', async () => {
    const { service } = createService({
      id: 1,
      columns: ['title', 'inventada', 'code'],
    } as DocumentTableConfig);

    await expect(service.getDocumentTableColumns()).resolves.toEqual([
      'title',
      'code',
    ]);
  });

  it('vuelve a las columnas por defecto si la configuración quedó vacía', async () => {
    const { service } = createService({
      id: 1,
      columns: ['otra'],
    } as DocumentTableConfig);

    await expect(service.getDocumentTableColumns()).resolves.toEqual(
      DEFAULT_DOCUMENT_TABLE_COLUMNS,
    );
  });

  it('guarda la selección sin duplicados', async () => {
    const { service, repository } = createService();

    await expect(
      service.updateDocumentTableColumns(['title', 'code', 'title']),
    ).resolves.toEqual(['title', 'code']);
    expect(repository.save).toHaveBeenCalledWith({
      id: 1,
      columns: ['title', 'code'],
    });
  });

  it('rechaza una lista vacía', async () => {
    const { service } = createService();
    await expect(service.updateDocumentTableColumns([])).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza columnas desconocidas', async () => {
    const { service, repository } = createService();
    await expect(
      service.updateDocumentTableColumns(['title', 'otra']),
    ).rejects.toThrow('Columnas inválidas: otra');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('mantiene las columnas permitidas sincronizadas con el contrato', () => {
    expect([...DOCUMENT_TABLE_COLUMNS]).toEqual([
      'title',
      'code',
      'type',
      'version',
      'area',
      'category',
      'date',
    ]);
  });
});
