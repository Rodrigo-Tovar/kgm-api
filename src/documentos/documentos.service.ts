import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearDocumentoDto } from './dto/crear-documento.dto';

const metadatosDocumento = {
  id: true,
  escuelaId: true,
  alumnoId: true,
  tipo: true,
  nombreArchivo: true,
  mimeType: true,
  tamanoBytes: true,
  createdAt: true,
} as const;

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorAlumno(alumnoId: number, escuelaId: number) {
    await this.validarAlumno(alumnoId, escuelaId);
    return this.prisma.documentoAlumno.findMany({
      where: { alumnoId, escuelaId },
      select: metadatosDocumento,
      orderBy: { createdAt: 'desc' },
    });
  }

  async crear(dto: CrearDocumentoDto, escuelaId: number, archivo: Express.Multer.File) {
    await this.validarAlumno(dto.alumnoId, escuelaId);
    return this.prisma.documentoAlumno.create({
      data: {
        escuelaId,
        alumnoId: dto.alumnoId,
        tipo: dto.tipo,
        nombreArchivo: archivo.originalname,
        contenido: Uint8Array.from(archivo.buffer),
        mimeType: archivo.mimetype,
        tamanoBytes: archivo.size,
      },
      select: metadatosDocumento,
    });
  }

  async obtenerContenido(id: number, escuelaId: number) {
    const documento = await this.prisma.documentoAlumno.findFirst({
      where: { id, escuelaId },
      select: { nombreArchivo: true, mimeType: true, contenido: true },
    });
    if (!documento) {
      throw new NotFoundException('Documento no encontrado.');
    }
    return documento;
  }

  private async validarAlumno(alumnoId: number, escuelaId: number) {
    const alumno = await this.prisma.alumno.findFirst({
      where: { id: alumnoId, escuelaId },
      select: { id: true },
    });
    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado en la escuela.');
    }
  }
}
