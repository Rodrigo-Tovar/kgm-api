import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const directorioFotos = join(process.cwd(), 'uploads', 'administradores');
const extensionesPorTipo: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export type FotoAdministradorGuardada = {
  url: string;
  ruta: string;
};

export const opcionesFotoAdministrador = {
  storage: memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (
    _solicitud: Express.Request,
    archivo: Express.Multer.File,
    callback: (error: Error | null, aceptar: boolean) => void,
  ) => {
    if (!extensionesPorTipo[archivo.mimetype]) {
      callback(
        new BadRequestException('La foto debe ser JPG, PNG o WebP.'),
        false,
      );
      return;
    }

    callback(null, true);
  },
};

export async function guardarFotoAdministrador(
  archivo: Express.Multer.File,
): Promise<FotoAdministradorGuardada> {
  const extension = extensionesPorTipo[archivo.mimetype];
  const contenidoValido =
    archivo.mimetype === 'image/jpeg'
      ? archivo.buffer[0] === 0xff &&
        archivo.buffer[1] === 0xd8 &&
        archivo.buffer[2] === 0xff
      : archivo.mimetype === 'image/png'
        ? archivo.buffer.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          )
        : archivo.mimetype === 'image/webp'
          ? archivo.buffer.toString('ascii', 0, 4) === 'RIFF' &&
            archivo.buffer.toString('ascii', 8, 12) === 'WEBP'
          : false;

  if (!extension || !contenidoValido) {
    throw new BadRequestException(
      'El contenido del archivo no coincide con una imagen JPG, PNG o WebP válida.',
    );
  }

  await mkdir(directorioFotos, { recursive: true });
  const nombre = `${randomUUID()}${extension}`;
  const ruta = join(directorioFotos, nombre);
  await writeFile(ruta, archivo.buffer, { flag: 'wx' });
  return {
    url: `/uploads/administradores/${nombre}`,
    ruta,
  };
}
