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
  /\b(c[óo]digo|versi[óo]n|fecha\s+(?:de\s+)?(?:elaboraci[óo]n|actualizaci[óo]n)|p[áa]gina|hoja)\b/i;

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
  const spanish = /(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)\s+(?:de\s+)?(\d{4})/i.exec(value);
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
  '(\\d{1,2}\\s+(?:de\\s+)?[a-záéíóúñ]+\\s+(?:de\\s+)?\\d{4}|\\d{1,2}/\\d{1,2}/\\d{4}|\\d{4}-\\d{2}-\\d{2})';

const TITLE_PREFIX =
  /^(procedimiento|t[ií]tulo|nombre|documento)\s*:\s*(.+)$/i;

/**
 * Algunos formatos escriben el título con un prefijo ("Procedimiento: ...") y
 * lo continúan en la línea siguiente en minúsculas. Se toma literalmente: el
 * usuario puede corregirlo en el formulario.
 */
function findPrefixedTitle(lines: string[], headerIndex: number): string | null {
  for (let index = 0; index < headerIndex; index += 1) {
    const match = TITLE_PREFIX.exec(lines[index]);
    if (!match) continue;

    let title = match[2].trim();
    for (let next = index + 1; next < headerIndex; next += 1) {
      const line = lines[next];
      if (!/^[a-záéíóúñü]/.test(line)) break;
      if (HEADER_LABEL.test(line)) break;
      if (IGNORED_TITLE_PATTERNS.some((pattern) => pattern.test(line))) break;
      title = `${title} ${line}`.trim();
    }

    return title.length > 0 ? title : null;
  }
  return null;
}

/**
 * El título del formato vive en la celda central, antes de las etiquetas de
 * metadatos. Solo se consideran esas líneas: buscar en todo el documento
 * tomaría encabezados de secciones posteriores como si fueran el título.
 */
function isUppercaseTitleLine(line: string, minLetters: number): boolean {
  if (line.length < 2 || line.length > 120) return false;
  if (IGNORED_TITLE_PATTERNS.some((pattern) => pattern.test(line))) return false;

  const letters = line.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, '');
  if (letters.length < minLetters) return false;
  const uppercase = letters.replace(/[^A-ZÁÉÍÓÚÑÜ]/g, '');
  return uppercase.length / letters.length >= 0.8;
}

function isProseTitleLine(line: string): boolean {
  if (line.length < 4 || line.length > 120) return false;
  if (IGNORED_TITLE_PATTERNS.some((pattern) => pattern.test(line))) return false;
  const letters = line.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, '');
  return letters.length >= 4;
}

function longestRun(
  values: string[],
  isEligible: (value: string, runLength: number) => boolean,
): string | null {
  let best: string | null = null;
  let current: string[] = [];

  const flush = () => {
    const joined = current.join(' ').trim();
    if (joined.length > 0 && (!best || joined.length > best.length)) {
      best = joined;
    }
    current = [];
  };

  for (const value of values) {
    if (isEligible(value, current.length)) {
      current.push(value);
    } else {
      flush();
    }
  }
  flush();

  return best;
}

function findTitle(lines: string[]): string | null {
  const headerIndex = lines.findIndex((line) => HEADER_LABEL.test(line));
  if (headerIndex < 0) return null;

  const prefixed = findPrefixedTitle(lines, headerIndex);
  if (prefixed) return prefixed;

  const candidates = lines
    .slice(0, headerIndex)
    .map((line) => line.replace(/[|]+/g, ' ').trim())
    .filter(Boolean);

  // El título puede ocupar varias líneas: en mayúsculas, o en texto normal
  // cuando la plantilla no lo destaca. Se prefiere el bloque en mayúsculas.
  return (
    longestRun(candidates, (value, runLength) =>
      isUppercaseTitleLine(value, runLength > 0 ? 2 : 4),
    ) ?? longestRun(candidates, (value) => isProseTitleLine(value))
  );
}

