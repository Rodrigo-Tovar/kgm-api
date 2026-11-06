import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { MulterError } from 'multer';
import type { Response } from 'express';

@Catch(MulterError)
export class DocumentoMulterFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(413).json({ statusCode: 413, message: 'El documento no puede superar 5 MB.' });
      return;
    }
    response.status(400).json({ statusCode: 400, message: 'Archivo inválido.' });
  }
}
