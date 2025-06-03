import { useEffect, useState, useCallback } from 'react';
import { initializeDuckDB, loadCSVData, executeQuery as execQuery, closeDuckDB } from '../lib/duckdb-lazy';

// DuckDBの遅延読み込みフック
export function useDuckDBLazy() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [initStarted, setInitStarted] = useState(false);

  // DuckDBの初期化（ユーザーアクション時に呼び出す）
  const initialize = useCallback(async () => {
    if (isInitialized || initStarted) return;
    
    setInitStarted(true);
    setIsLoading(true);
    setProgress(0);
    
    try {
      // DuckDBを初期化（プログレス付き）
      await initializeDuckDB((p) => setProgress(p));
      
      // CSVデータを取得してロード
      const response = await fetch('/api/data');
      const csvData = await response.text();
      await loadCSVData(csvData);
      
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize DuckDB');
      setInitStarted(false); // エラー時はリセット
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, initStarted]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (isInitialized) {
        closeDuckDB();
      }
    };
  }, [isInitialized]);

  // SQLクエリを実行
  const executeQuery = async (sql: string) => {
    if (!isInitialized) {
      throw new Error('DuckDB not initialized');
    }

    setError(null);

    try {
      const result = await execQuery(sql);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query failed';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    progress,
    initialize,
    executeQuery,
  };
}