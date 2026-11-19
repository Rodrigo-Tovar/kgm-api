export const TIPOS_DOCUMENTO = [
  'Acta de nacimiento',
  'CURP',
  'Identificación del tutor',
  'Comprobante de domicilio',
  'Cartilla de vacunación',
  'Certificado médico',
  'Fotografía',
  'Otro',
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const MIME_DOCUMENTO: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
};

export const MAX_DOCUMENTO_BYTES = 5 * 1024 * 1024;
