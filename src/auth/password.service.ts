import {
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';

const COST = 32768;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;

function derivarClave(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      {
        N: COST,
        r: BLOCK_SIZE,
        p: PARALLELIZATION,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
}

@Injectable()
export class PasswordService {
  validar(password: string): void {
    if (
      typeof password !== 'string' ||
      password.length < 12 ||
      password.length > 128
    ) {
      throw new UnprocessableEntityException(
        'La contraseña debe tener entre 12 y 128 caracteres.',
      );
    }
  }

  async hash(password: string): Promise<string> {
    this.validar(password);
    const salt = randomBytes(16);
    const derivedKey = await derivarClave(password, salt);

    return [
      'scrypt',
      COST,
      BLOCK_SIZE,
      PARALLELIZATION,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verificar(password: string, encoded: string): Promise<boolean> {
    const [algorithm, cost, blockSize, parallelization, saltText, keyText] =
      encoded.split('$');
    if (
      algorithm !== 'scrypt' ||
      cost !== String(COST) ||
      blockSize !== String(BLOCK_SIZE) ||
      parallelization !== String(PARALLELIZATION) ||
      !saltText ||
      !keyText
    ) {
      return false;
    }

    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(keyText, 'base64url');
    if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;

    const actual = await derivarClave(password, salt);
    return timingSafeEqual(actual, expected);
  }
}
