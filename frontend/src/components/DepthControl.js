import React from 'react';
import { Typography, IconButton, Box } from '@mui/material';

export const DepthControl = ({ depth, setDepth, showFolders, setShowFolders }) => {
  return (
    <Box sx={{ 
      marginBottom: '10px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px' 
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
      <IconButton
        onClick={() => setShowFolders(prev => !prev)}
        sx={{ marginLeft: '10px' }}
      >
        {showFolders ? 'フォルダを隠す' : 'フォルダを表示'}
      </IconButton>
    </Box>
  );
};