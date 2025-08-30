# cursor-reviewer-mcp

MCPサーバー「cursor-reviewer」。Claude Code から `cursor.review` または `codex.review` ツールを呼び出し、Cursor CLI（GPT‑5）または Codex CLI でレビューを実行し、レビューJSONのみを返します。仕様は `1.specs/spec.md`（v3）に準拠しています。

## 概要
- ツール名: `cursor.review`, `codex.review`
- 入力: `targets`, `reference`, `review_request`, `timeout_ms`（オプション）, `policy`（予約・null固定）
- 実装: Node.js + TypeScript + MCP SDK（`@modelcontextprotocol/sdk`）
- Cursor実行: `cursor-agent -p --model gpt-5 --output-format json "<プロンプト>"`
- Codex実行: `codex exec "<プロンプト>"`
- 出力: 各CLIの出力からレビューJSONのみを抽出し返却
- 監査: `reviews/YYYYMMDD-HHMMSS.json` にレビューJSONを保存

## ディレクトリ構成
```
.
├─ bin/
│  └─ cursor-reviewer-mcp        # 実行バイナリ（ビルド済みdistを起動）
├─ src/
│  ├─ server.ts                  # MCPサーバー本体（stdio）
│  ├─ cursor.ts                  # Cursor CLI 呼び出し・再試行・パース
│  ├─ codex.ts                   # Codex CLI 呼び出し・再試行・パース
│  ├─ prompt/
│  │  └─ template.txt            # 共有プロンプトテンプレート
│  └─ schemas/
│     ├─ cursor.review.input.schema.json
│     └─ codex.review.input.schema.json
├─ reviews/.gitkeep              # 監査ログ出力先（JSON）
├─ .cursor/cli.json              # Cursor CLI の権限制御（Read-only）
├─ .claude/agents/build-and-iterate.md  # サブエージェント定義テンプレ
├─ package.json
├─ tsconfig.json
├─ .gitignore
└─ README.md
```

## セットアップ
1) Node.js 22 LTS を用意（推奨）
   - `nvm` 利用時: `nvm use`（本リポジトリは `.nvmrc` で 22 を指定）

2) 依存インストール（任意のパッケージマネージャ）
```
npm i
```

3) ビルド
```
npm run build
```

4) 実行（MCPサーバーとして stdio で起動）
```
./bin/cursor-reviewer-mcp
```

5) Claude Code への登録例（プロジェクトスコープ）
```
claude mcp add --scope project cursor-reviewer $(pwd)/bin/cursor-reviewer-mcp
```

## 環境変数
- 通常は不要です。`cursor-agent` や `codex` が既にローカル設定済みであれば、環境変数は不要です。
- 特殊な環境（CI 等）で `cursor-agent` が環境変数経由の認証を要求する場合のみ、`CURSOR_API_KEY` を設定してください。
- Codex CLI のパスを明示する場合は `REVIEWER_MCP_CODEX_BIN`、追加フラグは `REVIEWER_MCP_CODEX_FLAGS`（スペース区切り）を設定します。
- JSON以外の出力を許容する場合のみ `REVIEWER_MCP_ALLOW_PLAINTEXT_FALLBACK=1` を設定します（デフォルトは厳格にJSONのみ）。

## ツール仕様（要点）
- 入力スキーマは `src/schemas/*.review.input.schema.json` に定義。
- `targets[].path` が存在しない場合はエラーを返却。
- CursorはトップレベルJSONの `result` からレビューJSONを抽出、Codexは標準出力から直接抽出（失敗時1回だけ再実行）。
- 各実行のレビューJSONは `reviews/` にタイムスタンプ名で保存。

## 注意
- このリポジトリにはSDK等の依存は含まれていません。`npm i` で取得してください。
- Cursor CLI（`cursor-agent`）および Codex CLI（`codex`）がPATHに存在する必要があります。

## ライセンス
- 本リポジトリは MIT License です。詳細は `LICENSE` を参照してください。
