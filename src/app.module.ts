import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportesModule } from './reportes/reportes.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AlumnosModule } from './alumnos/alumnos.module';
import { DocentesModule } from './docentes/docentes.module';
import { TutoresModule } from './tutores/tutores.module';
import { MateriasModule } from './materias/materias.module';
import { AsignacionesAcademicasModule } from './asignaciones-academicas/asignaciones-academicas.module';
import { DocumentosModule } from './documentos/documentos.module';
import { CiclosEscolaresModule } from './ciclos-escolares/ciclos-escolares.module';
import { GradosGruposModule } from './grados-grupos/grados-grupos.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AlumnosModule,
    DocentesModule,
    TutoresModule,
    MateriasModule,
    AsignacionesAcademicasModule,
    DocumentosModule,
    ReportesModule,
    CiclosEscolaresModule,
    GradosGruposModule,
    AuthModule,
    UsuariosModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
