import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useConfig } from './useConfig';

export const useSplitFileManager = () => {
  const { config, loading: configLoading } = useConfig();
  const [leftFiles, setLeftFiles] = useState([]);
  const [rightFiles, setRightFiles] = useState([]);
  const [leftPath, setLeftPath] = useState('');
  const [rightPath, setRightPath] = useState('');
  const [leftDepth, setLeftDepth] = useState(1);
  const [rightDepth, setRightDepth] = useState(1);
  const [loading, setLoading] = useState(false);
  const [leftShowFolders, setLeftShowFolders] = useState(true);
  const [rightShowFolders, setRightShowFolders] = useState(true);
  const [leftExtensionFilter, setLeftExtensionFilter] = useState('');
  const [rightExtensionFilter, setRightExtensionFilter] = useState('');

  // 初期パスの設定
  useEffect(() => {
    if (configLoading || !config.defaultPath) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const pathFromUrl = urlParams.get('path');
    const leftPathFromUrl = urlParams.get('leftPath');
    const rightPathFromUrl = urlParams.get('rightPath');
    
    // 左側のパス設定
    if (leftPathFromUrl) {
      setLeftPath(leftPathFromUrl);
    } else if (pathFromUrl) {
      // pathパラメータがあればそれを左側に設定
      setLeftPath(pathFromUrl);
    } else {
      setLeftPath(config.defaultPath);
    }

    // 右側のパス設定
    if (rightPathFromUrl) {
      setRightPath(rightPathFromUrl);
    } else if (pathFromUrl) {
      // pathパラメータがあればそれを右側にも設定
      setRightPath(pathFromUrl);
    } else {
      setRightPath(config.defaultPath);
    }
    
    // URLパラメータを更新
    if (leftPathFromUrl || rightPathFromUrl) {
      // pathパラメータを削除して分割ビューに統一
      urlParams.delete('path');
      if (leftPathFromUrl) urlParams.set('leftPath', leftPathFromUrl);
      if (rightPathFromUrl) urlParams.set('rightPath', rightPathFromUrl);
      window.history.replaceState({}, '', `?${urlParams.toString()}`);
    }
  }, [config.defaultPath, configLoading]);

  // ファイルの読み込み
  const loadFiles = useCallback(async (path, side) => {
    if (!path) return;
    
    try {
      setLoading(true);
      const currentFilter = side === 'left' ? leftExtensionFilter : rightExtensionFilter;
      const currentDepth = side === 'left' ? leftDepth : rightDepth;
      const response = await axios.get(
        `${config.apiUrl}/view_file?file_path=${encodeURIComponent(path)}&depth=${currentDepth}&extensions=${encodeURIComponent(currentFilter)}`
      );
      
      if (side === 'left') {
        setLeftFiles(response.data);
      } else {
        setRightFiles(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error(`Error loading files for ${side} side:`, error);
      setLoading(false);
    }
  }, [config.apiUrl, leftDepth, rightDepth, leftExtensionFilter, rightExtensionFilter]);

  // パスが変更されたときにファイルを読み込む
  useEffect(() => {
    if (leftPath) {
      loadFiles(leftPath, 'left');
    }
  }, [leftPath, leftDepth, leftExtensionFilter, loadFiles]);

  useEffect(() => {
    if (rightPath) {
      loadFiles(rightPath, 'right');
    }
  }, [rightPath, rightDepth, rightExtensionFilter, loadFiles]);

  // ファイルリストの更新
  const refreshFiles = useCallback(() => {
    if (leftPath) loadFiles(leftPath, 'left');
    if (rightPath) loadFiles(rightPath, 'right');
  }, [leftPath, rightPath, loadFiles]);

  // アイテムクリック時の処理
  const handleItemClick = useCallback((item, side) => {
    if (item.is_dir) {
      if (side === 'left') {
        setLeftPath(item.path);
        // URLパラメータを更新
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('leftPath', item.path);
        window.history.pushState({}, '', `?${urlParams.toString()}`);
      } else {
        setRightPath(item.path);
        // URLパラメータを更新
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('rightPath', item.path);
        window.history.pushState({}, '', `?${urlParams.toString()}`);
      }
    } else {
      console.log(`File clicked on ${side} side:`, item.path);
      // ファイルクリック時の処理（必要に応じて実装）
    }
  }, []);

  // パス変更処理
  const handlePathChange = useCallback((newPath, side) => {
    if (side === 'left') {
      setLeftPath(newPath);
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('leftPath', newPath);
      window.history.pushState({}, '', `?${urlParams.toString()}`);
    } else {
      setRightPath(newPath);
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('rightPath', newPath);
      window.history.pushState({}, '', `?${urlParams.toString()}`);
    }
  }, []);

  // フィルタークリック時の処理
  const handleFilterClick = useCallback((filter, side) => {
    if (side === 'left') {
      setLeftExtensionFilter(prev => prev === filter ? '' : filter);
    } else if (side === 'right') {
      setRightExtensionFilter(prev => prev === filter ? '' : filter);
    }
  }, []);

  // 検索機能
  const handleSearch = useCallback((searchTerm, isRegex, side) => {
    if (!searchTerm) {
      if (side === 'left' || !side) {
        loadFiles(leftPath, 'left');
      }
      if (side === 'right' || !side) {
        loadFiles(rightPath, 'right');
      }
      return;
    }

    let searchRegex;
    try {
      searchRegex = isRegex ? new RegExp(searchTerm) : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    } catch (e) {
      console.error('Invalid regex pattern:', e);
      return;
    }

    if (side === 'left' || !side) {
      setLeftFiles(prevFiles => {
        return prevFiles.filter(item => {
          return searchRegex.test(item.name);
        });
      });
    }

    if (side === 'right' || !side) {
      setRightFiles(prevFiles => {
        return prevFiles.filter(item => {
          return searchRegex.test(item.name);
        });
      });
    }
  }, [leftPath, rightPath, loadFiles]);

  // フォルダ表示設定の切り替え
  const toggleShowFolders = useCallback((side) => {
    if (side === 'left') {
      setLeftShowFolders(prev => !prev);
    } else if (side === 'right') {
      setRightShowFolders(prev => !prev);
    }
  }, []);

  // 階層の深さを変更
  const handleDepthChange = useCallback((change, side) => {
    if (side === 'left') {
      setLeftDepth(prev => Math.max(1, prev + change));
    } else if (side === 'right') {
      setRightDepth(prev => Math.max(1, prev + change));
    }
  }, []);

  return {
    leftFiles,
    rightFiles,
    leftPath,
    rightPath,
    leftDepth,
    rightDepth,
    loading,
    leftShowFolders,
    rightShowFolders,
    leftExtensionFilter,
    rightExtensionFilter,
    handleItemClick,
    handlePathChange,
    handleDepthChange,
    toggleShowFolders,
    handleFilterClick,
    handleSearch,
    refreshFiles
  };
};
