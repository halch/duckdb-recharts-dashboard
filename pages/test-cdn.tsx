import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

const TestCDNContent = () => {
  const [status, setStatus] = useState('初期化中...');
  const [result, setResult] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState({
    browser: '',
    sharedArrayBuffer: false,
    worker: false,
  });

  useEffect(() => {
    // クライアントサイドでのみデバッグ情報を設定
    setDebugInfo({
      browser: navigator.userAgent,
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      worker: typeof Worker !== 'undefined',
    });

    const testDuckDB = async () => {
      try {
        setStatus('DuckDB WASMモジュールを読み込み中...');
        
        // 動的インポートでDuckDB WASMを読み込む
        const duckdb = await import('@duckdb/duckdb-wasm');
        
        setStatus('CDNバンドルを取得中...');
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        console.log('CDN bundles:', JSDELIVR_BUNDLES);
        
        setStatus('バンドルを選択中...');
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        console.log('Selected bundle:', bundle);
        
        setStatus('Workerを作成中...');
        const worker = await duckdb.createWorker(bundle.mainWorker!);
        console.log('Worker created successfully');
        
        setStatus('DuckDBを初期化中...');
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule!);
        console.log('DuckDB instantiated successfully');
        
        setStatus('接続を作成中...');
        const conn = await db.connect();
        
        setStatus('テストクエリを実行中...');
        const queryResult = await conn.query('SELECT 42 as answer, current_timestamp as time');
        const data = queryResult.toArray();
        
        setResult(data);
        setStatus('成功！');
        
        // クリーンアップ
        await conn.close();
        await db.terminate();
      } catch (error: any) {
        setStatus(`エラー: ${error.message}`);
        console.error('DuckDB test error:', error);
        console.error('Stack trace:', error.stack);
      }
    };

    testDuckDB();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>DuckDB CDN Test</h1>
      <h2>ステータス: {status}</h2>
      {result && (
        <div>
          <h3>クエリ結果:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
        <h3>デバッグ情報:</h3>
        <ul>
          <li>ブラウザ: {debugInfo.browser || 'Loading...'}</li>
          <li>SharedArrayBuffer: {debugInfo.sharedArrayBuffer ? 'サポート' : '非サポート'}</li>
          <li>Worker: {debugInfo.worker ? 'サポート' : '非サポート'}</li>
        </ul>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3>トラブルシューティング:</h3>
        <p>エラーが発生する場合は、ブラウザのコンソールを確認してください。</p>
        <p>COEPヘッダーの問題の場合は、Next.jsサーバーを再起動してください。</p>
      </div>
    </div>
  );
};

// SSRを無効化
const TestCDNPage: NextPage = dynamic(() => Promise.resolve(TestCDNContent), {
  ssr: false,
});

export default TestCDNPage;