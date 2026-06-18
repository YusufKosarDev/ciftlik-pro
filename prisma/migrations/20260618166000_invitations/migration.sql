-- Personel daveti tablosu (Faz 2). RLS ETKINLESTIRILMEZ: public kabul akisi
-- daveti token ile, tenant baglami olmadan okur. Token tahmin edilemez sirdir.

CREATE TABLE "Invitation" (
  "id"          TEXT NOT NULL,
  "tenantId"    TEXT NOT NULL,
  "email"       TEXT NOT NULL,
  "role"        "Role" NOT NULL DEFAULT 'WORKER',
  "token"       TEXT NOT NULL,
  "invitedById" TEXT,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "acceptedAt"  TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
CREATE INDEX "Invitation_tenantId_idx" ON "Invitation"("tenantId");
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");
