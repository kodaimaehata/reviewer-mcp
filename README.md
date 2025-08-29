# cursor-reviewer-mcp

MCPサーバー「cursor-reviewer」。Claude Code から `cursor.review` ツールを呼び出し、Cursor CLI（GPT‑5）でレビューを実行し、レビューJSONのみを返します。仕様は `1.specs/spec.md`（v3）に準拠しています。

## 概要
- ツール名: `cursor.review`
- 入力: `targets`, `reference`, `review_request`, `timeout_ms`（オプション）, `policy`（予約・null固定）
- 実装: Node.js + TypeScript + MCP SDK（`@modelcontextprotocol/sdk`）
- 実行: `cursor-agent -p --model gpt-5 --output-format json "<プロンプト>"`
- 出力: CursorのJSON出力から `result` を取り出し、再度 JSON.parse したレビューJSONのみを返却
- 監査: `reviews/YYYYMMDD-HHMMSS.json` にレビューJSONを保存

## ディレクトリ構成
```
.
├─ bin/
│  └─ cursor-reviewer-mcp        # 実行バイナリ（ビルド済みdistを起動）
├─ src/
│  ├─ server.ts                  # MCPサーバー本体（stdio）
│  ├─ cursor.ts                  # Cursor CLI 呼び出し・再試行・パース
│  ├─ prompt/
│  │  └─ template.txt            # Cursorに渡すプロンプトテンプレート
│  └─ schemas/
│     └─ cursor.review.input.schema.json
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
- 通常は不要です。`cursor-agent` が既にローカル設定済みであれば、環境変数は不要です。
- 特殊な環境（CI 等）で `cursor-agent` が環境変数経由の認証を要求する場合のみ、`CURSOR_API_KEY` を設定してください。

## ツール仕様（要点）
- 入力スキーマは `src/schemas/cursor.review.input.schema.json` に定義。
- `targets[].path` が存在しない場合はエラーを返却。
- Cursor出力のトップレベルJSONから `result` を取り出し、さらに JSON.parse（失敗時1回だけ再実行）。
- 各実行のレビューJSONは `reviews/` にタイムスタンプ名で保存。

## 注意
- このリポジトリにはSDK等の依存は含まれていません。`npm i` で取得してください。
- Cursor CLI（`cursor-agent`）がPATHに存在する必要があります。

## ライセンス
- 本リポジトリは MIT License です。詳細は `LICENSE` を参照してください。
