import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Configuración global de la tabla de documentos. Es una fila única (id 1)
 * que define qué columnas ven todos los usuarios.
 */
@Entity('document_table_config')
export class DocumentTableConfig {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'simple-json' })
  columns: string[];

  @UpdateDateColumn()
  updatedAt: Date;
}
