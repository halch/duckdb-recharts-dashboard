// DuckDB関連の型定義

export interface DuckDBQueryResult {
  [key: string]: any;
}

export interface SalesData {
  date: string;
  category: string;
  value: number;
}

export interface CategoryTotal {
  category: string;
  total_value: number;
}

export interface DailyTotal {
  date: string;
  total: number;
}

export interface TimeSeriesData {
  date: string;
  [category: string]: string | number;
}

export interface UseDuckDBLazyReturn {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
  initialize: () => Promise<void>;
  executeQuery: (sql: string) => Promise<DuckDBQueryResult[]>;
}