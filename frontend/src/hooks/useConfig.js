import { useState, useEffect } from 'react';

export const useConfig = () => {
  const [config, setConfig] = useState({
    defaultPath: '',
    apiUrl: 'http://localhost:8000'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        // 本番環境のビルドファイルからconfigを読み込む
        const response = await fetch('/config.json');
        if (!response.ok) {
          throw new Error('設定ファイルの読み込みに失敗しました');
        }
        const configData = await response.json();
        
        // OSに応じたデフォルトパスの調整
        const isWindows = navigator.platform.indexOf('Win') > -1;
        const defaultPath = isWindows && !configData.defaultPath.includes('\\') 
          ? 'C:\\' 
          : configData.defaultPath;
        
        setConfig({
          ...configData,
          defaultPath
        });
        setLoading(false);
      } catch (err) {
        console.error('設定の読み込みエラー:', err);
        setError(err.message);
        setLoading(false);
        
        // エラー時のフォールバック設定
        const isWindows = navigator.platform.indexOf('Win') > -1;
        setConfig({
          defaultPath: isWindows ? 'C:\\' : '/Users',
          apiUrl: 'http://localhost:8000'
        });
      }
    };

    loadConfig();
  }, []);

  return { config, loading, error };
};
