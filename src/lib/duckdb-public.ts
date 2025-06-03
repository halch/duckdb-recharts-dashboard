import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// DuckDBの初期化（CDNから読み込み + SharedArrayBuffer対応）
export async function initializeDuckDB() {
  if (db) return db;
  
  try {
    console.log('Starting DuckDB initialization with CDN...');
    
    // SharedArrayBufferのサポートを確認
    if (typeof SharedArrayBuffer !== 'undefined') {
      console.log('SharedArrayBuffer is supported!');
    } else {
      console.log('SharedArrayBuffer is NOT supported');
    }
    
    // CDNバンドルを取得
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    console.log('CDN bundles:', JSDELIVR_BUNDLES);
    
    // バンドルを選択
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    console.log('Selected bundle:', bundle);
    
    // createWorkerメソッドを使用（CORS対応）
    const worker = await duckdb.createWorker(bundle.mainWorker!);
    console.log('Worker created successfully');
    
    // ロガーを設定
    const logger = new duckdb.ConsoleLogger();
    
    // DuckDBインスタンスを作成
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule!);
    console.log('DuckDB instantiated successfully');
    
    // 接続を作成
    conn = await db.connect();
    console.log('Connection created successfully');
    
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

// BigIntを再帰的にNumberに変換
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }
  
  return obj;
}

// SQLクエリの実行
export async function executeQuery(sql: string) {
  if (!conn) {
    throw new Error('DuckDB connection not initialized');
  }
  
  try {
    const result = await conn.query(sql);
    const data = result.toArray();
    
    // BigIntをNumberに変換（再帰的に）
    const convertedData = convertBigIntToNumber(data);
    
    console.log('Query result sample:', convertedData[0]); // デバッグ用
    
    return convertedData;
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