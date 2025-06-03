import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// DuckDB WASMはクライアントサイドでのみ動作するため、SSRを無効化
const DashboardOptimized = dynamic(() => import('../src/components/DashboardOptimized'), {
  ssr: false,
});

const OptimizedPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>DuckDB + Recharts ダッシュボード（最適化版）</title>
        <meta name="description" content="プリフェッチとキャッシュ最適化を実装したバージョン" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <DashboardOptimized />
      </main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          padding: 0;
          margin: 0;
        }

        html,
        body {
          max-width: 100vw;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
          background-color: #fafafa;
        }

        a {
          color: inherit;
          text-decoration: none;
        }
      `}</style>
    </>
  );
};

export default OptimizedPage;