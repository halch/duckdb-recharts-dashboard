import { NextApiRequest, NextApiResponse } from 'next';

// DuckDB WorkerをCDNから取得してCORS対応でプロキシ
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const workerUrl = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-mvp.worker.js';
    const response = await fetch(workerUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch worker: ${response.statusText}`);
    }
    
    const workerCode = await response.text();
    
    // 適切なヘッダーを設定
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1年間キャッシュ
    res.status(200).send(workerCode);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
}