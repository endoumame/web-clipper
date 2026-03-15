import type { TagName } from "../values/tag-name.js";

export type Tag = {
  readonly id: string;
  readonly name: TagName;
  readonly createdAt: Date;
};

type CreateParams = {
  readonly id: string;
  readonly name: TagName;
};

const create = (params: CreateParams): Tag => ({
  id: params.id,
  name: params.name,
  createdAt: new Date(),
});

export const TagEntity = {
  create,
} as const;
