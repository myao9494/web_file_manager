import React from 'react';
import { Typography, IconButton, Button, Box } from '@mui/material';

export const DepthControl = ({ depth, setDepth, showFolders, setShowFolders }) => {
  return (
    <Box sx={{
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <Typography variant="body1">
        階層の深さ: {depth}
      </Typography>
      <IconButton
        onClick={() => setDepth(prev => Math.max(1, prev - 1))}
        disabled={depth <= 1}
      >
        -
      </IconButton>
      <IconButton
        onClick={() => setDepth(prev => prev + 1)}
      >
        +
      </IconButton>
      <Button
        variant={showFolders ? "contained" : "outlined"}
        size="small"
        onClick={() => setShowFolders(prev => !prev)}
        sx={{
          marginLeft: 'auto',
          textTransform: 'none',
          minWidth: 'auto'
        }}
      >
        {showFolders ? 'フォルダを隠す' : 'フォルダを表示'}
      </Button>
    </Box>
  );
};