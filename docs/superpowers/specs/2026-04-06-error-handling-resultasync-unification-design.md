# GitHub OAuth フロー ResultAsync 統一

## 概要

GitHub OAuth クライアントと認証プレゼンテーション層に残る `throw` / `try/catch` パターンを統一する。
対象は `github-oauth-client.ts` と `auth.ts` の 2 ファイル。

## 動機

API 層の他のインフラサービスは全て `ResultAsync` を返している。
例: `fetch-metadata-fetcher.ts`, `web-crypto-password-hasher.ts` 等。

GitHub OAuth クライアントだけが `throw new Error(...)` で例外を投げている。
呼び出し側が `try/catch` で受ける設計になっており、一貫性が崩れている。

error-handling スキルの原則に従う。
**回復可能なエラーは Either/Result 型で表現し、呼び出し元に判断を委ねる。**
外部システムエラー（GitHub API 通信失敗）は回復可能なエラーに分類される。

## 変更対象

### 1. `apps/api/src/infrastructure/services/github-oauth-client.ts`

- `GitHubOAuthClient` インターフェースの戻り値を `Promise<T>` → `ResultAsync<T, DomainError>` に変更
- 実装を `ResultAsync.fromPromise()` でラップ
- エラーは `DomainError` の `OAUTH_ERROR` 型にマッピング

### 2. `apps/api/src/presentation/routes/auth.ts`

- `GithubExchangeResult` カスタム union 型を削除
- `GithubOAuthDeps` ローカル型を `GitHubOAuthClient` の直接参照に簡素化
- `exchangeAndFetchGithubUser` を `ResultAsync` チェーン (`andThen`) に書き換え
- `processGithubOAuth` の `"error" in tokenResult` 分岐を `.match()` パターンに統一

## スコープ外

- `apps/api/src/domain/article/source.ts` の URL パースフォールバック（意図的な設計として維持）
- `apps/web/` フロントエンド側のエラーハンドリング（neverthrow 未導入、影響範囲大）
