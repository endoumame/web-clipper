# AI自動タグ付け・スマート分類 設計書

## 概要

記事クリッピング時にAIが記事内容を解析し、既存タグから最適なタグを自動付与する。既存タグにマッチしない場合は新規タグも生成する。ユーザーの手間ゼロで記事が整理された状態を維持できる。

## 決定事項

| 項目 | 決定 |
|------|------|
| タイミング | クリッピング時に自動付与 + 後から編集可能 |
| タグ範囲 | 既存タグ優先 + 新規タグも生成 |
| 入力データ | メタデータ + 記事本文（先頭6000文字に切り詰め） |
| 統合方法 | clipArticle後に `ctx.executionCtx.waitUntil()` で非同期実行 |
| ユーザー制御 | 常に有効（設定なし） |
| アーキテクチャ | ドメインサービス + 専用コマンド（generateSummaryと同パターン） |

## ドメイン層

### TagSuggester ドメインサービスインターフェース

`domain/tag/tag-suggester.ts` に新設。

```typescript
interface TagSuggester {
  readonly suggest: (input: TagSuggestionInput) => ResultAsync<readonly TagName[], DomainError>;
}

interface TagSuggestionInput {
  readonly title: string;
  readonly description: string | null;
  readonly content: string;
  readonly existingTags: readonly TagName[];
}
```

- 出力は `TagName[]`（既存VOを再利用、Parse don't validate）
- 既存タグリストを入力に含めることで「既存タグ優先」のビジネスルールをドメイン層で表現

### エラー型追加

`domain/shared/errors.ts` に `TAG_SUGGESTION_FAILED` を追加。

```typescript
| { readonly type: "TAG_SUGGESTION_FAILED"; readonly cause: string }
```

HTTP ステータスマッピング: `TAG_SUGGESTION_FAILED` → 502（ただし非同期処理のためレスポンスには影響しない）

## ユースケース層

### suggestAndApplyTags コマンド

`application/commands/suggest-and-apply-tags.ts` に新設。

```typescript
interface SuggestAndApplyTagsDeps {
  readonly articleRepo: ArticleRepository;
  readonly tagRepo: TagRepository;
  readonly contentExtractor: ContentExtractor;
  readonly tagSuggester: TagSuggester;
  readonly tagQuery: TagQueryService;
}
```

**処理フロー**:

1. `articleRepo.findById()` で記事を取得
2. `contentExtractor.extract()` で本文を取得し、先頭6000文字に切り詰め
3. `tagQuery.list()` で既存タグ名一覧を取得
4. `tagSuggester.suggest()` でAIにタグを提案させる
5. 提案タグと記事の既存タグをマージ（重複排除、ユーザー指定タグを保持）
6. `ArticleEntity.updateTags()` で記事を更新
7. `articleRepo.save()` で永続化（`syncTags` が新規タグを `tags` テーブルに自動作成）

**エラーハンドリング**: 記事は既に保存済み（非同期処理）のため、エラーはログ出力のみ。

## インフラ層

### WorkersAiTagSuggester

`infrastructure/services/workers-ai-tag-suggester.ts` に新設。

- AI binding: `env.AI`（既存の `WorkersAiSummarizer` と共有）
- モデル: `@cf/meta/llama-3.1-8b-instruct-fp8`
- 本文制限: 先頭6000文字（`ArticleSummarizer` と同じ）

**プロンプト設計方針**:

- システムプロンプトで「既存タグから最適なものを選び、どれも合わない場合のみ短い新規タグを提案」と指示
- 出力形式は JSON 配列（`["tag1", "tag2"]`）を指定
- 最大5個に制限してタグの増殖を抑制

**パース戦略**:

- AIレスポンスからJSON配列を抽出
- 各要素を `TagName` VOでバリデーション
- バリデーション失敗の個別タグはスキップ（部分的成功を許容）
- JSON全体のパース失敗 → `TAG_SUGGESTION_FAILED` エラー

### deps-factory.ts

依存に `tagSuggester: createWorkersAiTagSuggester(env.AI)` を追加。

## プレゼンテーション層

### POST /api/articles ルートハンドラの変更

`presentation/routes/articles.ts` を変更。

```typescript
const article = await clipArticle(deps)(input);

ctx.executionCtx.waitUntil(
  suggestAndApplyTags(deps)(article.id)
    .match(
      () => {},
      (error) => { console.error("Auto-tagging failed:", error); }
    )
);

return ctx.json(articleResponse, 201);
```

- `waitUntil()` でレスポンス送信後もWorkerを生存させ、非同期でタグ付けを完了
- エラー時はログ出力のみ。記事保存は成功しているのでユーザーに影響なし

## 共有パッケージ

`@web-clipper/shared` への変更なし。タグ付けはバックエンド内で完結し、既存の `ArticleResponse`（`tags: string[]`）で結果が反映される。

## 変更ファイル一覧

| レイヤー | ファイル | 変更種別 |
|---------|---------|---------|
| ドメイン | `domain/tag/tag-suggester.ts` | 新規 |
| ドメイン | `domain/shared/errors.ts` | `TAG_SUGGESTION_FAILED` 追加 |
| ユースケース | `application/commands/suggest-and-apply-tags.ts` | 新規 |
| インフラ | `infrastructure/services/workers-ai-tag-suggester.ts` | 新規 |
| インフラ | `infrastructure/deps-factory.ts` | 依存追加 |
| プレゼン | `presentation/routes/articles.ts` | `waitUntil` 追加 |

## テスト戦略

- **ドメイン層**: `TagSuggestionInput` の構築テスト（VOのバリデーション）
- **ユースケース層**: `suggestAndApplyTags` のユニットテスト。`TagSuggester` をモックし、タグマージロジック（重複排除、既存タグ保持）を検証
- **インフラ層**: `WorkersAiTagSuggester` のテスト。AIレスポンスのJSONパース、部分的成功、パース失敗のケースを検証
- **統合**: `clipArticle` → `waitUntil` → タグ付け完了後に記事のタグが更新されていることを確認
