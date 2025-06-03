import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?worker';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// DuckDBの初期化（シンプル版）
export async function initializeDuckDB() {
  if (db) return db;
  
  try {
    const worker = new mvp_worker();
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(duckdb_wasm);
    conn = await db.connect();
    
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
    // データを登録
    await db!.registerFileText('data.csv', csvData);
    
    // テーブル作成
    await conn!.query(`
      CREATE OR REPLACE TABLE sales_data AS 
      SELECT 
        date,
        category,
        CAST(value AS INTEGER) as value
      FROM read_csv_auto('data.csv', header=true)
    `);
    
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
    return result.toArray();
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