-- CreateIndex
CREATE UNIQUE INDEX "asignacionacademica_escuelaid_cicloid_grupoid_materiaid_key" ON "asignacionacademica"("escuelaid", "cicloid", "grupoid", "materiaid");

-- CreateIndex
CREATE INDEX "asignacionacademica_docenteid_idx" ON "asignacionacademica"("docenteid");
