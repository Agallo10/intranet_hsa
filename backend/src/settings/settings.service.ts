import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentTableConfig } from './document-table-config.entity.js';
import {
  DEFAULT_DOCUMENT_TABLE_COLUMNS,
  DOCUMENT_TABLE_COLUMNS,
  DocumentTableColumn,
} from './document-table-columns.js';

const CONFIG_ID = 1;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(DocumentTableConfig)
    private readonly configRepository: Repository<DocumentTableConfig>,
  ) {}

  async getDocumentTableColumns(): Promise<DocumentTableColumn[]> {
    const config = await this.configRepository.findOne({
      where: { id: CONFIG_ID },
    });
    if (!config) {
      return [...DEFAULT_DOCUMENT_TABLE_COLUMNS];
    }
    return this.sanitize(config.columns);
  }

  async updateDocumentTableColumns(
    columns: string[],
  ): Promise<DocumentTableColumn[]> {
    const invalid = columns.filter(
      (column) =>
        !DOCUMENT_TABLE_COLUMNS.includes(column as DocumentTableColumn),
    );
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Columnas inválidas: ${invalid.join(', ')}`,
      );
    }

    const unique = [
      ...new Set(columns),
    ] as DocumentTableColumn[];
    if (unique.length === 0) {
      throw new BadRequestException('Seleccione al menos una columna');
    }

    await this.configRepository.save({ id: CONFIG_ID, columns: unique });
    return unique;
  }

  private sanitize(columns: string[]): DocumentTableColumn[] {
    const valid = columns.filter((column) =>
      DOCUMENT_TABLE_COLUMNS.includes(column as DocumentTableColumn),
    ) as DocumentTableColumn[];
    return valid.length > 0 ? [...new Set(valid)] : [...DEFAULT_DOCUMENT_TABLE_COLUMNS];
  }
}
