import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const directorioFotos = join(process.cwd(), 'uploads', 'docentes');
const extensionesPorTipo: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const almacenamientoFotosDocentes = diskStorage({
  destination: (_solicitud, _archivo, callback) => {
    mkdirSync(directorioFotos, { recursive: true });
    callback(null, directorioFotos);
  },
  filename: (_solicitud, archivo, callback) => {
    callback(null, `${randomUUID()}${extensionesPorTipo[archivo.mimetype]}`);
  },
});

export const opcionesFotoDocente = {
  storage: almacenamientoFotosDocentes,
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
