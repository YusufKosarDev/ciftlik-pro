-- Basarisiz giris denetimi icin AuditAction enum'una yeni deger.
-- (PostgreSQL 12+; yeni deger ayni migration icinde KULLANILMAZ.)

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'LOGIN_FAILED';
