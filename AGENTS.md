# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript sources.
  - `server.ts`: MCP stdio server exposing `cursor.review`.
  - `cursor.ts`: calls `cursor-agent`, parses JSON, saves to `reviews/`.
  - `prompt/` and `schemas/`: prompt template and input JSON schema.
- `bin/`: CLI entrypoints.
  - `cursor-reviewer-mcp`: runs built server from `dist/`.
  - `cursor-agent`: local stub of Cursor CLI for dev.
- `dist/`: compiled JS + copied assets (via `scripts/copy-assets.mjs`).
- `reviews/`: timestamped review JSON logs.

## Build, Test, and Development Commands
- `nvm use && npm i`: ensure Node 22 and install deps.
- `npm run build`: compile TypeScript and copy assets to `dist/`.
- `npm run dev`: run server with tsx (no build). Tip: `PATH=$(pwd)/bin:$PATH npm run dev` uses the local `cursor-agent` stub.
- `npm start`: run built server (`node dist/server.js`).
- `npm run typecheck`: strict TS checks without emit.

## Coding Style & Naming Conventions
- Language: TypeScript (ESM), Node `>=22 <23`, strict mode on.
- Indent 2 spaces; keep semicolons; prefer named exports.
- Files: lowercase; hyphenate multi-word scripts (e.g., `copy-assets.mjs`); types/interfaces `PascalCase`, vars/functions `camelCase`.
- Keep schemas and prompt deterministic; update both `src/` and built assets via `npm run build`.

## Testing Guidelines
- No test framework is configured. Validate locally with the stub:
  - `PATH=$(pwd)/bin:$PATH npm run dev` then connect via your MCP client (e.g., Claude Code) or invoke the tool flow defined in `.claude/agents/`.
- If introducing tests, prefer `vitest` with `*.spec.ts` under `src/`; include basic parsing/error-path coverage for `cursor.ts`.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat(cursor-reviewer): ...`, `fix(cursor): ...`, `chore: ...`.
- PRs must include: purpose (what/why), summary of changes, validation steps (commands/output), and any schema/prompt or env var changes.
- Link related issues; attach sample review JSON when relevant.
- Run `npm run typecheck && npm run build` before requesting review; keep diffs minimal and focused.

## Security & Configuration Tips
- Do not commit secrets; `CURSOR_API_KEY` only via env/CI.
- Useful env vars: `REVIEWER_MCP_SCHEMA_PATH`, `REVIEWER_MCP_TEMPLATE_PATH`, `REVIEWER_MCP_ALLOW_PLAINTEXT_FALLBACK` (avoid enabling in prod).
- `.cursor/cli.json` limits CLI permissions—do not widen without discussion.
