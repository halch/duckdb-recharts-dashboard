// WASMファイルのプリロード管理
export class WASMPreloader {
  private static preloadPromises: Map<string, Promise<void>> = new Map();
  
  // WASMファイルをプリフェッチ（ダウンロードのみ、実行はしない）
  static async prefetchWASM(url: string): Promise<void> {
    if (this.preloadPromises.has(url)) {
      return this.preloadPromises.get(url)!;
    }
    
    const promise = fetch(url, {
      method: 'GET',
      cache: 'force-cache', // ブラウザキャッシュを積極的に使用
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Failed to prefetch ${url}`);
      }
      // レスポンスをキャッシュに保存（実際のデータは読まない）
      return;
    }).catch(error => {
      console.error('Prefetch error:', error);
      // エラーが発生してもアプリケーションは継続
    });
    
    this.preloadPromises.set(url, promise);
    return promise;
  }
  
  // 複数のWASMファイルを並列でプリフェッチ
  static async prefetchAll(): Promise<void> {
    const urls = [
      '/wasm/duckdb-mvp.wasm',
      '/wasm/duckdb-browser-mvp.worker.js',
    ];
    
    await Promise.all(urls.map(url => this.prefetchWASM(url)));
  }
  
  // プリロードリンクをHTMLに追加
  static addPreloadLinks(): void {
    const links = [
      { href: '/wasm/duckdb-mvp.wasm', as: 'fetch' },
      { href: '/wasm/duckdb-browser-mvp.worker.js', as: 'script' },
    ];
    
    links.forEach(({ href, as }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
  
  // リソースヒントを追加（低優先度のプリフェッチ）
  static addResourceHints(): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/wasm/duckdb-mvp.wasm';
    document.head.appendChild(link);
  }
}