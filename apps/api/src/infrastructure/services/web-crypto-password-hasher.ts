import type { DomainError } from "../../domain/shared/index.js";
import type { PasswordHasher } from "../../domain/user/index.js";
import { ResultAsync } from "neverthrow";

const ITERATIONS = 100_000;
const HASH_ALGORITHM = "SHA-256";
const KEY_LENGTH = 256;
const SALT_LENGTH = 32;
const DEFAULT_CODE_POINT = 0;
const INCREMENT = 1;

const toBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCodePoint(...new Uint8Array(buffer)));

const fromBase64 = (base64: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let idx = 0; idx < binary.length; idx += INCREMENT) {
    bytes[idx] = binary.codePointAt(idx) ?? DEFAULT_CODE_POINT;
  }
  return bytes;
};

const deriveKey = async (password: string, salt: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> => {
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return globalThis.crypto.subtle.deriveBits(
    {
      hash: HASH_ALGORITHM,
      iterations: ITERATIONS,
      name: "PBKDF2",
      salt,
    },
    keyMaterial,
    KEY_LENGTH,
  );
};

const toStorageError = (err: unknown): DomainError => ({
  cause: err,
  type: "STORAGE_ERROR",
});

const createWebCryptoPasswordHasher = (): PasswordHasher => ({
  hash: (password: string): ResultAsync<{ hash: string; salt: string }, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<{ hash: string; salt: string }> => {
        const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const hashBuffer = await deriveKey(password, salt);
        return { hash: toBase64(hashBuffer), salt: toBase64(salt.buffer) };
      })(),
      toStorageError,
    ),

  verify: (
    password: string,
    storedHash: string,
    storedSalt: string,
  ): ResultAsync<boolean, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const salt = fromBase64(storedSalt);
        const hashBuffer = await deriveKey(password, salt);
        return toBase64(hashBuffer) === storedHash;
      })(),
      toStorageError,
    ),
});

export { createWebCryptoPasswordHasher };
