# build-and-iterate

許可ツール: Read, Write, Edit, Grep, Glob, mcp__cursor-reviewer__cursor.review

目的: 成果物を生成/修正し、`cursor.review` を呼び出して LGTM になるまで反復。

擬似手順:
1. 初期生成/更新: 指定 `targets` を作成/更新。
2. レビュー呼出し: `res = /mcp__cursor-reviewer__cursor.review { targets, reference, review_request, timeout_ms }`
3. 判定: `res.lgtm && res.status == "approve"` → 完了。
4. 修正: `res.must_fixes` を最小差分で適用（`patch` が安全なら適用、無ければ `instruction` ベース）。
5. 再レビュー: 2) に戻る（`MAX_ITERS` 既定 5、超過で abort 理由を `reviews/fixer_log.md` に保存）。

注意:
- JSON以外が混入したらプロンプトで「JSONのみ」を再強調し再試行。
- 監査目的で各反復のレビューJSONを `reviews/` に保存。

