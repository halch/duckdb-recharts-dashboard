# DuckDB Recharts Dashboard

WebAssembly版DuckDBとRechartsを使用したインタラクティブな分析ダッシュボードのサンプルプロジェクトです。

## 特徴

- **高速データ処理**: WebAssembly版DuckDBによるブラウザ内でのSQL分析
- **Web Worker対応**: メインスレッドをブロックしない非同期データ処理
- **インタラクティブな可視化**: Rechartsによる動的なグラフ表示
- **期間フィルタ機能**: 選択した期間でのデータ絞り込み
- **レスポンシブデザイン**: スマートフォンでも快適に閲覧可能

## セットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 開発サーバーの起動:
```bash
npm run dev
```

3. ブラウザで http://localhost:3000 を開く

## プロジェクト構成

```
├── pages/
│   ├── api/
│   │   └── data.ts         # CSVデータ配信API
│   ├── _app.tsx
│   └── index.tsx           # メインページ
├── src/
│   ├── components/
│   │   └── Dashboard.tsx   # ダッシュボードコンポーネント
│   ├── hooks/
│   │   └── useDuckDB.ts    # DuckDB操作用カスタムフック
│   └── workers/
│       └── duckdb.worker.ts # DuckDB Web Worker
├── public/
│   └── data/
│       └── sample-data.csv  # サンプルデータ
├── package.json
├── tsconfig.json
└── next.config.js
```

## 技術スタック

- **Next.js**: Reactフレームワーク
- **TypeScript**: 型安全な開発
- **DuckDB WASM**: ブラウザ内SQL分析エンジン
- **Recharts**: React用チャートライブラリ
- **Web Workers**: 非同期データ処理

## 実装のポイント

1. **DuckDB Web Worker**: データ処理をバックグラウンドで実行し、UIの応答性を維持
2. **動的インポート**: DuckDBはクライアントサイドでのみ動作するため、SSRを無効化
3. **レスポンシブグラフ**: ResponsiveContainerを使用してモバイル対応