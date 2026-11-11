#!/usr/bin/env bash
# data/news.json に追加されたお知らせを Slack に通知する。
# 使い方: notify-slack.sh <変更前のコミット> <変更後のコミット>
# 環境変数:
#   SLACK_WEBHOOK_URL  Slack の Incoming Webhook URL（未設定なら何もしない）
#   SITE_URL           通知に載せるサイトの URL
set -euo pipefail

NEWS_FILE="data/news.json"
SITE_URL="${SITE_URL:-https://ranran-git.github.io/my-site/}"
BEFORE="${1:?変更前のコミットを指定してください}"
AFTER="${2:?変更後のコミットを指定してください}"

if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then
  echo "::notice::SLACK_WEBHOOK_URL が未設定のため、Slack 通知をスキップしました。"
  exit 0
fi

# 変更前のお知らせ（初回 push やファイルが無かった場合は空）
old_json='[]'
if [[ ! "$BEFORE" =~ ^0+$ ]] && git cat-file -e "${BEFORE}:${NEWS_FILE}" 2>/dev/null; then
  old_json="$(git show "${BEFORE}:${NEWS_FILE}")"
fi
new_json="$(git show "${AFTER}:${NEWS_FILE}")"

# 変更前に無かった id のお知らせだけを取り出す
added="$(jq -c --argjson old "$old_json" \
  '[ .[] | select(.id as $id | ($old | any(.[]; .id == $id)) | not) ]' <<<"$new_json")"
count="$(jq 'length' <<<"$added")"

if [ "$count" -eq 0 ]; then
  echo "追加されたお知らせはありません。通知しません。"
  exit 0
fi

# Slack の書式記号（& < >）をエスケープして本文を作る
payload="$(jq -c --arg url "$SITE_URL" '
  def esc: tostring | gsub("&"; "&amp;") | gsub("<"; "&lt;") | gsub(">"; "&gt;");
  { text: (
      "お知らせが \(length) 件追加されました\n"
      + (map("• [\(.category // "お知らせ" | esc)] \(.title | esc)（\(.date | esc)）") | join("\n"))
      + "\n<\($url)|お知らせ一覧を見る>"
  ) }' <<<"$added")"

curl -sS --fail -X POST -H 'Content-Type: application/json' \
  --data "$payload" "$SLACK_WEBHOOK_URL" >/dev/null
echo "Slack に ${count} 件の追加を通知しました。"
