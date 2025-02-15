import React from 'react';
import { Box, Button } from '@mui/material';

export const FilterButtons = ({ buttons, activeFilter, onFilterClick }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: 1, 
      mb: 2 
    }}>
      {buttons.map((btn, index) => (
        <Button
          key={index}
          variant={activeFilter === btn.filter ? "contained" : "outlined"}
          size="small"
          onClick={() => onFilterClick(btn.filter)}
          sx={{ 
            textTransform: 'none',
            minWidth: 'auto'
          }}
        >
          {btn.label}
        </Button>
      ))}
    </Box>
  );
};