import { err, ok } from "neverthrow";
import type { DomainError } from "./errors.js";
import type { Result } from "neverthrow";
import { nanoid } from "nanoid";
import { z } from "zod";

const MIN_LENGTH = 1;

interface BrandedIdConfig<Brand extends string> {
  readonly brand: Brand;
  readonly invalidError: (message: string) => DomainError;
  readonly generator?: () => string;
}

interface BrandedIdVO<Id extends string> {
  readonly schema: z.ZodType<Id>;
  readonly create: (input: string) => Result<Id, DomainError>;
  readonly generate: () => Id;
}

const createBrandedIdVO = <Brand extends string>(
  config: BrandedIdConfig<Brand>,
): BrandedIdVO<string & z.BRAND<Brand>> => {
  type Id = string & z.BRAND<Brand>;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- zod 4's .brand<Brand>() returns a conditional type when Brand is a generic; at runtime the output is Id
  const schema = z.string().min(MIN_LENGTH).brand<Brand>() as unknown as z.ZodType<Id>;
  const generator = config.generator ?? nanoid;

  const create = (input: string): Result<Id, DomainError> => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return err(config.invalidError(parsed.error.message));
    }
    return ok(parsed.data);
  };

  const generate = (): Id => schema.parse(generator());

  return { create, generate, schema };
};

export { createBrandedIdVO };
export type { BrandedIdVO };
