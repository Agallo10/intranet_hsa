import JSZip from 'jszip';

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&(amp|lt|gt|quot|apos);/g, (match) => ENTITIES[match] ?? match)
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    );
}

/** Texto de cada párrafo, usando solo los nodos <w:t> (ignora dibujos y campos). */
function xmlToLines(xml: string): string[] {
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br\/>/g, '\n')
    .split(/<\/w:p>/)
    .map((paragraph) =>
      [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
        .map((match) => decodeEntities(match[1]))
        .join('')
        .trim(),
    )
    .flatMap((line) => line.split('\n'))
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Extrae el texto de un documento Word (.docx): primero las cabeceras de
 * página (donde suele estar la tabla con código y versión) y después el
 * cuerpo. Solo admite el formato OOXML.
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    throw new Error('El archivo no contiene word/document.xml');
  }

  const headerFiles = Object.keys(zip.files)
    .filter((name) => /^word\/header\d*\.xml$/.test(name))
    .sort();

  const lines: string[] = [];
  for (const name of headerFiles) {
    const xml = await zip.file(name)?.async('string');
    if (xml) lines.push(...xmlToLines(xml));
  }
  lines.push(...xmlToLines(documentXml));

  // Las cabeceras de Word repiten la tabla (copia de respaldo de los cuadros
  // de texto); se descartan las líneas consecutivas duplicadas.
  return lines.filter((line, index) => line !== lines[index - 1]).join('\n');
}
