import { getDocumentProxy, extractText } from 'unpdf';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extractPdfText } from './pdf-text.js';

vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(),
  extractText: vi.fn(),
}));

const mockedGetDocumentProxy = vi.mocked(getDocumentProxy);
const mockedExtractText = vi.mocked(extractText);

describe('extractPdfText', () => {
  beforeEach(() => {
    mockedGetDocumentProxy.mockReset();
    mockedExtractText.mockReset();
  });

  it('desactiva los avisos de pdf.js y devuelve el texto por página', async () => {
    const pdf = { numPages: 2 } as never;
    mockedGetDocumentProxy.mockResolvedValue(pdf);
    mockedExtractText.mockResolvedValue({
      totalPages: 2,
      text: ['primera', 'segunda'],
    } as never);

    const result = await extractPdfText(Buffer.from('%PDF-1.4\n'));

    expect(mockedGetDocumentProxy).toHaveBeenCalledWith(expect.any(Uint8Array), {
      verbosity: 0,
    });
    expect(result).toEqual({ pages: ['primera', 'segunda'], totalPages: 2 });
  });
});
