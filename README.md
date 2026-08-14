# 九九クエスト（仮）

学術的根拠に基づく、レスポンシブな九九学習ゲームです。Vanilla HTML/CSS/JavaScriptで開発します。

## 必要環境

- モダンブラウザ
- 開発時のみ Node.js 20以上

Codex Desktopの同梱Node.jsを自動検出するため、通常PATHにNode.jsがなくても以下を実行できます。

```powershell
.\scripts\dev.cmd
```

表示されたURL（通常は `http://localhost:4173`）をブラウザで開きます。

## コマンド

```powershell
# 開発サーバー
.\scripts\dev.cmd

# 単体テスト
.\scripts\test.cmd
```

Node.jsがPATHにある環境では、次も利用できます。

```text
npm run dev
npm test
```

## 設計原則

- 学習根拠と実装判断は `docs/research.md` で追跡する
- 習熟は即時の得点ではなく、時間を空けた想起で判断する
- 報酬は学習行動を支援し、ミスを罰しない
- 320px幅以上を受け入れ対象とし、キーボードとタッチに対応する
