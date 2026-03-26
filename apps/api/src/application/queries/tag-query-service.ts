interface TagWithCount {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly articleCount: number;
}

interface TagQueryService {
  readonly list: () => Promise<readonly TagWithCount[]>;
}

export type { TagWithCount, TagQueryService };
