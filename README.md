# DuckDB Recharts Dashboard

WebAssembly版DuckDBとRechartsを使用したインタラクティブな分析ダッシュボードです。ブラウザ内でSQLクエリを実行し、リアルタイムでデータを可視化します。

## 🚀 特徴

- **高速データ処理**: WebAssembly版DuckDBによるブラウザ内でのSQL分析
- **CDN配信 + SharedArrayBuffer**: jsdelivr CDNからの配信とSharedArrayBufferを両立
- **インタラクティブな可視化**: Rechartsによる動的なグラフ表示（折れ線、棒、円グラフ）
- **期間フィルタ機能**: 選択した期間でのデータ絞り込み
- **レスポンシブデザイン**: スマートフォンでも快適に閲覧可能
- **型安全**: TypeScriptによる堅牢な実装

## 📋 必要要件

- Node.js 16.x 以上
- npm または yarn

## 🛠️ セットアップ

1. リポジトリのクローン:
```bash
git clone https://github.com/halch/duckdb-recharts-dashboard.git
cd duckdb-recharts-dashboard
```

2. 依存関係のインストール:
```bash
npm install
```

3. 開発サーバーの起動:
```bash
npm run dev
```

4. ブラウザで http://localhost:3000 を開く

## 📁 プロジェクト構成

```
├── pages/
│   ├── api/
│   │   └── data.ts              # CSVデータ配信API
│   ├── _app.tsx                 # Next.jsアプリケーション設定
│   ├── index.tsx                # メインページ（通常版）
│   ├── lazy.tsx                 # 遅延読み込み版
│   └── optimized.tsx            # 最適化版（プリフェッチ付き）
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx        # 通常版ダッシュボード
│   │   ├── DashboardLazy.tsx    # 遅延読み込み版ダッシュボード
│   │   ├── DashboardOptimized.tsx # 最適化版ダッシュボード
│   │   └── LoadingOverlay.tsx   # ローディング画面
│   ├── hooks/
│   │   ├── useDuckDB.ts         # 通常版DuckDBフック
│   │   └── useDuckDBLazy.ts     # 遅延読み込み版フック
│   └── lib/
│       ├── duckdb-public.ts     # メインのDuckDB実装
│       ├── duckdb-lazy.ts       # 遅延読み込み版の実装
│       └── preload-wasm.ts      # WASMプリロード機能
├── public/
│   └── data/
│       └── sample-data.csv      # サンプルデータ
├── .eslintrc.json               # ESLint設定
├── .gitignore
├── .prettierrc                  # Prettier設定
├── CLAUDE.md                    # Claude AI用の指示書
├── README.md                    # このファイル
├── next.config.js               # Next.js設定
├── package.json
└── tsconfig.json                # TypeScript設定
```

## 🔧 技術スタック

- **[Next.js](https://nextjs.org/)** 14.1.0 - Reactフレームワーク
- **[TypeScript](https://www.typescriptlang.org/)** 5.3.3 - 型安全な開発
- **[DuckDB WASM](https://duckdb.org/docs/api/wasm/overview)** 1.28.0 - ブラウザ内SQL分析エンジン
- **[Recharts](https://recharts.org/)** 2.10.4 - React用チャートライブラリ
- **[React](https://react.dev/)** 18.2.0 - UIライブラリ

## 💡 実装のポイント

### DuckDB WASM統合
- CDN（jsdelivr）からWASMファイルを自動取得
- COEP: credentiallessヘッダーでCDNリソースとSharedArrayBufferを両立
- `duckdb.createWorker()`メソッドを使用した安定した初期化
- BigInt値を自動的にNumberに変換してRechartsとの互換性を確保
- SQLクエリで明示的な型キャストを使用

### グラフ表示
- **折れ線グラフ**: カテゴリ別の時系列推移
- **棒グラフ**: カテゴリ別合計と日別合計
- **円グラフ**: カテゴリ別構成比

### パフォーマンス最適化
- 動的インポートでSSRを無効化
- データロード状態の管理
- レスポンシブコンテナで各デバイスに最適化

## 📊 サンプルデータ

`public/data/sample-data.csv`に以下の形式のデータが含まれています：

```csv
date,category,value
2023-01-01,A,100
2023-01-01,B,150
2023-01-01,C,80
...
```

## 🚀 使い方

### 利用可能なバージョン

1. **通常版** (`/`) - ページロード時に自動的にDuckDBを初期化
2. **遅延読み込み版** (`/lazy`) - ユーザーアクション後に初期化
3. **最適化版** (`/optimized`) - バックグラウンドでプリフェッチを実行

### 基本的な使い方

1. ダッシュボードが自動的にサンプルデータをロード
2. 期間フィルタで特定の日付範囲を選択可能
3. 各グラフはインタラクティブに更新

## ⚡ パフォーマンス最適化

### 初期ロードの問題と対策

DuckDB WASMファイルは約22MBあり、初期ロードがボトルネックになる可能性があります。

| バージョン | 初期ロード | WASM読み込み | 特徴 |
|-----------|-----------|------------|------|
| 通常版 | 遅い | 自動 | シンプル、社内ツール向け |
| 遅延版 | 高速 | ボタンクリック後 | 初回訪問者向け |
| 最適化版 | 高速 | バックグラウンドプリフェッチ | 最良のUX |

### 最適化技術

1. **遅延読み込み**: ユーザーアクションまでWASMのダウンロードを遅延
2. **プリフェッチ**: ユーザーの行動を予測してバックグラウンドでダウンロード
3. **キャッシュ活用**: ブラウザキャッシュを最大限活用
4. **プログレス表示**: ダウンロード進捗をユーザーに表示

## 📝 スクリプト

```json
{
  "dev": "開発サーバーの起動",
  "build": "本番用ビルド", 
  "start": "本番サーバーの起動",
  "lint": "ESLintの実行"
}
```