import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * Password hashing with scrypt, which is built into Node (no extra library).
 *
 * A hash is like a fingerprint: we can check a password matches it,
 * but nobody can turn it back into the password.
 * scrypt is deliberately slow and memory-hungry, so guessing millions of passwords is expensive.
 *
 * Stored format: scrypt$N$r$p$<salt>$<hash>
 * Saving the settings inside the hash means we can make them stronger later
 * and old passwords still work.
 */

// Settings recommended by OWASP for scrypt (uses about 32 MB per hash).
const N = 2 ** 15; // cost
const r = 8; // block size
const p = 3; // parallelism
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

function scryptAsync(password: string, salt: Buffer, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  // The salt is random, so two people with the same password get different hashes.
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, { N, r, p, maxmem: MAX_MEMORY });
  return ['scrypt', N, r, p, salt.toString('base64'), hash.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, rr, pp, saltB64, hashB64] = stored.split('$');
  if (algorithm !== 'scrypt' || !saltB64 || !hashB64) return false;

  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), {
    N: Number(n),
    r: Number(rr),
    p: Number(pp),
    maxmem: MAX_MEMORY,
  });

  // timingSafeEqual takes the same time whether the first or last byte differs,
  // so an attacker can't learn anything from how long the check takes.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
