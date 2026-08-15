# GA4 設定方針

hiraganaプロジェクトの `shared/analytics.js` と同じ方針で実装している。

## 設定の置き場所

- 測定IDは `index.html` の `window.__GA4_MEASUREMENT_ID__` の1箇所のみに記述する。
- `src/analytics.js` はIDの形式（`G-` から始まる）を検証したうえで `gtag.js` を動的に読み込み、二重読み込みを `data-ga4-loader` 属性で防ぐ。

## プライバシー設定

- `anonymize_ip: true`
- `allow_google_signals: false`
- `allow_ad_personalization_signals: false`
- `send_page_view: false`（自動送信を止め、`trackPageView` で明示的に送る）

## 送信しているイベント

| event_name | 発火タイミング | 代表パラメータ |
| --- | --- | --- |
| page_view | ホーム表示、各ゲーム・レベル表示（`trackPageView`経由） | page_path, page_title |
| game_open | ゲーム・レベル選択時 | game, dan/level |
| game_start | リズムゲーム開始時 | game, dan |
| game_complete | ゲーム終了時 | game, dan/level, correct, total |

## 次に行うべき改善候補

- `game_id` を横断してhiraganaの `docs/ga4-reporting.md` と同じ形式のダッシュボードで比較する。
