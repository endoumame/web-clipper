import type { TagId } from "./tag-id.js";
import type { TagName } from "./tag-name.js";

interface Tag {
  readonly id: TagId;
  readonly name: TagName;
  readonly createdAt: Date;
}

interface CreateParams {
  readonly id: TagId;
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
