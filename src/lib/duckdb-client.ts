import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// DuckDBの初期化
export async function initializeDuckDB() {
  if (db) return db;
  
  try {
    // jsdelivr CDNからバンドルを取得
    const bundles = duckdb.getJsDelivrBundles();
    
    // DuckDBインスタンスを作成
    const logger = new duckdb.ConsoleLogger();
    const worker = await duckdb.createWorker(bundles.mvp.mainWorker!);
    
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundles.mvp.mainModule!);
    
    // 接続を作成
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
    // テーブルが存在する場合は削除
    await conn!.query(`DROP TABLE IF EXISTS sales_data`);
    
    // DuckDBの仮想ファイルシステムにCSVデータを登録
    await db!.registerFileText('/data.csv', csvData);
    
    // テーブルを作成
    await conn!.query(`
      CREATE TABLE sales_data AS 
      SELECT 
        CAST(date AS DATE) as date,
        category,
        CAST(value AS INTEGER) as value
      FROM read_csv_auto('/data.csv', header=true)
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