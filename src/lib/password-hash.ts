import crypto from "crypto";
import bcrypt from "bcryptjs";

// scrypt parameters: standard values balancing security against performance.
// N: CPU/memory cost, r: block size, p: parallelisation.
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

// Hashes a plaintext password with scrypt, asynchronously.
// It runs on the thread pool, so the event loop is never blocked.
export function hashPassword(plain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Generate a 16-byte random salt
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

// Verifies a password. Legacy bcrypt hashes (those starting with $2a$ or $2b$)
// keep verifying too, for backward compatibility.
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // Backward compatibility: verifying a legacy password
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$")) {
    return bcrypt.compare(plain, hash);
  }

  // The current scrypt format: scrypt$saltHex$hashHex
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
          // timingSafeEqual throws when the lengths differ.
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
