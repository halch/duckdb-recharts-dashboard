import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CSVファイルのパスを設定
  const csvPath = path.join(process.cwd(), 'public', 'data', 'sample-data.csv');
  
  try {
    // CSVファイルを読み込む
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    // 適切なヘッダーを設定してCSVデータを返す
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS対応
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error reading CSV file:', error);
    res.status(500).json({ error: 'Failed to read data file' });
  }
}