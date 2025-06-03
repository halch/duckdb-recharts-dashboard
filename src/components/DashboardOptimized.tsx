import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useDuckDBLazy } from '../hooks/useDuckDBLazy';
import LoadingOverlay from './LoadingOverlay';
import { WASMPreloader } from '../lib/preload-wasm';

// カテゴリごとの色定義
const COLORS = {
  A: '#8884d8',
  B: '#82ca9d',
  C: '#ffc658'
};

export default function DashboardOptimized() {
  const { isInitialized, isLoading, error, progress, initialize, executeQuery } = useDuckDBLazy();
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [dailyTotalData, setDailyTotalData] = useState<any[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);

  // コンポーネントマウント時にWASMファイルをプリフェッチ
  useEffect(() => {
    // ユーザーがページに3秒以上滞在したらプリフェッチ開始
    const timer = setTimeout(() => {
      setIsPrefetching(true);
      WASMPreloader.prefetchAll();
    }, 3000);

    // Intersection Observerでボタンが見えたらプリロード
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isPrefetching) {
          setIsPrefetching(true);
          WASMPreloader.addResourceHints();
        }
      },
      { threshold: 0.1 }
    );

    const startButton = document.querySelector('.start-button');
    if (startButton) {
      observer.observe(startButton);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isPrefetching]);

  // データロード
  const loadAllData = async () => {
    if (!isInitialized) return;
    
    setQueryLoading(true);
    try {
      // 時系列データ（カテゴリ別）
      const timeSeriesQuery = `
        SELECT 
          date,
          category,
          value
        FROM sales_data
        ORDER BY date, category
      `;
      const tsData = await executeQuery(timeSeriesQuery);
      
      // 日別データに変換（横持ち形式）
      const groupedData = tsData.reduce((acc: any, row: any) => {
        const dateStr = new Date(row.date).toISOString().split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = { date: dateStr };
        }
        acc[dateStr][row.category] = row.value;
        return acc;
      }, {});
      
      setTimeSeriesData(Object.values(groupedData));

      // カテゴリ別集計
      const categoryQuery = `
        SELECT 
          category,
          CAST(SUM(value) AS INTEGER) as total_value
        FROM sales_data
        GROUP BY category
        ORDER BY category
      `;
      const catData = await executeQuery(categoryQuery);
      setCategoryData(catData);

      // 日別合計
      const dailyQuery = `
        SELECT 
          date,
          CAST(SUM(value) AS INTEGER) as total
        FROM sales_data
        GROUP BY date
        ORDER BY date
      `;
      const dailyData = await executeQuery(dailyQuery);
      
      // 日付をフォーマット
      const formattedDailyData = dailyData.map(row => ({
        ...row,
        date: new Date(row.date).toISOString().split('T')[0]
      }));
      
      setDailyTotalData(formattedDailyData);
      setDataLoaded(true);
      
    } catch (err) {
      // エラー処理
    } finally {
      setQueryLoading(false);
    }
  };

  // 初期化後にデータをロード
  useEffect(() => {
    if (isInitialized && !dataLoaded) {
      loadAllData();
    }
  }, [isInitialized]);

  // 初期化ボタンのハンドラ
  const handleInitialize = async () => {
    await initialize();
  };

  // 期間フィルタの適用
  const applyDateFilter = async () => {
    if (!selectedDateRange.start || !selectedDateRange.end) return;

    setQueryLoading(true);
    try {
      // フィルタ済み時系列データ
      const filteredQuery = `
        SELECT 
          date,
          category,
          value
        FROM sales_data
        WHERE date >= '${selectedDateRange.start}' 
          AND date <= '${selectedDateRange.end}'
        ORDER BY date, category
      `;
      const filtered = await executeQuery(filteredQuery);
      
      // 日別データに変換
      const groupedData = filtered.reduce((acc: any, row: any) => {
        const dateStr = new Date(row.date).toISOString().split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = { date: dateStr };
        }
        acc[dateStr][row.category] = row.value;
        return acc;
      }, {});
      
      setTimeSeriesData(Object.values(groupedData));

      // フィルタ済みカテゴリ別集計
      const categoryQuery = `
        SELECT 
          category,
          CAST(SUM(value) AS INTEGER) as total_value
        FROM sales_data
        WHERE date >= '${selectedDateRange.start}' 
          AND date <= '${selectedDateRange.end}'
        GROUP BY category
        ORDER BY category
      `;
      const catData = await executeQuery(categoryQuery);
      setCategoryData(catData);

    } catch (err) {
      // エラー処理
    } finally {
      setQueryLoading(false);
    }
  };

  // 初期化前の画面
  if (!isInitialized && !isLoading) {
    return (
      <div className="dashboard-intro">
        <div className="intro-content">
          <h1>DuckDB + Recharts ダッシュボード</h1>
          <p>
            このダッシュボードは、WebAssembly版のDuckDBを使用して
            ブラウザ内でSQLクエリを実行し、データを可視化します。
          </p>
          <div className="features">
            <div className="feature">
              <span className="icon">⚡</span>
              <h3>高速処理</h3>
              <p>WebAssemblyによる高速なデータ処理</p>
            </div>
            <div className="feature">
              <span className="icon">📊</span>
              <h3>インタラクティブ</h3>
              <p>動的なグラフ表示と期間フィルタ</p>
            </div>
            <div className="feature">
              <span className="icon">📱</span>
              <h3>レスポンシブ</h3>
              <p>モバイルデバイスにも最適化</p>
            </div>
          </div>
          <button className="start-button" onClick={handleInitialize}>
            ダッシュボードを開始
          </button>
          <div className="optimization-info">
            {isPrefetching && (
              <p className="prefetch-status">
                ✨ バックグラウンドでリソースを最適化しています...
              </p>
            )}
            <p className="note">
              ※ 初回は約22MBのDuckDB WASMファイルをダウンロードします
            </p>
          </div>
        </div>
        
        <style jsx>{`
          .dashboard-intro {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          }
          
          .intro-content {
            background: white;
            padding: 60px 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 800px;
            width: 100%;
          }
          
          h1 {
            margin: 0 0 20px;
            color: #333;
            font-size: 32px;
          }
          
          p {
            color: #666;
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 40px;
          }
          
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
          }
          
          .feature {
            padding: 20px;
          }
          
          .feature .icon {
            font-size: 48px;
            display: block;
            margin-bottom: 10px;
          }
          
          .feature h3 {
            margin: 0 0 10px;
            color: #333;
            font-size: 20px;
          }
          
          .feature p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }
          
          .start-button {
            background: #1976d2;
            color: white;
            border: none;
            padding: 16px 40px;
            font-size: 18px;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3);
          }
          
          .start-button:hover {
            background: #1565c0;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
          }
          
          .optimization-info {
            margin-top: 20px;
          }
          
          .prefetch-status {
            margin-bottom: 10px;
            color: #4caf50;
            font-size: 14px;
            animation: pulse 2s ease-in-out infinite;
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 0.7;
            }
            50% {
              opacity: 1;
            }
          }
          
          .note {
            font-size: 14px;
            color: #999;
            margin: 0;
          }
          
          @media (max-width: 768px) {
            .intro-content {
              padding: 40px 20px;
            }
            
            h1 {
              font-size: 24px;
            }
            
            p {
              font-size: 16px;
            }
          }
        `}</style>
      </div>
    );
  }

  // ローディング中
  if (isLoading) {
    return <LoadingOverlay progress={progress} message="DuckDBを初期化しています..." />;
  }

  if (error) {
    return <div className="error">エラー: {error}</div>;
  }

  // ダッシュボード本体
  return (
    <div className="dashboard">
      <h1>売上分析ダッシュボード</h1>
      
      {/* フィルタセクション */}
      <div className="filter-section">
        <h2>期間フィルタ</h2>
        <div className="filter-controls">
          <input
            type="date"
            value={selectedDateRange.start}
            onChange={(e) => setSelectedDateRange({ ...selectedDateRange, start: e.target.value })}
          />
          <span>〜</span>
          <input
            type="date"
            value={selectedDateRange.end}
            onChange={(e) => setSelectedDateRange({ ...selectedDateRange, end: e.target.value })}
          />
          <button onClick={applyDateFilter} disabled={queryLoading}>
            フィルタ適用
          </button>
          <button onClick={loadAllData} disabled={queryLoading}>
            リセット
          </button>
        </div>
      </div>

      {/* グラフセクション */}
      {dataLoaded && (
      <div className="charts-grid">
        {/* 時系列グラフ */}
        <div className="chart-container">
          <h2>カテゴリ別売上推移</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="A" stroke={COLORS.A} />
              <Line type="monotone" dataKey="B" stroke={COLORS.B} />
              <Line type="monotone" dataKey="C" stroke={COLORS.C} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* カテゴリ別棒グラフ */}
        <div className="chart-container">
          <h2>カテゴリ別売上合計</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_value">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.category as keyof typeof COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 円グラフ */}
        <div className="chart-container">
          <h2>カテゴリ別構成比</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => {
                  const total = categoryData.reduce((sum, d) => sum + d.total_value, 0);
                  const percent = ((entry.value / total) * 100).toFixed(0);
                  return `${entry.category}: ${percent}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_value"
                nameKey="category"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.category as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 日別合計の棒グラフ */}
        <div className="chart-container">
          <h2>日別売上合計</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyTotalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {queryLoading && (
        <div className="query-loading">データを読み込んでいます...</div>
      )}

      <style jsx>{`
        .dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .error {
          text-align: center;
          padding: 50px;
          font-size: 18px;
          color: #d32f2f;
        }

        .query-loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
        }

        .filter-section {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .filter-section h2 {
          margin-top: 0;
          color: #555;
          font-size: 18px;
        }

        .filter-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        input[type="date"] {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        button {
          padding: 8px 16px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        button:hover {
          background: #1565c0;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 30px;
        }

        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .chart-container h2 {
          margin-top: 0;
          color: #333;
          font-size: 18px;
          text-align: center;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .chart-container {
            min-height: 350px;
          }
        }
      `}</style>
    </div>
  );
}