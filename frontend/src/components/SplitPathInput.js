import React, { useState } from 'react';
import { Grid, TextField, IconButton, InputAdornment } from '@mui/material';
import { Folder, ArrowUpward } from '@mui/icons-material';

export const SplitPathInput = ({ leftPath, rightPath, onPathChange }) => {
  const [leftInputPath, setLeftInputPath] = useState(leftPath);
  const [rightInputPath, setRightInputPath] = useState(rightPath);

  // 左側のパス入力処理
  const handleLeftPathChange = (e) => {
    setLeftInputPath(e.target.value);
  };

  // 右側のパス入力処理
  const handleRightPathChange = (e) => {
    setRightInputPath(e.target.value);
  };

  // 左側のパス確定処理
  const handleLeftPathSubmit = (e) => {
    if (e.key === 'Enter') {
      onPathChange(leftInputPath, 'left');
    }
  };

  // 右側のパス確定処理
  const handleRightPathSubmit = (e) => {
    if (e.key === 'Enter') {
      onPathChange(rightInputPath, 'right');
    }
  };

  // 親ディレクトリへ移動（左側）
  const navigateToParentLeft = () => {
    const separator = leftPath.includes('\\') ? '\\' : '/';
    const parentPath = leftPath.split(separator).slice(0, -1).join(separator);
    if (parentPath || separator === '/') {
      onPathChange(parentPath || '/', 'left');
      setLeftInputPath(parentPath || '/');
    }
  };

  // 親ディレクトリへ移動（右側）
  const navigateToParentRight = () => {
    const separator = rightPath.includes('\\') ? '\\' : '/';
    const parentPath = rightPath.split(separator).slice(0, -1).join(separator);
    if (parentPath || separator === '/') {
      onPathChange(parentPath || '/', 'right');
      setRightInputPath(parentPath || '/');
    }
  };

  // パスの更新を反映
  React.useEffect(() => {
    setLeftInputPath(leftPath);
  }, [leftPath]);

  React.useEffect(() => {
    setRightInputPath(rightPath);
  }, [rightPath]);

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {/* 左側のパス入力 */}
      <Grid item xs={6}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          label="左側のパス"
          value={leftInputPath}
          onChange={handleLeftPathChange}
          onKeyPress={handleLeftPathSubmit}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Folder />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={navigateToParentLeft}
                  title="親ディレクトリへ"
                >
                  <ArrowUpward />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Grid>

      {/* 右側のパス入力 */}
      <Grid item xs={6}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          label="右側のパス"
          value={rightInputPath}
          onChange={handleRightPathChange}
          onKeyPress={handleRightPathSubmit}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Folder />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={navigateToParentRight}
                  title="親ディレクトリへ"
                >
                  <ArrowUpward />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Grid>
    </Grid>
  );
};
