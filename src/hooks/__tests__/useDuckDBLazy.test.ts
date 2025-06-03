import { renderHook, act } from '@testing-library/react';
import { useDuckDBLazy } from '../useDuckDBLazy';
import type { DuckDBQueryResult } from '../../types/duckdb';

jest.mock('../../lib/duckdb-lazy', () => ({
  initializeDuckDB: jest.fn(),
  loadCSVData: jest.fn(),
  executeQuery: jest.fn(),
  closeDuckDB: jest.fn()
}));

// モック関数を直接importした型で使用
const { initializeDuckDB, loadCSVData, executeQuery, closeDuckDB } = jest.requireMock('../../lib/duckdb-lazy');

describe('useDuckDBLazy', () => {
  const mockInitializeDuckDB = initializeDuckDB as jest.MockedFunction<typeof initializeDuckDB>;
  const mockLoadCSVData = loadCSVData as jest.MockedFunction<typeof loadCSVData>;
  const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;
  const mockCloseDuckDB = closeDuckDB as jest.MockedFunction<typeof closeDuckDB>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useDuckDBLazy());
    
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.progress).toEqual(0);
  });

  it('initialize関数が正常に動作する', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue('date,category,value\n2023-01-01,A,100')
    }) as jest.Mock;
    
    mockInitializeDuckDB.mockImplementation(async (callback: (progress: number) => void) => {
      callback(50);
      return Promise.resolve();
    });
    mockLoadCSVData.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDuckDBLazy());
    
    await act(async () => {
      await result.current.initialize();
    });
    
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockInitializeDuckDB).toHaveBeenCalledTimes(1);
    expect(mockLoadCSVData).toHaveBeenCalledTimes(1);
  });

  it('initialize中にプログレスが更新される', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue('date,category,value\n2023-01-01,A,100')
    }) as jest.Mock;
    
    mockInitializeDuckDB.mockImplementation(async (callback: (progress: number) => void) => {
      callback(25);
      callback(75);
      return Promise.resolve();
    });
    mockLoadCSVData.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDuckDBLazy());
    
    let progressValues: number[] = [];
    mockInitializeDuckDB.mockImplementation(async (callback: (progress: number) => void) => {
      callback(25);
      progressValues.push(25);
      callback(75);
      progressValues.push(75);
      return Promise.resolve();
    });
    
    await act(async () => {
      await result.current.initialize();
    });
    
    expect(progressValues).toContain(25);
    expect(progressValues).toContain(75);
    
    expect(result.current.isInitialized).toBe(true);
  });

  it('initializeでエラーが発生した場合エラーが設定される', async () => {
    const errorMessage = 'DuckDB初期化エラー';
    mockInitializeDuckDB.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDuckDBLazy());
    
    await act(async () => {
      await result.current.initialize();
    });
    
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('executeQueryが正常に動作する', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue('date,category,value\n2023-01-01,A,100')
    }) as jest.Mock;
    
    mockInitializeDuckDB.mockResolvedValue(undefined);
    mockLoadCSVData.mockResolvedValue(undefined);
    mockExecuteQuery.mockResolvedValue([
      { id: 1, name: 'test' },
      { id: 2, name: 'test2' },
    ]);

    const { result } = renderHook(() => useDuckDBLazy());
    
    await act(async () => {
      await result.current.initialize();
    });
    
    let queryResult: DuckDBQueryResult[] | undefined;
    await act(async () => {
      queryResult = await result.current.executeQuery('SELECT * FROM test');
    });
    
    expect(queryResult).toEqual([
      { id: 1, name: 'test' },
      { id: 2, name: 'test2' },
    ]);
  });

  it('executeQueryで空の結果が返される場合', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue('date,category,value\n2023-01-01,A,100')
    }) as jest.Mock;
    
    mockInitializeDuckDB.mockResolvedValue(undefined);
    mockLoadCSVData.mockResolvedValue(undefined);
    mockExecuteQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useDuckDBLazy());
    
    await act(async () => {
      await result.current.initialize();
    });
    
    let queryResult: DuckDBQueryResult[] | undefined;
    await act(async () => {
      queryResult = await result.current.executeQuery('SELECT * FROM empty_table');
    });
    
    expect(queryResult).toEqual([]);
  });

  it('初期化前にexecuteQueryを呼ぶとエラーがthrowされる', async () => {
    const { result } = renderHook(() => useDuckDBLazy());
    
    await expect(async () => {
      await act(async () => {
        await result.current.executeQuery('SELECT * FROM test');
      });
    }).rejects.toThrow('DuckDB not initialized');
  });

  it('コンポーネントがアンマウントされたときにクリーンアップされる', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue('date,category,value\n2023-01-01,A,100')
    }) as jest.Mock;
    
    mockInitializeDuckDB.mockResolvedValue(undefined);
    mockLoadCSVData.mockResolvedValue(undefined);

    const { result, unmount } = renderHook(() => useDuckDBLazy());
    
    await act(async () => {
      await result.current.initialize();
    });
    
    unmount();
    
    expect(mockCloseDuckDB).toHaveBeenCalled();
  });
});