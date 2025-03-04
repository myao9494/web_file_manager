import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Divider, CircularProgress, Button } from '@mui/material';
import { ViewColumn, ViewList } from '@mui/icons-material';
import { useFileManager } from './hooks/useFileManager';
import { useSplitFileManager } from './hooks/useSplitFileManager';
import { useConfig } from './hooks/useConfig';
import { SearchBar } from './components/SearchBar';
import { SplitSearchBar } from './components/SplitSearchBar';
import { FileList } from './components/FileList';
import { FilterButtons } from './components/FilterButtons';
import { DepthControl } from './components/DepthControl';
import { PathInput } from './components/PathInput';
import { SplitPathInput } from './components/SplitPathInput';
import { SplitView } from './components/SplitView';
import { FILTER_BUTTONS } from './constants/filterButtons';

function App() {
  const { loading: configLoading, error: configError } = useConfig();
  

  
  // URLパラメータに基づいてビューモードを設定
  const determineInitialViewMode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path');
    const leftPath = urlParams.get('leftPath');
    const rightPath = urlParams.get('rightPath');
    
    // leftPathとrightPathの両方が指定されている場合は分割ビュー
    if (leftPath && rightPath) {
      return 'split';
    }
    // pathが指定されている場合は単一ビュー
    else if (path) {
      return 'single';
    }
    // デフォルトは分割ビュー
    return 'split';
  };
  
  const [viewMode, setViewMode] = useState(determineInitialViewMode()); // 'split' or 'single'
  
  // 通常のファイルマネージャーフック
  const {
    currentPath,
    depth,
    loading: singleLoading,
    showFolders,
    extensionFilter,
    files,
    handleFilterClick,
    handleItemClick: originalHandleSingleItemClick,
    handlePathChange: originalHandleSinglePathChange,
    setDepth,
    setShowFolders,
    separateItems,
    handleSearch
  } = useFileManager();
  


  // 分割ビュー用のフック
  const {
    leftFiles,
    rightFiles,
    leftPath,
    rightPath,
    leftDepth,
    rightDepth,
    loading: splitLoading,
    leftShowFolders,
    rightShowFolders,
    leftExtensionFilter,
    rightExtensionFilter,
    handleItemClick: originalHandleSplitItemClick,
    handlePathChange: originalHandleSplitPathChange,
    handleFilterClick: handleSplitFilterClick,
    handleSearch: handleSplitSearch,
    handleDepthChange,
    toggleShowFolders,
    refreshFiles
  } = useSplitFileManager();
  


  const { directories, files: fileItems } = separateItems(files);
  
  // ビューモード切り替え
  const toggleViewMode = () => {
    setViewMode(viewMode === 'split' ? 'single' : 'split');
  };
  

  


  if (configLoading) {
    return (
      <Container>
        <Paper sx={{ margin: '10px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>設定を読み込み中...</Typography>
        </Paper>
      </Container>
    );
  }

  if (configError) {
    return (
      <Container>
        <Paper sx={{ margin: '10px', padding: '20px', bgcolor: '#fff4f4' }}>
          <Typography color="error">設定の読み込みエラー: {configError}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Paper sx={{ margin: '10px', padding: '10px', height: 'calc(100% - 20px)' }}>
        {/* ビューモード切り替えボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            size="small"
            onClick={toggleViewMode}
            startIcon={viewMode === 'split' ? <ViewList /> : <ViewColumn />}
          >
            {viewMode === 'split' ? '単一ビュー' : '分割ビュー'}
          </Button>
        </Box>

        {viewMode === 'split' ? (
          // 分割ビュー
          <>
            <SplitPathInput 
              leftPath={leftPath} 
              rightPath={rightPath} 
              onPathChange={originalHandleSplitPathChange} 
            />

            <SplitSearchBar onSearch={handleSplitSearch} />
            <Divider sx={{ my: 2 }} />
            
            {/* 分割ビューでは、階層の深さとフォルダ表示設定を個別に管理するため、ここでは使用しない */}

            {splitLoading && <Typography>読み込み中...</Typography>}
            
            <SplitView 
              leftPath={leftPath}
              rightPath={rightPath}
              onPathChange={originalHandleSplitPathChange}
              leftFiles={leftFiles}
              rightFiles={rightFiles}
              handleItemClick={originalHandleSplitItemClick}
              leftShowFolders={leftShowFolders}
              rightShowFolders={rightShowFolders}
              leftExtensionFilter={leftExtensionFilter}
              rightExtensionFilter={rightExtensionFilter}
              leftDepth={leftDepth}
              rightDepth={rightDepth}
              toggleShowFolders={toggleShowFolders}
              handleFilterClick={handleSplitFilterClick}
              handleDepthChange={handleDepthChange}
              refreshFiles={refreshFiles}
            />
          </>
        ) : (
          // 単一ビュー
          <>
            <PathInput currentPath={currentPath} onPathChange={originalHandleSinglePathChange} />

            <SearchBar onSearch={handleSearch} />
            <Divider sx={{ my: 2 }} />
            
            <DepthControl 
              depth={depth} 
              setDepth={setDepth} 
              showFolders={showFolders}
              setShowFolders={setShowFolders}
            />

            <FilterButtons 
              buttons={FILTER_BUTTONS}
              activeFilter={extensionFilter}
              onFilterClick={handleFilterClick}
            />

            {singleLoading && <Typography>読み込み中...</Typography>}
            
            <FileList 
              currentPath={currentPath}
              directories={directories}
              fileItems={fileItems}
              showFolders={showFolders}
              handleItemClick={originalHandleSingleItemClick}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}

export default App;
