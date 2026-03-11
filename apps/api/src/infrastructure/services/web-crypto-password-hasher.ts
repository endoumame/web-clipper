import { ResultAsync } from "neverthrow";
import type { PasswordHasher } from "../../domain/ports/password-hasher.js";
import type { DomainError } from "../../domain/errors.js";

const ITERATIONS = 100_000;
const HASH_ALGORITHM = "SHA-256";
const KEY_LENGTH = 256;
const SALT_LENGTH = 32;

const toBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const fromBase64 = (base64: string): Uint8Array =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

const deriveKey = async (password: string, salt: Uint8Array): Promise<ArrayBuffer> => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password).buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: ITERATIONS, hash: HASH_ALGORITHM },
    keyMaterial,
    KEY_LENGTH,
  );
};

const toStorageError = (e: unknown): DomainError => ({
  type: "STORAGE_ERROR",
  cause: e,
});

export const createWebCryptoPasswordHasher = (): PasswordHasher => ({
  hash: (password) =>
    ResultAsync.fromPromise(
      (async () => {
        const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const hashBuffer = await deriveKey(password, salt);
        return { hash: toBase64(hashBuffer), salt: toBase64(salt.buffer) };
      })(),
      toStorageError,
    ),

  verify: (password, storedHash, storedSalt) =>
    ResultAsync.fromPromise(
      (async () => {
        const salt = fromBase64(storedSalt);
        const hashBuffer = await deriveKey(password, salt);
        return toBase64(hashBuffer) === storedHash;
      })(),
      toStorageError,
    ),
});
