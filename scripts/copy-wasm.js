const fs = require('fs');
const path = require('path');

// DuckDB WASMファイルをpublicディレクトリにコピー
const sourceDir = path.join(__dirname, '../node_modules/@duckdb/duckdb-wasm/dist');
const targetDir = path.join(__dirname, '../public/wasm');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// コピーするファイル
const files = [
  'duckdb-mvp.wasm',
  'duckdb-browser-mvp.worker.js',
  'duckdb-eh.wasm',
  'duckdb-browser-eh.worker.js'
];

files.forEach(file => {
  const source = path.join(sourceDir, file);
  const target = path.join(targetDir, file);
  
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, target);
    console.log(`Copied ${file}`);
  } else {
    console.warn(`File not found: ${file}`);
  }
});

console.log('WASM files copied successfully!');