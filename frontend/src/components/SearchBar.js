import React, { useState } from 'react';
import { TextField, IconButton, Box, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RegexIcon from '@mui/icons-material/Code';

export const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegex, setIsRegex] = useState(false);

  const handleSearch = () => {
    onSearch(searchTerm, isRegex);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <TextField
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="ファイルやフォルダを検索..."
        fullWidth
        sx={{ flexGrow: 1 }}
      />
      <Tooltip title={isRegex ? "正規表現を使用中" : "正規表現を使用"}>
        <IconButton
          onClick={() => setIsRegex(!isRegex)}
          color={isRegex ? "primary" : "default"}
        >
          <RegexIcon />
        </IconButton>
      </Tooltip>
      <IconButton onClick={handleSearch} color="primary">
        <SearchIcon />
      </IconButton>
    </Box>
  );
};
