import type { TagName } from "./tag-name.js";

interface Tag {
  readonly id: string;
  readonly name: TagName;
  readonly createdAt: Date;
}

interface CreateParams {
  readonly id: string;
  readonly name: TagName;
}

const create = (params: CreateParams): Tag => ({
  createdAt: new Date(),
  id: params.id,
  name: params.name,
});

const TagEntity = {
  create,
} as const;

export { TagEntity };
export type { Tag };
