import { Module } from '@nestjs/common';
import { CiclosEscolaresController } from './ciclos-escolares.controller';
import { CiclosEscolaresService } from './ciclos-escolares.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CiclosEscolaresController],
  providers: [CiclosEscolaresService],
  exports: [CiclosEscolaresService],
})
export class CiclosEscolaresModule {}