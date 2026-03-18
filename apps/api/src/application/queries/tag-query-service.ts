export type TagWithCount = {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly articleCount: number;
};

export type TagQueryService = {
  readonly list: () => Promise<readonly TagWithCount[]>;
};
