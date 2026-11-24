export const DOCUMENT_TABLE_COLUMNS = [
  'title',
  'code',
  'type',
  'version',
  'area',
  'category',
  'date',
] as const;

export type DocumentTableColumn = (typeof DOCUMENT_TABLE_COLUMNS)[number];

export const DEFAULT_DOCUMENT_TABLE_COLUMNS: DocumentTableColumn[] = [
  ...DOCUMENT_TABLE_COLUMNS,
];
