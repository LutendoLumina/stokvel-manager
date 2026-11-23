import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('never stores the password itself', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash).not.toContain('correct horse');
    expect(hash.startsWith('scrypt$')).toBe(true);
  });

  it('accepts the right password', async () => {
    const hash = await hashPassword('correct horse');
    await expect(verifyPassword('correct horse', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse');
    await expect(verifyPassword('correct horsE', hash)).resolves.toBe(false);
  });

  it('gives two different hashes for the same password (random salt)', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(a).not.toBe(b);
  });

  it('rejects a stored value that is not one of our hashes', async () => {
    await expect(verifyPassword('anything', 'not-a-hash')).resolves.toBe(false);
  });
});
