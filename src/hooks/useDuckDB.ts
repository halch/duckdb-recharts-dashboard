import { useEffect, useState } from 'react';
import { initializeDuckDB, loadCSVData, executeQuery as execQuery, closeDuckDB } from '../lib/duckdb-client';

// DuckDBとの通信フック
export function useDuckDB() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DuckDBの初期化
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        
        // DuckDBを初期化
        await initializeDuckDB();
        
        // CSVデータを取得してロード
        const response = await fetch('/api/data');
        const csvData = await response.text();
        await loadCSVData(csvData);
        
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize DuckDB');
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // クリーンアップ
    return () => {
      closeDuckDB();
    };
  }, []);

  // SQLクエリを実行
  const executeQuery = async (sql: string) => {
    if (!isInitialized) {
      throw new Error('DuckDB not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await execQuery(sql);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    executeQuery,
  };
}