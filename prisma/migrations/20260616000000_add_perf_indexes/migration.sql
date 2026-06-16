-- Performans: takvim/dashboard/cron'da kullanilan tarih arasligi sorgulari icin
-- ek index'ler. Saf CREATE INDEX (geri donusum: DROP INDEX).

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Vaccination_nextDate_idx" ON "Vaccination"("nextDate");

-- CreateIndex
CREATE INDEX "Crop_harvestDate_idx" ON "Crop"("harvestDate");

-- CreateIndex
CREATE INDEX "BreedingRecord_expectedBirthDate_idx" ON "BreedingRecord"("expectedBirthDate");
