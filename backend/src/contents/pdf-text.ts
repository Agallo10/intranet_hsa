import { extractText, getDocumentProxy } from 'unpdf';

export interface PdfTextResult {
  pages: string[];
  totalPages: number;
}

/**
 * Extrae el texto de cada página de un PDF. Los PDF escaneados (solo imagen)
 * devuelven páginas vacías: en ese caso no hay encabezado legible sin OCR.
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfTextResult> {
  // verbosity 0 silencia los avisos de pdf.js sobre fuentes TrueType
  // ("TT: undefined function") que no afectan la extracción de texto y
  // llenaban los logs en cada lectura de encabezado.
  const pdf = await getDocumentProxy(new Uint8Array(buffer), {
    verbosity: 0,
  });
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  return {
    pages: Array.isArray(text) ? text : [text],
    totalPages,
  };
}
