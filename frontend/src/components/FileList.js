import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Typography 
} from '@mui/material';
import { Folder, InsertDriveFile } from '@mui/icons-material';
import { DEFAULT_PATH } from '../constants/config';

export const FileList = ({ 
  currentPath, 
  directories, 
  fileItems, 
  showFolders, 
  handleItemClick 
}) => {
  return (
    <List dense sx={{ padding: 0 }}>
      {currentPath !== DEFAULT_PATH && (
        <ListItem 
          button 
          onClick={() => {
            const parentPath = currentPath.split('/').slice(0, -1).join('/');
            handleItemClick({ is_dir: true, path: parentPath });
          }}
        >
          <ListItemIcon>
            <Folder />
          </ListItemIcon>
          <ListItemText primary=".." />
        </ListItem>
      )}

      {showFolders && directories.length > 0 && (
        <>
          <Typography 
            variant="subtitle1" 
            sx={{ marginTop: '10px', marginBottom: '5px' }}
          >
            フォルダ
          </Typography>
          {directories.map((item, index) => (
            <ListItem 
              key={index} 
              button 
              onClick={() => handleItemClick(item)}
            >
              <ListItemIcon>
                <Folder />
              </ListItemIcon>
              <ListItemText 
                primary={item.relative_path}
                secondary={`${item.children_count || 0} items`}
                sx={{ 
                  paddingLeft: `${item.depth * 20}px`,
                  '& .MuiListItemText-primary': {
                    fontFamily: 'monospace'
                  }
                }}
              />
            </ListItem>
          ))}
        </>
      )}

      {fileItems.length > 0 && (
        <>
          <Typography 
            variant="subtitle1" 
            sx={{ marginTop: '10px', marginBottom: '5px' }}
          >
            ファイル
          </Typography>
          {fileItems.map((item, index) => (
            <ListItem 
              key={index} 
              button 
              onClick={() => handleItemClick(item)}
            >
              <ListItemIcon>
                <InsertDriveFile />
              </ListItemIcon>
              <ListItemText 
                primary={item.relative_path}
                sx={{ 
                  paddingLeft: `${item.depth * 20}px`,
                  '& .MuiListItemText-primary': {
                    fontFamily: 'monospace'
                  }
                }}
              />
            </ListItem>
          ))}
        </>
      )}
    </List>
  );
};