import { UnprocessableEntityException } from '@nestjs/common';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('stores a salted scrypt hash and verifies only the original password', async () => {
    const firstHash = await service.hash('SchoolAccess-2026!');
    const secondHash = await service.hash('SchoolAccess-2026!');

    expect(firstHash).not.toContain('SchoolAccess-2026!');
    expect(firstHash).not.toBe(secondHash);
    await expect(
      service.verificar('SchoolAccess-2026!', firstHash),
    ).resolves.toBe(true);
    await expect(
      service.verificar('WrongAccess-2026!', firstHash),
    ).resolves.toBe(false);
  });

  it('rejects passwords outside the supported length', async () => {
    await expect(service.hash('short')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(() => service.validar('x'.repeat(129))).toThrow(
      UnprocessableEntityException,
    );
  });
});
