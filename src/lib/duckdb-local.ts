import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// DuckDBの初期化（ローカルWorker版）
export async function initializeDuckDB() {
  if (db) return db;
  
  try {
    // WASMファイルをCDNから取得
    const wasmUrl = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-mvp.wasm';
    const wasmResponse = await fetch(wasmUrl);
    const wasmBuffer = await wasmResponse.arrayBuffer();
    
    // ローカルのWorkerプロキシを使用
    const workerUrl = '/api/duckdb-worker';
    const workerBlob = await fetch(workerUrl).then(r => r.blob());
    const workerBlobUrl = URL.createObjectURL(workerBlob);
    
    // Workerを作成
    const worker = new Worker(workerBlobUrl);
    const logger = new duckdb.ConsoleLogger();
    
    // DuckDBインスタンスを作成
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(wasmBuffer);
    
    // 接続を作成
    conn = await db.connect();
    
    // Blob URLをクリーンアップ
    URL.revokeObjectURL(workerBlobUrl);
    
    return db;
  } catch (error) {
    console.error('Failed to initialize DuckDB:', error);
    throw error;
  }
}

// CSVデータのロード
export async function loadCSVData(csvData: string) {
  if (!db || !conn) {
    await initializeDuckDB();
  }
  
  try {
    // テーブルが存在する場合は削除
    try {
      await conn!.query(`DROP TABLE IF EXISTS sales_data`);
    } catch (e) {
      // テーブルが存在しない場合は無視
    }
    
    // DuckDBの仮想ファイルシステムにCSVデータを登録
    await db!.registerFileText('data.csv', csvData);
    
    // テーブルを作成
    await conn!.query(`
      CREATE TABLE sales_data AS 
      SELECT 
        date,
        category,
        CAST(value AS INTEGER) as value
      FROM read_csv_auto('data.csv', header=true)
    `);
    
    // データ件数を確認
    const result = await conn!.query(`SELECT COUNT(*) as count FROM sales_data`);
    const count = result.toArray()[0].count;
    
    return { success: true, count };
  } catch (error) {
    console.error('Failed to load CSV data:', error);
    throw error;
  }
}

// SQLクエリの実行
export async function executeQuery(sql: string) {
  if (!conn) {
    throw new Error('DuckDB connection not initialized');
  }
  
  try {
    const result = await conn.query(sql);
    const data = result.toArray();
    return data;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

// リソースのクリーンアップ
export async function closeDuckDB() {
  if (conn) {
    await conn.close();
    conn = null;
  }
  if (db) {
    await db.terminate();
    db = null;
  }
}