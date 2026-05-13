-- Add horas_esperadas to Periodo
ALTER TABLE "Periodo" ADD COLUMN "horas_esperadas" INTEGER NOT NULL DEFAULT 0;

-- Add unique constraint to HorasAcreditadas for upsert support
CREATE UNIQUE INDEX "HorasAcreditadas_id_tutor_id_periodo_key" ON "HorasAcreditadas"("id_tutor", "id_periodo");
