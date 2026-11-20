export interface DocumentHeaderFields {
  title: string | null;
  code: string | null;
  version: string | null;
  elaborationDate: string | null;
  updateDate: string | null;
  pageCount: number | null;
}

const MONTHS: Record<string, string> = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
};

const HEADER_LABEL =
  /\b(c[óo]digo|versi[óo]n|fecha\s+(?:de\s+)?(?:elaboraci[óo]n|actualizaci[óo]n)|p[áa]gina)\b/i;

const IGNORED_TITLE_PATTERNS = [
  /hospital/i,
  /e\.?\s?s\.?\s?e\.?/i,
  /\bnit\b/i,
  /\btumaco\b/i,
  /\bnari[ñn]o\b/i,
  /^p[áa]gina\b/i,
  /\bc[óo]digo\b/i,
  /\bversi[óo]n\b/i,
  /\bfecha\b/i,
  /^\d+$/,
];

/**
 * Normaliza el texto extraído de un PDF: espacios no separables, saltos de
 * línea y espacios repetidos. No elimina acentos porque las plantillas del
 * hospital los usan en las etiquetas.
 */
export function normalizeHeaderText(raw: string): string {
  return raw
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
}

function toIsoDate(value: string): string | null {
  const spanish = /(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})/i.exec(value);
  if (spanish) {
    const month = MONTHS[spanish[2].toLowerCase()];
    if (!month) return null;
    return `${spanish[3]}-${month}-${spanish[1].padStart(2, '0')}`;
  }

  const dmy = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(value);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  return null;
}

// Acepta que la etiqueta y el valor estén separados por saltos de línea o
// espacios, pero no por otro texto con contenido.
const SEPARATOR = '[^A-Za-z0-9]{0,32}';
const DATE_VALUE =
  '(\\d{1,2}\\s+de\\s+[a-záéíóúñ]+\\s+de\\s+\\d{4}|\\d{1,2}/\\d{1,2}/\\d{4}|\\d{4}-\\d{2}-\\d{2})';

/**
 * El título del formato vive en la celda central, antes de las etiquetas de
 * metadatos. Solo se consideran esas líneas: buscar en todo el documento
 * tomaría encabezados de secciones posteriores como si fueran el título.
 */
function findTitle(lines: string[]): string | null {
  const headerIndex = lines.findIndex((line) => HEADER_LABEL.test(line));
  if (headerIndex < 0) return null;

  let best: string | null = null;
  for (const line of lines.slice(0, headerIndex)) {
    const value = line.replace(/[|]+/g, ' ').trim();
    if (value.length < 4 || value.length > 120) continue;
    if (IGNORED_TITLE_PATTERNS.some((pattern) => pattern.test(value))) continue;

    const letters = value.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, '');
    if (letters.length < 4) continue;
    const uppercase = letters.replace(/[^A-ZÁÉÍÓÚÑÜ]/g, '');
    if (uppercase.length / letters.length < 0.8) continue;

    if (!best || value.length > best.length) {
      best = value;
    }
  }
  return best;
}

export function parseDocumentHeader(pages: string[]): DocumentHeaderFields {
  // El encabezado normalizado de los formatos del hospital está en la primera
  // página; usar el resto del documento solo aportaría texto de cuerpo.
  const text = normalizeHeaderText(pages[0] ?? '');
  const lines = text.split('\n').filter(Boolean);

  const code = new RegExp(
    `\\bc[óo]digo\\b${SEPARATOR}([A-Z]{2,}[A-Z0-9]*(?:[-–][A-Z0-9]+)+)`,
    'i',
  )
    .exec(text)?.[1]
    ?.toUpperCase();

  const version = new RegExp(
    `\\bversi[óo]n\\b${SEPARATOR}(\\d{1,3})\\b`,
    'i',
  ).exec(text)?.[1];

  const elaborationRaw = new RegExp(
    `\\bfecha\\s+de\\s+elaboraci[óo]n\\b${SEPARATOR}${DATE_VALUE}`,
    'i',
  ).exec(text)?.[1];
  const updateRaw = new RegExp(
    `\\bfecha\\s+(?:de\\s+)?actualizaci[óo]n\\b${SEPARATOR}${DATE_VALUE}`,
    'i',
  ).exec(text)?.[1];

  const pageMatch = /\bp[áa]gina\b[^0-9]{0,16}\d+[^0-9]{0,16}(\d+)/i.exec(text);

  return {
    title: findTitle(lines),
    code: code ?? null,
    version: version ?? null,
    elaborationDate: elaborationRaw ? toIsoDate(elaborationRaw) : null,
    updateDate: updateRaw ? toIsoDate(updateRaw) : null,
    pageCount: pageMatch ? Number(pageMatch[1]) : null,
  };
}
