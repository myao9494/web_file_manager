import React, { useState } from 'react';
import { Grid, TextField, IconButton, InputAdornment, FormControlLabel, Checkbox } from '@mui/material';
import { Search } from '@mui/icons-material';

export const SplitSearchBar = ({ onSearch }) => {
  const [leftSearchTerm, setLeftSearchTerm] = useState('');
  const [rightSearchTerm, setRightSearchTerm] = useState('');
  const [isLeftRegex, setIsLeftRegex] = useState(false);
  const [isRightRegex, setIsRightRegex] = useState(false);

  // 左側の検索
  const handleLeftSearch = () => {
    onSearch(leftSearchTerm, isLeftRegex, 'left');
  };

  // 右側の検索
  const handleRightSearch = () => {
    onSearch(rightSearchTerm, isRightRegex, 'right');
  };

  // 左側の検索キーワード変更
  const handleLeftSearchChange = (e) => {
    setLeftSearchTerm(e.target.value);
    if (e.target.value === '') {
      onSearch('', isLeftRegex, 'left');
    }
  };

  // 右側の検索キーワード変更
  const handleRightSearchChange = (e) => {
    setRightSearchTerm(e.target.value);
    if (e.target.value === '') {
      onSearch('', isRightRegex, 'right');
    }
  };

  // Enterキーでの検索実行
  const handleLeftKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLeftSearch();
    }
  };

  const handleRightKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRightSearch();
    }
  };

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {/* 左側の検索バー */}
      <Grid item xs={6}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="左側の検索..."
          value={leftSearchTerm}
          onChange={handleLeftSearchChange}
          onKeyPress={handleLeftKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton
                  edge="start"
                  onClick={handleLeftSearch}
                  size="small"
                >
                  <Search />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isLeftRegex}
                      onChange={(e) => setIsLeftRegex(e.target.checked)}
                      size="small"
                    />
                  }
                  label="正規表現"
                  sx={{ marginRight: 0 }}
                />
              </InputAdornment>
            )
          }}
        />
      </Grid>

      {/* 右側の検索バー */}
      <Grid item xs={6}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="右側の検索..."
          value={rightSearchTerm}
          onChange={handleRightSearchChange}
          onKeyPress={handleRightKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton
                  edge="start"
                  onClick={handleRightSearch}
                  size="small"
                >
                  <Search />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isRightRegex}
                      onChange={(e) => setIsRightRegex(e.target.checked)}
                      size="small"
                    />
                  }
                  label="正規表現"
                  sx={{ marginRight: 0 }}
                />
              </InputAdornment>
            )
          }}
        />
      </Grid>
    </Grid>
  );
};
