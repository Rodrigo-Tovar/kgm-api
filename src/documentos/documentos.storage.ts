import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { MAX_DOCUMENTO_BYTES } from './documentos.constants';

const firmas: Record<string, (contenido: Buffer) => boolean> = {
  'application/pdf': (contenido) => contenido.subarray(0, 4).toString() === '%PDF',
  'image/jpeg': (contenido) => contenido[0] === 0xff && contenido[1] === 0xd8 && contenido[2] === 0xff,
  'image/png': (contenido) => contenido.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
};

export const opcionesDocumento = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_DOCUMENTO_BYTES },
  fileFilter: (_request: Express.Request, archivo: Express.Multer.File, callback: (error: Error | null, aceptar: boolean) => void) => {
    if (!firmas[archivo.mimetype]) {
      callback(new BadRequestException('El documento debe ser PDF, JPG o PNG.'), false);
      return;
    }
    callback(null, true);
  },
};

export function validarFirmaDocumento(archivo: Express.Multer.File): void {
  if (!firmas[archivo.mimetype]?.(archivo.buffer)) {
    throw new BadRequestException('La firma del archivo no corresponde a su tipo declarado.');
  }
}

export function esErrorTamanoDocumento(error: unknown): boolean {
  return error instanceof Error && error.message === 'File too large';
}

export { PayloadTooLargeException };
