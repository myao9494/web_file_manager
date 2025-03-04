import React, { useState, useCallback } from 'react';
import { Grid, Paper, Typography, Divider, Snackbar, Alert, Box, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { FileList } from './FileList';
import { FilterButtons } from './FilterButtons';
import { useConfig } from '../hooks/useConfig';
import { FILTER_BUTTONS } from '../constants/filterButtons';
import axios from 'axios';

export const SplitView = ({ 
  leftPath, 
  rightPath,
  onPathChange,
  leftFiles,
  rightFiles,
  handleItemClick,
  leftShowFolders,
  rightShowFolders,
  leftExtensionFilter,
  rightExtensionFilter,
  leftDepth,
  rightDepth,
  toggleShowFolders,
  handleFilterClick,
  handleDepthChange,
  refreshFiles
}) => {
  const { config } = useConfig();
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // 左右のファイルリストを分離
  const separateItems = (items) => {
    const directories = items.filter(item => item.is_dir);
    const files = items.filter(item => !item.is_dir);
    return { directories, files };
  };

  const { directories: leftDirectories, files: leftFileItems } = separateItems(leftFiles || []);
  const { directories: rightDirectories, files: rightFileItems } = separateItems(rightFiles || []);

  // ドラッグ開始時の処理
  const handleDragStart = useCallback((e, item, sourceSide) => {
    // Set the data for the drag operation
    e.dataTransfer.setData('application/json', JSON.stringify({
      item,
      sourceSide
    }));
    
    // Update the state to track what's being dragged
    setDraggedItem({ item, sourceSide });
    
    // Set the drag effect to 'move'
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // ドラッグオーバー時の処理
  const handleDragOver = useCallback((e, targetSide) => {
    e.preventDefault();
    if (draggedItem && draggedItem.sourceSide !== targetSide) {
      setDropTarget(targetSide);
    }
  }, [draggedItem]);

  // ドロップ時の処理
  const handleDrop = useCallback(async (e, targetSide, targetPath) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { item, sourceSide } = data;
      
      if (sourceSide === targetSide) {
        return; // 同じサイドへのドロップは無視
      }

      // 移動先のパスを構築
      // targetPathがフォルダのパスの場合、そのフォルダ内に移動する
      let destinationPath = targetPath;
      
      // APIを呼び出してファイルを移動
      await axios.post(`${config.apiUrl}/move-item`, {
        source_path: item.path,
        destination_path: destinationPath
      });

      // 成功通知
      setNotification({
        open: true,
        message: `${item.relative_path}を移動しました`,
        severity: 'success'
      });

      // ファイルリストを更新 - 必ず両方のパネルを更新
      refreshFiles();
      
      // キャッシュをクリアするために少し遅延させて再度更新
      setTimeout(() => {
        refreshFiles();
      }, 500);
    } catch (error) {
      console.error('ファイル移動エラー:', error);
      setNotification({
        open: true,
        message: `エラー: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setDraggedItem(null);
      setDropTarget(null);
    }
  }, [config.apiUrl, refreshFiles]);

  // 通知を閉じる
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // ドラッグ可能なファイルリストアイテムをレンダリング
  const renderDraggableFileList = (
    currentPath, 
    directories, 
    fileItems, 
    side,
    showFolders
  ) => {
    return (
      <div
        onDragOver={(e) => handleDragOver(e, side)}
        onDrop={(e) => handleDrop(e, side, currentPath)}
        style={{ 
          height: '100%', 
          backgroundColor: dropTarget === side ? 'rgba(0, 0, 255, 0.05)' : 'transparent',
          transition: 'background-color 0.3s'
        }}
      >
        <FileList
          currentPath={currentPath}
          directories={directories}
          fileItems={fileItems}
          showFolders={showFolders}
          handleItemClick={(item) => handleItemClick(item, side)}
          draggable={true}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sourceSide={side}
        />
      </div>
    );
  };

  return (
    <>
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 250px)', flexGrow: 1 }}>
        {/* 左側のファイルリスト */}
        <Grid item xs={6}>
          <Paper 
            sx={{ 
              p: 2, 
              height: '100%', 
              overflow: 'auto',
              border: dropTarget === 'left' ? '2px dashed blue' : '1px solid #ddd',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {leftPath}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    階層: {leftDepth}
                  </Typography>
                  <IconButton
                    onClick={() => handleDepthChange(-1, 'left')}
                    disabled={leftDepth <= 1}
                    size="small"
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDepthChange(1, 'left')}
                    size="small"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={leftShowFolders}
                      onChange={() => toggleShowFolders('left')}
                      size="small"
                    />
                  }
                  label="フォルダを表示"
                  sx={{ marginRight: 0 }}
                />
              </Box>
            </Box>
            <FilterButtons 
              buttons={FILTER_BUTTONS}
              activeFilter={leftExtensionFilter}
              onFilterClick={(filter) => handleFilterClick(filter, 'left')}
              sx={{ mb: 1 }}
            />
            <Divider sx={{ mb: 2 }} />
            {renderDraggableFileList(leftPath, leftDirectories, leftFileItems, 'left', leftShowFolders)}
          </Paper>
        </Grid>
        
        {/* 右側のファイルリスト */}
        <Grid item xs={6}>
          <Paper 
            sx={{ 
              p: 2, 
              height: '100%', 
              overflow: 'auto',
              border: dropTarget === 'right' ? '2px dashed blue' : '1px solid #ddd',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {rightPath}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    階層: {rightDepth}
                  </Typography>
                  <IconButton
                    onClick={() => handleDepthChange(-1, 'right')}
                    disabled={rightDepth <= 1}
                    size="small"
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDepthChange(1, 'right')}
                    size="small"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rightShowFolders}
                      onChange={() => toggleShowFolders('right')}
                      size="small"
                    />
                  }
                  label="フォルダを表示"
                  sx={{ marginRight: 0 }}
                />
              </Box>
            </Box>
            <FilterButtons 
              buttons={FILTER_BUTTONS}
              activeFilter={rightExtensionFilter}
              onFilterClick={(filter) => handleFilterClick(filter, 'right')}
              sx={{ mb: 1 }}
            />
            <Divider sx={{ mb: 2 }} />
            {renderDraggableFileList(rightPath, rightDirectories, rightFileItems, 'right', rightShowFolders)}
          </Paper>
        </Grid>
      </Grid>

      {/* 通知 */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};
