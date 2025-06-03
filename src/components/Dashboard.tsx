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
import { useDuckDB } from '../hooks/useDuckDB';

// カテゴリごとの色定義
const COLORS = {
  A: '#8884d8',
  B: '#82ca9d',
  C: '#ffc658'
};

export default function Dashboard() {
  const { isInitialized, isLoading, error, executeQuery } = useDuckDB();
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [dailyTotalData, setDailyTotalData] = useState<any[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' });

  // 初期データロード
  useEffect(() => {
    if (isInitialized) {
      loadAllData();
    }
  }, [isInitialized]);

  // 全データの読み込み
  const loadAllData = async () => {
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
        const dateStr = row.date;
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
          SUM(value) as total_value
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
          SUM(value) as total
        FROM sales_data
        GROUP BY date
        ORDER BY date
      `;
      const dailyData = await executeQuery(dailyQuery);
      setDailyTotalData(dailyData);
      
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  // 期間フィルタの適用
  const applyDateFilter = async () => {
    if (!selectedDateRange.start || !selectedDateRange.end) return;

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
        const dateStr = row.date;
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
          SUM(value) as total_value
        FROM sales_data
        WHERE date >= '${selectedDateRange.start}' 
          AND date <= '${selectedDateRange.end}'
        GROUP BY category
        ORDER BY category
      `;
      const catData = await executeQuery(categoryQuery);
      setCategoryData(catData);

    } catch (err) {
      console.error('Failed to apply filter:', err);
    }
  };

  if (!isInitialized) {
    return <div className="loading">DuckDB初期化中...</div>;
  }

  if (error) {
    return <div className="error">エラー: {error}</div>;
  }

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
          <button onClick={applyDateFilter} disabled={isLoading}>
            フィルタ適用
          </button>
          <button onClick={loadAllData} disabled={isLoading}>
            リセット
          </button>
        </div>
      </div>

      {/* グラフセクション */}
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
                label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
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

      <style jsx>{`
        .dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .loading, .error {
          text-align: center;
          padding: 50px;
          font-size: 18px;
        }

        .error {
          color: #d32f2f;
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