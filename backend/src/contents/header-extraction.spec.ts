import { describe, expect, it } from 'vitest';
import { parseDocumentHeader } from './header-extraction.js';

const SAMPLE_HEADER = `HOSPITAL
SAN ANDRES E.S.E.
Tumaco - Nariño
NIT: 800179870-2
PLAN DE CONTINGENCIA
CÓDIGO:
PLASG-SST-06
FECHA DE ELABORACIÓN:
26 de enero de 2018
VERSIÓN:
03
FECHA ACTUALIZACIÓN:
24 de julio de 2025
PÁGINA:  1  DE: 37
`;

describe('parseDocumentHeader', () => {
  it('lee el encabezado con etiquetas y valores en líneas separadas', () => {
    expect(parseDocumentHeader([SAMPLE_HEADER, 'Segunda página'])).toEqual({
      title: 'PLAN DE CONTINGENCIA',
      code: 'PLASG-SST-06',
      version: '03',
      elaborationDate: '2018-01-26',
      updateDate: '2025-07-24',
      pageCount: 37,
    });
  });

  it('lee el encabezado con etiqueta y valor en la misma línea', () => {
    const page = [
      'CÓDIGO: PLASG-SST-06',
      'VERSIÓN: 03',
      'FECHA DE ELABORACIÓN: 26 de enero de 2018',
      'FECHA DE ACTUALIZACIÓN: 24 de julio de 2025',
      'PÁGINA: 1 DE 37',
    ].join('\n');

    const fields = parseDocumentHeader([page]);
    expect(fields.code).toBe('PLASG-SST-06');
    expect(fields.version).toBe('03');
    expect(fields.elaborationDate).toBe('2018-01-26');
    expect(fields.updateDate).toBe('2025-07-24');
    expect(fields.pageCount).toBe(37);
  });

  it('acepta fechas numéricas y etiquetas sin acentos', () => {
    const page = [
      'CODIGO: PL-01',
      'VERSION: 2',
      'FECHA DE ELABORACION: 05/03/2021',
      'FECHA ACTUALIZACION: 2024-12-31',
    ].join('\n');

    const fields = parseDocumentHeader([page]);
    expect(fields.code).toBe('PL-01');
    expect(fields.version).toBe('2');
    expect(fields.elaborationDate).toBe('2021-03-05');
    expect(fields.updateDate).toBe('2024-12-31');
  });

  it('lee el código tal como aparece aunque quede incompleto', () => {
    const page = ['CÓDIGO:', 'GIMSGP-', 'VERSIÓN:', '1.0'].join('\n');

    const fields = parseDocumentHeader([page]);
    expect(fields.code).toBe('GIMSGP-');
    expect(fields.version).toBe('1.0');
  });

  it('lee el título con prefijo "Procedimiento:" y su continuación', () => {
    const page = [
      'NIT: 800179870-2',
      'Procedimiento: Toma de muestras post-mortem',
      'por mortalidad de Fiebre Amarilla',
      'CÓDIGO:',
      'GIMSGP-',
      'FECHA DE ELABORACIÓN:',
      '24 de octubre de 2025',
      'VERSIÓN:',
      '1.0',
      'FECHA ACTUALIZACIÓN:',
      'Página 1 de 5',
    ].join('\n');

    expect(parseDocumentHeader([page])).toEqual({
      title:
        'TOMA DE MUESTRAS POST-MORTEM POR MORTALIDAD DE FIEBRE AMARILLA',
      code: 'GIMSGP-',
      version: '1.0',
      elaborationDate: '2025-10-24',
      updateDate: null,
      pageCount: 5,
    });
  });

  it('une títulos de varias líneas en mayúsculas', () => {
    const page = [
      'NIT: 800179870-2',
      'PROTOCOLO VIGILANCIA',
      'EPIDEMIOLOGICA',
      'EVENTOS EN SALUD PUBLICA 2026',
      'CÓDIGO:',
      'PROMMS',
      'GP',
      'FECHA DE',
      'ELABORACIÓN:',
      '10 de enero 2026',
      'FECHA',
      'ACTUALIZACIÓN:',
      'VERSIÓN:',
      '02',
      '10 de enero 2026',
      'HOJA: 1 DE: 12',
    ].join('\n');

    expect(parseDocumentHeader([page])).toEqual({
      title: 'PROTOCOLO VIGILANCIA EPIDEMIOLOGICA EVENTOS EN SALUD PUBLICA 2026',
      code: 'PROMMS',
      version: '02',
      elaborationDate: '2026-01-10',
      updateDate: '2026-01-10',
      pageCount: 12,
    });
  });

  it('acepta fechas sin la preposición "de"', () => {
    const page = [
      'PROCEDIMIENTO PARA EL CÁLCULO DEL INDICADOR DE',
      'MORTALIDAD MATERNA',
      'CÓDIGO:',
      'EPIPRO001',
      'FECHA DE ELABORACIÓN:',
      '21 agosto 2026',
      'VERSIÓN:',
      '1.0',
      'FECHA ACTUALIZACIÓN:',
      '21 agosto 2026',
      'PAGINA 1 de 6',
    ].join('\n');

    expect(parseDocumentHeader([page])).toEqual({
      title:
        'PROCEDIMIENTO PARA EL CÁLCULO DEL INDICADOR DE MORTALIDAD MATERNA',
      code: 'EPIPRO001',
      version: '1.0',
      elaborationDate: '2026-08-21',
      updateDate: '2026-08-21',
      pageCount: 6,
    });
  });

  it('incluye una sigla corta dentro del título en mayúsculas', () => {
    const page = [
      'PROTOCOLO DE NECROPISA',
      'HSA',
      'CÓDIGO:',
      'PRTMREF-01',
    ].join('\n');

    expect(parseDocumentHeader([page]).title).toBe(
      'PROTOCOLO DE NECROPISA HSA',
    );
  });

  it('lee títulos en texto normal repartidos en varias líneas', () => {
    const page = [
      'NIT: 800179870-2',
      'Protocolo para la toma, manejo,',
      'conservación y envío de muestras',
      'respiratorias para el evento 591',
      'CÓDIGO:',
      'PRTXXX-XX',
      'FECHA DE',
      'ELABORACIÓN:',
      '01 octubre 2026',
      'VERSIÓN:',
      'XX',
      'FECHA',
      'ACTUALIZACIÓN:',
      '01 de octubre 2026',
      'PÁGINA:',
      'HOJA: 1 DE 12',
    ].join('\n');

    expect(parseDocumentHeader([page])).toEqual({
      title:
        'PROTOCOLO PARA LA TOMA, MANEJO, CONSERVACIÓN Y ENVÍO DE MUESTRAS RESPIRATORIAS PARA EL EVENTO 591',
      code: 'PRTXXX-XX',
      version: null,
      elaborationDate: '2026-10-01',
      updateDate: '2026-10-01',
      pageCount: 12,
    });
  });

  it('lee encabezados con etiquetas y valores intercalados en columnas', () => {
    const page = [
      'NIT: 800179870-2',
      'FORMATO DE ACTA',
      'CODIGO: FECHA DE ELABORACIÓN:',
      'FOREOPYC-130 23 de febrero de 2022',
      'FECHA DE ACTUALIZACIÓN:',
      'VERSIÓN: 26 de junio del 2025',
      '3.0 Página 1 de 5',
    ].join('\n');

    expect(parseDocumentHeader([page])).toEqual({
      title: 'FORMATO DE ACTA',
      code: 'FOREOPYC-130',
      version: '3.0',
      elaborationDate: '2022-02-23',
      updateDate: '2025-06-26',
      pageCount: 5,
    });
  });

  it('acepta fechas con guiones y con el mes primero', () => {
    const withHyphens = parseDocumentHeader([
      [
        'FECHA DE ELABORACIÓN:\n23 -septiembre -2025',
        'FECHA ACTUALIZACIÓN:\n15 -mayo -2026',
      ].join('\n'),
    ]);
    expect(withHyphens.elaborationDate).toBe('2025-09-23');
    expect(withHyphens.updateDate).toBe('2026-05-15');

    const monthFirst = parseDocumentHeader([
      'FECHA DE ELABORACIÓN:\nAbril 1 de 2025',
    ]);
    expect(monthFirst.elaborationDate).toBe('2025-04-01');
  });

  it('deja la fecha vacía si el documento solo trae mes y año', () => {
    const page = ['FECHA DE ELABORACIÓN:', 'julio del 2021'].join('\n');
    expect(parseDocumentHeader([page]).elaborationDate).toBeNull();
  });

  it('no toma como código una etiqueta de metadatos', () => {
    const page = ['CÓDIGO:', 'FECHA DE ELABORACIÓN:', '10 de enero 2026'].join(
      '\n',
    );

    expect(parseDocumentHeader([page]).code).toBeNull();
  });

  it('no continúa el título con líneas que empiezan en mayúscula', () => {
    const page = [
      'Título: Plan de contingencia',
      'INTRODUCCIÓN GENERAL',
      'CÓDIGO: PL-01',
    ].join('\n');

    expect(parseDocumentHeader([page]).title).toBe('PLAN DE CONTINGENCIA');
  });

  it('no inventa el título cuando solo hay datos de la entidad', () => {
    const page = [
      'HOSPITAL SAN ANDRES E.S.E.',
      'NIT: 800179870-2',
      'Tumaco - Nariño',
    ].join('\n');

    expect(parseDocumentHeader([page]).title).toBeNull();
  });

  it('mantiene el título del encabezado aunque otras páginas tengan títulos más largos', () => {
    const pages = [
      SAMPLE_HEADER,
      'INTRODUCCIÓN\nTexto del documento\nMARCO LEGAL Y NORMATIVO\nTexto',
    ];

    expect(parseDocumentHeader(pages).title).toBe('PLAN DE CONTINGENCIA');
  });

  it('no toma como título un encabezado de sección ni el valor del código', () => {
    expect(
      parseDocumentHeader(['INTRODUCCIÓN\nTexto\nMARCO LEGAL Y NORMATIVO'])
        .title,
    ).toBeNull();
    expect(
      parseDocumentHeader(['CÓDIGO:\nPLASG-SST-06\nVERSIÓN:\n03']).title,
    ).toBeNull();
  });

  it('nunca toma las líneas de la entidad como título', () => {
    const variants = [
      ['E.S.E. HOSPITAL SAN ANDRES', 'NIT: 800179870-2', 'CÓDIGO: PL-01'],
      ['HOSPITAL', 'SAN ANDRES E.S.E.', 'CÓDIGO:\nPL-01'],
      ['Tumaco - Nariño', 'NIT: 800179870-2', 'VERSIÓN: 2'],
      ['SAN ANDRÉS DE TUMACO', 'NIT: 800179870-2', 'CÓDIGO:\nPL-01'],
      ['DEPARTAMENTO DE NARIÑO', 'NIT: 800179870-2', 'CÓDIGO:\nPL-01'],
      ['MUNICIPIO DE TUMACO', 'CÓDIGO:\nPL-01'],
      ['SECRETARIA DE SALUD NARIÑO', 'CÓDIGO:\nPL-01'],
    ];

    for (const lines of variants) {
      expect(parseDocumentHeader([lines.join('\n')]).title).toBeNull();
    }
  });

  it('prefiere el título real sobre una línea de ubicación de la entidad', () => {
    const page = [
      'HOSPITAL',
      'DEPARTAMENTO DE NARIÑO',
      'PLAN DE CONTINGENCIA',
      'CÓDIGO:',
      'PLASG-SST-06',
      'VERSIÓN:',
      '03',
      'FECHA DE ELABORACIÓN:',
      '26 de enero de 2018',
    ].join('\n');

    expect(parseDocumentHeader([page]).title).toBe('PLAN DE CONTINGENCIA');
  });

  it('devuelve nulos cuando no hay encabezado reconocible', () => {
    expect(parseDocumentHeader(['Texto cualquiera sin metadatos'])).toEqual({
      title: null,
      code: null,
      version: null,
      elaborationDate: null,
      updateDate: null,
      pageCount: null,
    });
  });

  it('devuelve nulos cuando el PDF no tiene texto', () => {
    expect(parseDocumentHeader([''])).toEqual({
      title: null,
      code: null,
      version: null,
      elaborationDate: null,
      updateDate: null,
      pageCount: null,
    });
  });
});
