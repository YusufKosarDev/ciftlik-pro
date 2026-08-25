// Seed/bootstrap script'leri icin parola hash'leme.
//
// NEDEN AYRI DOSYA: prisma/ensure-admin.mjs Docker'in "migrator" asamasinda
// duz `node` ile calisir; orada tsx yoktur, dolayisiyla src/lib/password-hash.ts
// import edilemez. Format ve parametreler uygulama tarafiyla BIREBIR aynidir:
//   scrypt$<saltHex>$<hashHex>
// Uyumluluk src/lib/password-hash.test.ts icinde test edilir.
import crypto from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

export function hashPassword(plain) {
  return new Promise((resolve, reject) => {
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
