import React from 'react';
import { Container, Paper, Typography, Box, Divider } from '@mui/material';
import { useFileManager } from './hooks/useFileManager';
import { SearchBar } from './components/SearchBar';
import { FileList } from './components/FileList';
import { FilterButtons } from './components/FilterButtons';
import { DepthControl } from './components/DepthControl';
import { PathInput } from './components/PathInput';
import { FILTER_BUTTONS } from './constants/filterButtons';

function App() {
  const {
    currentPath,
    depth,
    loading,
    showFolders,
    extensionFilter,
    files,
    handleFilterClick,
    handleItemClick,
    handlePathChange,
    setDepth,
    setShowFolders,
    separateItems,
    handleSearch
  } = useFileManager();

  const { directories, files: fileItems } = separateItems(files);

  return (
    <Container>
      <Paper sx={{ margin: '10px', padding: '10px' }}>
        <PathInput currentPath={currentPath} onPathChange={handlePathChange} />

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

        {loading && <Typography>読み込み中...</Typography>}
        
        <FileList 
          currentPath={currentPath}
          directories={directories}
          fileItems={fileItems}
          showFolders={showFolders}
          handleItemClick={handleItemClick}
        />
      </Paper>
    </Container>
  );
}

export default App;
