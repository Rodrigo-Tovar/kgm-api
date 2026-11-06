import { Module } from '@nestjs/common';
import { TutoresController } from './tutores.controller';
import { TutoresService } from './tutores.service';

@Module({
  controllers: [TutoresController],
  providers: [TutoresService],
  exports: [TutoresService],
})
export class TutoresModule {}
