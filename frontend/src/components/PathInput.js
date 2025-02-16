import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';

export const PathInput = ({ currentPath, onPathChange }) => {
  const [inputPath, setInputPath] = useState(currentPath);

  const handleSubmit = (e) => {
    e.preventDefault();
    onPathChange(inputPath);
  };

  React.useEffect(() => {
    setInputPath(currentPath);
  }, [currentPath]);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mb: 2 }}>
      <TextField
        fullWidth
        label="現在のパス"
        value={inputPath}
        onChange={(e) => setInputPath(e.target.value)}
        variant="outlined"
        size="small"
        onBlur={handleSubmit}
      />
    </Box>
  );
};
