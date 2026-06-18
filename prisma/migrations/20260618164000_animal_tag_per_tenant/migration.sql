-- Kulak numarasini global benzersizlikten TENANT-ICI benzersizlige tasi.
DROP INDEX "Animal_tagNumber_key";
CREATE UNIQUE INDEX "Animal_tenantId_tagNumber_key" ON "Animal"("tenantId", "tagNumber");
