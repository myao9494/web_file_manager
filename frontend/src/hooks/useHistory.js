import { useState, useCallback, useEffect } from 'react';

/**
 * 履歴管理用のカスタムフック
 * @param {number} maxHistory - 保存する履歴の最大数
 * @returns {Object} - 履歴操作用のメソッド
 */
export const useHistory = (maxHistory = 50) => {
  // 履歴の状態管理
  const [history, setHistory] = useState([]);
  // 現在の履歴位置
  const [currentIndex, setCurrentIndex] = useState(-1);

  // デバッグ用：状態変更時にログ出力
  useEffect(() => {
    console.log('History state updated:', { history, currentIndex });
  }, [history, currentIndex]);

  // 新しいパスを履歴に追加
  const addToHistory = useCallback((path) => {
    console.log('Adding to history:', path, 'Current index:', currentIndex, 'Current history:', history);
    
    setHistory(prevHistory => {
      // 現在位置が履歴の最後でない場合、現在位置以降の履歴を削除
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      console.log('Trimmed history:', newHistory);
      
      // 直前のパスと同じ場合は追加しない
      if (newHistory.length > 0 && newHistory[newHistory.length - 1] === path) {
        console.log('Path is the same as the last one, not adding');
        return prevHistory;
      }
      
      // 新しいパスを追加
      const updatedHistory = [...newHistory, path];
      console.log('Updated history:', updatedHistory);
      
      // 最大履歴数を超える場合は古い履歴を削除
      if (updatedHistory.length > maxHistory) {
        const trimmedHistory = updatedHistory.slice(updatedHistory.length - maxHistory);
        console.log('Trimmed history to max size:', trimmedHistory);
        return trimmedHistory;
      }
      
      return updatedHistory;
    });
    
    setCurrentIndex(prev => {
      // 現在の履歴の長さを取得
      const newIndex = prev + 1;
      console.log('Setting new current index:', newIndex);
      return newIndex;
    });
  }, [currentIndex, history, maxHistory]);

  // 履歴を戻る（Cmd+Z）
  const goBack = useCallback(() => {
    console.log('Attempting to go back. Current index:', currentIndex, 'History:', history);
    
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const prevPath = history[newIndex];
      console.log('Going back to index:', newIndex, 'Path:', prevPath);
      setCurrentIndex(newIndex);
      return prevPath;
    }
    
    console.log('Cannot go back, already at oldest history item');
    return null;
  }, [history, currentIndex]);

  // 履歴を進む（Cmd+Shift+Z）
  const goForward = useCallback(() => {
    console.log('Attempting to go forward. Current index:', currentIndex, 'History length:', history.length);
    
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      const nextPath = history[newIndex];
      console.log('Going forward to index:', newIndex, 'Path:', nextPath);
      setCurrentIndex(newIndex);
      return nextPath;
    }
    
    console.log('Cannot go forward, already at newest history item');
    return null;
  }, [history, currentIndex]);

  // 現在のパスを取得
  const getCurrentPath = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex];
    }
    return null;
  }, [history, currentIndex]);

  // 戻る・進むが可能かどうかを確認
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  return {
    addToHistory,
    goBack,
    goForward,
    getCurrentPath,
    canGoBack,
    canGoForward,
    history,
    currentIndex
  };
};
