// DuckDB WASMのCDNベース実装
let db: any = null;
let conn: any = null;

// グローバルなDuckDBオブジェクトを使用
declare global {
  interface Window {
    duckdb: any;
  }
}

// DuckDBの初期化（CDN版）
export async function initializeDuckDB() {
  if (db) return db;
  
  try {
    // DuckDB WASMをCDNから読み込み
    if (!window.duckdb) {
      // スクリプトを動的に読み込む
      await loadScript('https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@latest/dist/duckdb-browser-mvp.js');
    }
    
    const duckdb = window.duckdb;
    
    // DuckDBの初期化
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    
    conn = await db.connect();
    
    return db;
  } catch (error) {
    console.error('Failed to initialize DuckDB:', error);
    throw error;
  }
}

// スクリプトローダー
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// CSVデータのロード
export async function loadCSVData(csvData: string) {
  if (!db || !conn) {
    await initializeDuckDB();
  }
  
  try {
    // テーブルが存在する場合は削除
    try {
      await conn.query(`DROP TABLE IF EXISTS sales_data`);
    } catch (e) {
      // テーブルが存在しない場合は無視
    }
    
    // CSVデータを登録
    await db.registerFileText('data.csv', csvData);
    
    // テーブル作成
    await conn.query(`
      CREATE TABLE sales_data AS 
      SELECT 
        date,
        category,
        CAST(value AS INTEGER) as value
      FROM read_csv_auto('data.csv', header=true)
    `);
    
    const result = await conn.query(`SELECT COUNT(*) as count FROM sales_data`);
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