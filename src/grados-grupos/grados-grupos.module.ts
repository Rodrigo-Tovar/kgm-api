import { Module } from '@nestjs/common';
import { GradosGruposController } from './grados-grupos.controller';
import { GradosGruposService } from './grados-grupos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GradosGruposController],
  providers: [GradosGruposService],
  exports: [GradosGruposService],
})
export class GradosGruposModule {}