// Palabras que pueden seguir a "CÓDIGO:" cuando el valor falta; no son códigos.
const CODE_STOPWORDS = /^(fecha|versi[óo]n|p[áa]gina|hoja|nit|tel|email|correo)$/i;

/**
 * El código se toma literal, aunque quede incompleto ("GIMSGP-") o venga sin
 * guiones ("PROMMS"). Si no hay un valor reconocible, devuelve null.
 */
function extractCode(text: string): string | null {
  const label = /\bc[óo]digo\b/i.exec(text);
  if (!label) return null;

  const start = label.index + label[0].length;
  const window = text.slice(start, start + 80);
  const match = new RegExp(`^${SEPARATOR}([A-Z0-9]{2,}(?:[-–][A-Z0-9.]*)*)`).exec(
    window,
  );
  const code = match?.[1];
  if (!code || CODE_STOPWORDS.test(code)) return null;
  if (code.length < 3 && !/[0-9\-–]/.test(code)) return null;
  return code;
}

/**
 * Busca una única fecha dentro del bloque de encabezado que sigue a una
 * etiqueta. Se corta en el marcador de página o el inicio del contenido para
 * no tomar fechas del cuerpo del documento.
 */
function findDateInHeaderBlock(text: string, fromIndex: number): string | null {
  const rest = text.slice(fromIndex, fromIndex + 200);
  const stop = /\b(p[áa]gina|hoja|introducci[óo]n|contenido|objetivo)\b/i.exec(
    rest,
  );
  const block = stop ? rest.slice(0, stop.index) : rest;
  const dates = [...new Set(block.match(new RegExp(DATE_VALUE, 'gi')) ?? [])];
  return dates.length === 1 ? dates[0] : null;
}

export function parseDocumentHeader(pages: string[]): DocumentHeaderFields {
  // El encabezado normalizado de los formatos del hospital está en la primera
  // página; usar el resto del documento solo aportaría texto de cuerpo.
  const text = normalizeHeaderText(pages[0] ?? '');
  const lines = text.split('\n').filter(Boolean);

  const code = extractCode(text);

  const version = new RegExp(
    `\\bversi[óo]n\\b${SEPARATOR}(\\d{1,3}(?:\\.\\d{1,3})*)`,
    'i',
  ).exec(text)?.[1];

  const elaborationRaw = new RegExp(
    `\\bfecha\\s+de\\s+elaboraci[óo]n\\b${SEPARATOR}${DATE_VALUE}`,
    'i',
  ).exec(text)?.[1];
  const updateLabel = /\bfecha\s+(?:de\s+)?actualizaci[óo]n\b/i.exec(text);
  let updateRaw = new RegExp(
    `\\bfecha\\s+(?:de\\s+)?actualizaci[óo]n\\b${SEPARATOR}${DATE_VALUE}`,
    'i',
  ).exec(text)?.[1];

  // En algunas plantillas el valor de la fecha de actualización queda después
  // de la versión. Se busca una única fecha dentro del bloque de encabezado,
  // deteniéndose en el marcador de página o el inicio del contenido.
  if (!updateRaw && updateLabel) {
    updateRaw =
      findDateInHeaderBlock(
        text,
        updateLabel.index + updateLabel[0].length,
      ) ?? undefined;
  }

  const pageMatch = /\b(?:p[áa]gina|hoja)\b[^0-9]{0,16}\d+[^0-9]{0,16}(\d+)/i.exec(text);

  return {
    // Los títulos de los documentos se registran en mayúsculas.
    title: findTitle(lines)?.toUpperCase() ?? null,
    code: code ?? null,
    version: version ?? null,
    elaborationDate: elaborationRaw ? toIsoDate(elaborationRaw) : null,
    updateDate: updateRaw ? toIsoDate(updateRaw) : null,
    pageCount: pageMatch ? Number(pageMatch[1]) : null,
  };
}
