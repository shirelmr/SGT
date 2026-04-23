◇ injected env (3) from prisma/.env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('coordinador', 'tutor', 'revisor', 'beneficiario');

-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('programada', 'realizada', 'cancelada');

-- CreateEnum
CREATE TYPE "EstadoComentario" AS ENUM ('pendiente', 'revisado', 'aprobado');

-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Periodo" (
    "id_periodo" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "horas_max" INTEGER NOT NULL,

    CONSTRAINT "Periodo_pkey" PRIMARY KEY ("id_periodo")
);

-- CreateTable
CREATE TABLE "TutorTec" (
    "id_tutor" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "matricula" VARCHAR(20),
    "carrera" VARCHAR(100),
    "semestre" SMALLINT,
    "link_video" VARCHAR(40),

    CONSTRAINT "TutorTec_pkey" PRIMARY KEY ("id_tutor")
);

-- CreateTable
CREATE TABLE "Beneficiario" (
    "id_benef" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "id_tutor" INTEGER,
    "grado_escolar" VARCHAR(50),
    "nombre_tutor_legal" VARCHAR(100),
    "tel_tutor" VARCHAR(20),
    "escuela" VARCHAR(100),

    CONSTRAINT "Beneficiario_pkey" PRIMARY KEY ("id_benef")
);

-- CreateTable
CREATE TABLE "Revisor" (
    "id_revisor" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,

    CONSTRAINT "Revisor_pkey" PRIMARY KEY ("id_revisor")
);

-- CreateTable
CREATE TABLE "Coordinador" (
    "id_coord" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "departamento" VARCHAR(100),

    CONSTRAINT "Coordinador_pkey" PRIMARY KEY ("id_coord")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id_sesion" SERIAL NOT NULL,
    "id_tutor" INTEGER NOT NULL,
    "id_beneficiario" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "duracion_hrs" DECIMAL(4,1) NOT NULL,
    "tema" VARCHAR(200) NOT NULL,
    "link_sesion" VARCHAR(300),
    "estado" "EstadoSesion" NOT NULL DEFAULT 'programada',

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "Bitacora" (
    "id_bitacora" SERIAL NOT NULL,
    "id_sesion" INTEGER NOT NULL,
    "id_tutor" INTEGER NOT NULL,
    "actividades" TEXT,
    "logros" TEXT,
    "dificultades" TEXT,
    "plan_siguiente" TEXT,
    "evidencia" VARCHAR(500),
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bitacora_pkey" PRIMARY KEY ("id_bitacora")
);

-- CreateTable
CREATE TABLE "ComentarioBitacora" (
    "id_comentario" SERIAL NOT NULL,
    "id_bitacora" INTEGER NOT NULL,
    "id_revisor" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "fecha_comentario" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoComentario" NOT NULL DEFAULT 'pendiente',
    "leido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ComentarioBitacora_pkey" PRIMARY KEY ("id_comentario")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id_asistencia" SERIAL NOT NULL,
    "id_sesion" INTEGER NOT NULL,
    "confirma_tutor" BOOLEAN NOT NULL DEFAULT false,
    "fecha_conf_tutor" TIMESTAMP(3),
    "confirma_benef" BOOLEAN NOT NULL DEFAULT false,
    "fecha_conf_benef" TIMESTAMP(3),

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id_asistencia")
);

-- CreateTable
CREATE TABLE "BeneficiarioPeriodo" (
    "id_benef_periodo" SERIAL NOT NULL,
    "id_benef" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "pct_examen_inicio" DECIMAL(5,2),
    "pct_examen_termino" DECIMAL(5,2),
    "fecha_examen_inicio" DATE,
    "fecha_examen_termino" DATE,

    CONSTRAINT "BeneficiarioPeriodo_pkey" PRIMARY KEY ("id_benef_periodo")
);

-- CreateTable
CREATE TABLE "HorasAcreditadas" (
    "id_horas_acreditadas" SERIAL NOT NULL,
    "id_tutor" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "horas_impartidas" DECIMAL(6,1) NOT NULL,
    "porcentaje_acred" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "HorasAcreditadas_pkey" PRIMARY KEY ("id_horas_acreditadas")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TutorTec_id_usuario_key" ON "TutorTec"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiario_id_usuario_key" ON "Beneficiario"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Revisor_id_usuario_key" ON "Revisor"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Coordinador_id_usuario_key" ON "Coordinador"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Bitacora_id_sesion_key" ON "Bitacora"("id_sesion");

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_id_sesion_key" ON "Asistencia"("id_sesion");

-- AddForeignKey
ALTER TABLE "TutorTec" ADD CONSTRAINT "TutorTec_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorTec" ADD CONSTRAINT "TutorTec_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "Periodo"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiario" ADD CONSTRAINT "Beneficiario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiario" ADD CONSTRAINT "Beneficiario_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "Periodo"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiario" ADD CONSTRAINT "Beneficiario_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "TutorTec"("id_tutor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revisor" ADD CONSTRAINT "Revisor_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revisor" ADD CONSTRAINT "Revisor_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "Periodo"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coordinador" ADD CONSTRAINT "Coordinador_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "TutorTec"("id_tutor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_id_beneficiario_fkey" FOREIGN KEY ("id_beneficiario") REFERENCES "Beneficiario"("id_benef") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "Periodo"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "Sesion"("id_sesion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "TutorTec"("id_tutor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioBitacora" ADD CONSTRAINT "ComentarioBitacora_id_bitacora_fkey" FOREIGN KEY ("id_bitacora") REFERENCES "Bitacora"("id_bitacora") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioBitacora" ADD CONSTRAINT "ComentarioBitacora_id_revisor_fkey" FOREIGN KEY ("id_revisor") REFERENCES "Revisor"("id_revisor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "Sesion"("id_sesion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiarioPeriodo" ADD CONSTRAINT "BeneficiarioPeriodo_id_benef_fkey" FOREIGN KEY ("id_benef") REFERENCES "Beneficiario"("id_benef") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorasAcreditadas" ADD CONSTRAINT "HorasAcreditadas_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "TutorTec"("id_tutor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorasAcreditadas" ADD CONSTRAINT "HorasAcreditadas_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "Periodo"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

