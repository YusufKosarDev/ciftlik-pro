import crypto from "crypto";
import bcrypt from "bcryptjs";

// scrypt parametreleri: Guvenlik ve performans dengesi icin standard degerler.
// N: CPU/RAM maliyeti, r: Blok boyutu, p: Paralellesme parametresi
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

// Duz metin parolayi scrypt ile asenkron olarak hash'ler.
// Event loop'u engellemeden arka planda (thread pool) calisir.
export function hashPassword(plain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 16 byte rasgele tuz (salt) uret
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(
      plain,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`scrypt$${salt}$${derivedKey.toString("hex")}`);
      }
    );
  });
}

// Parolayi dogrular. Eski bcrypt hash'lerini de ($2a$ veya $2b$ ile baslayan)
// geriye donuk uyumlu sekilde dogrulamaya devam eder.
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // Geriye donuk uyumluluk: Eski parolanin dogrulanmasi
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$")) {
    return bcrypt.compare(plain, hash);
  }

  // Yeni scrypt formati: scrypt$saltHex$hashHex
  if (hash.startsWith("scrypt$")) {
    const parts = hash.split("$");
    if (parts.length !== 3) {
      return Promise.resolve(false);
    }
    const [, salt, originalHash] = parts;
    return new Promise((resolve) => {
      crypto.scrypt(
        plain,
        salt,
        SCRYPT_KEYLEN,
        { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
        (err, derivedKey) => {
          if (err) return resolve(false);
          const hashBuf = Buffer.from(originalHash, "hex");
          const derivedBuf = derivedKey;
          // timingSafeEqual uzunluklar farkliysa hata firlatir.
          if (hashBuf.length !== derivedBuf.length) {
            return resolve(false);
          }
          resolve(crypto.timingSafeEqual(hashBuf, derivedBuf));
        }
      );
    });
  }

  return Promise.resolve(false);
}
