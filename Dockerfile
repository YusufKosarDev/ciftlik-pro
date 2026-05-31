# --- 1. Asama: bagimliliklar ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall "prisma generate" calistirdigi icin sema install'dan once gerekli.
COPY prisma ./prisma
# npm install kullaniyoruz: lockfile Windows'ta uretildigi icin Linux'a ozgu
# ikili paketleri icermez; npm ci bunlari reddeder, npm install cozer.
RUN npm install

# --- 2. Asama: derleme ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build aninda gercek DB'ye baglanilmaz; PrismaClient'in olusabilmesi icin
# yer tutucu degiskenler yeterli. Gercek degerler calisma aninda verilir.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV AUTH_SECRET="build-time-placeholder-secret"
# Prisma Client uret ve uygulamayi derle
RUN npx prisma generate
RUN npm run build

# --- 3. Asama: migration calistirici ---
# Prisma CLI'nin tum (gecisli) bagimliliklari gerektigi icin tam node_modules
# ile ayri bir hafif asama. docker-compose'da tek seferlik "migrate" servisi
# bu asamayi kullanip "migrate deploy" calistirir; ardindan app baslar.
FROM node:22-alpine AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# --- 4. Asama: calistirma ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Guvenlik: root olmayan kullanici
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone cikti + statik dosyalar + prisma semasi
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Migration'lar ayri "migrate" servisinde uygulanir. Burada (varsa) idempotent
# admin bootstrap'i calisir (ensure-admin yalnizca @prisma/client + bcryptjs
# kullanir; bunlar standalone ciktida mevcuttur), sonra sunucu baslar.
CMD ["sh", "-c", "node prisma/ensure-admin.mjs && node server.js"]
