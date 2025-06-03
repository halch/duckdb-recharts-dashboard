# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude への指示内容

### 目的

BigQueryのデータを用いたインタラクティブな分析ダッシュボードのローカルサンプルを構築します。特に、スマートフォンでの動作を想定し、高速なデータロードと表示を重視します。

### 構成の概要

Next.jsアプリケーションをベースに、以下のような構成で実装を進めます。

* **データソース:** BigQuery（ただし、サンプルではモックデータまたは既存のParquet/CSVファイルを使用）
* **API:** Next.js API Route (ローカルでParquet/CSVファイルを配信)
* **クライアントサイドデータベース:** WebAssembly版DuckDB (`@duckdb/duckdb-wasm`)
* **可視化ライブラリ:** Recharts (Reactコンポーネント)

### 実現したいこと

1.  **データロードの最適化:**
    * Next.jsのAPI RouteがParquet形式のデータを配信する。
    * クライアントサイドのWebAssembly版DuckDBがそのParquetファイルを効率的にロードする。
    * 可能であれば、Web Workerを使用してDuckDBのロードとクエリ実行をメインスレッドからオフロードし、UIの応答性を維持する。
2.  **インタラクティブなデータ分析:**
    * DuckDBにロードされたデータに対して、ユーザーが選択した期間やカテゴリなどでフィルタリングや集計をSQLで実行できる。
3.  **高速なグラフ表示:**
    * DuckDBから取得した集計済みデータ（JSON形式）をRechartsに渡し、動的にグラフを更新する。
    * 複数のグラフ（例: 月別売上、カテゴリ別構成比、推移グラフなど）を表示できる。

### 開発要件

1.  **Next.jsアプリケーションのセットアップ:**
    * 最新のNext.jsプロジェクトをセットアップする。
    * Reactのベストプラクティスに従い、コンポーネントを構成する。
2.  **API Routeの作成:**
    * `pages/api/data.ts` のようなAPI Routeを作成する。
    * このAPI Routeは、**ローカルに用意した小さなParquetファイル**（またはCSVファイル）を読み込み、クライアントからのリクエストに対してそのファイルの内容をHTTPレスポンスとして返す。
    * `Content-Type` ヘッダーを適切に設定する（例: `application/x-parquet` または `text/csv`）。
    * **（重要）** Parquetファイルの生成は、ここでは省略し、既存のファイルを配信する前提とする。もしClaudeがParquetファイルをNode.jsで生成するサンプルを提供できる場合は、それも歓迎する。
3.  **クライアントサイド (Reactコンポーネント) の実装:**
    * **DuckDBのロードと初期化:**
        * `@duckdb/duckdb-wasm` を使用してDuckDBインスタンスを初期化する。
        * API Routeから取得したParquetファイルをDuckDBにロードする。
        * **Web Workerを使った非同期処理**を導入し、UIがフリーズしないようにする。
    * **データクエリと可視化:**
        * ロードされたデータに対してSQLクエリを実行するUI（例: 期間選択、カテゴリフィルタ）と、その結果を表示するRechartsグラフを配置する。
        * クエリ結果をJSON形式で取得し、Rechartsのデータプロパティに渡してグラフを描画する。
    * **Rechartsグラフの例:**
        * 棒グラフ（カテゴリ別の集計値など）
        * 折れ線グラフ（時系列データなど）
        * 円グラフ（構成比など）
4.  **コードの簡潔性とコメント:**
    * 各ファイル、特に主要なロジックには適切なコメントを記述する。
    * 無駄なコードを省き、読みやすいコードを心がける。

### サンプルデータ

BigQueryの代わりとなる、以下のようなシンプルなモックデータ（ParquetまたはCSV形式）を想定します。

| date       | category | value |
| :--------- | :------- | :---- |
| 2023-01-01 | A        | 100   |
| 2023-01-01 | B        | 150   |
| 2023-01-02 | A        | 120   |
| 2023-01-02 | C        | 80    |
| ...        | ...      | ...   |

### 成果物

* ローカルで実行可能なNext.jsプロジェクト (`npm run dev`)
* 必要なnpmパッケージのインストール手順
* 主要なファイルのコード (`pages/api/data.ts`, `components/Dashboard.tsx` など)
* Web Workerの実装例
