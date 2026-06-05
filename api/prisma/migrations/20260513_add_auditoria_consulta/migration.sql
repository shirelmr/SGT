-- CreateTable
CREATE TABLE "AuditoriaConsulta" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pregunta" TEXT NOT NULL,
    "sqlGenerado" TEXT NOT NULL,
    "filasDevueltas" INTEGER NOT NULL,

    CONSTRAINT "AuditoriaConsulta_pkey" PRIMARY KEY ("id")
);
