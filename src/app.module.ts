import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportesModule } from './reportes/reportes.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AlumnosModule } from './alumnos/alumnos.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AlumnosModule, ReportesModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
