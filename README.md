# my-site

チームのお知らせを載せる静的サイト（HTML / CSS / JavaScript のみ、ビルド不要）。

公開 URL：https://ranran-git.github.io/my-site/

> **注意**：このリポジトリとサイトは誰でも閲覧できます（public）。社外秘・個人情報は載せないでください。

## ファイル構成
| ファイル | 内容 |
|---|---|
| `index.html` | ページ本体 |
| `style.css` | 見た目（ダークモード、スマホ対応を含む） |
| `script.js` | お知らせの読み込み・表示、カテゴリ絞り込み、テーマ切り替え |
| `data/news.json` | お知らせのデータ |
| `.github/workflows/notify-slack.yml` | お知らせ追加時に Slack へ通知するワークフロー |
| `.github/scripts/notify-slack.sh` | 上記ワークフローが実行する通知処理 |

## お知らせを追加する
`data/news.json` の配列に 1 件追加して `main` に push する。並び順は自動（新しい順）。

```json
{
  "id": "2026-11-12-01",
  "date": "2026-11-12",
  "category": "お知らせ",
  "title": "タイトル",
  "body": "本文。\n改行も使える。",
  "link": "https://example.com/",
  "linkText": "詳細を見る"
}
```

| 項目 | 必須 | 説明 |
|---|---|---|
| `id` | ○ | お知らせごとに重複しない値。Slack 通知で「新しく追加されたか」の判定に使う。`日付-連番` を推奨 |
| `date` | ○ | `YYYY-MM-DD` 形式。7 日以内のものには「NEW」が付く |
| `title` | ○ | タイトル |
| `category` | | 例：`お知らせ` / `重要` / `イベント` / `メンテナンス`。`重要` は赤で表示。絞り込みボタンはデータから自動で作られる |
| `body` | | 本文 |
| `link` / `linkText` | | 関連リンク（`http` / `https` のみ）と、その表示文字 |

- `date` か `title` が不正なものは表示されない。
- JSON の書式を間違える（末尾のカンマなど）とページ全体が表示できなくなる。push 前に確認すること。

## ローカルで確認する
`index.html` を直接開くとデータを読み込めない（ブラウザの制限）。リポジトリのフォルダで次を実行し、http://localhost:8000/ を開く。

```bash
python3 -m http.server 8000
```

## GitHub Pages の設定
Settings → Pages で、Source を **Deploy from a branch**、Branch を `main` / `/(root)` にする（設定済み）。`main` に push すると数分で反映される。

## Slack 通知
`data/news.json` に新しい `id` のお知らせが追加された push で、Slack にタイトル一覧とサイトへのリンクが投稿される。本文の編集や削除だけの場合は通知しない。

Webhook URL は GitHub の Secrets に保管するため、サイトやリポジトリには公開されない。未設定の間は通知をスキップする（エラーにはならない）。

### 設定手順
1. https://api.slack.com/apps で **Create New App** → **From scratch**。アプリ名とワークスペースを選ぶ。
2. **Incoming Webhooks** を開いて On にし、**Add New Webhook to Workspace** で投稿先チャンネルを選ぶ。ワークスペースの設定によっては管理者の承認が必要。
3. 発行された Webhook URL（`https://hooks.slack.com/services/...`）をコピーする。この URL は秘密情報なので、チャットやファイルに貼らないこと。
4. GitHub の `my-site` で **Settings → Secrets and variables → Actions → New repository secret** を開き、Name を `SLACK_WEBHOOK_URL`、Secret に 3. の URL を入れて保存する。
