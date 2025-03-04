import React, { useEffect, useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Typography
} from '@mui/material';
import { Folder, InsertDriveFile } from '@mui/icons-material';
import { useConfig } from '../hooks/useConfig';

export const FileList = ({ 
  currentPath, 
  directories, 
  fileItems, 
  showFolders, 
  handleItemClick,
  draggable = false,
  onDragStart = null,
  onDragOver = null,
  onDrop = null,
  sourceSide = null
}) => {
  const { config } = useConfig();
  const [dragOverFolder, setDragOverFolder] = useState(null);
  
  // ドラッグ時のカスタムスタイルを設定する関数
  useEffect(() => {
    // ドラッグ時のスタイルを設定するCSS
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .drag-ghost {
        width: 24px !important;
        height: 24px !important;
        overflow: hidden;
        opacity: 0.7;
        background-color: transparent;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  return (
    <List dense sx={{ padding: 0 }}>
      {currentPath !== config.defaultPath && (
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
              draggable={draggable}
              onDragStart={(e) => {
                if (draggable && onDragStart) {
                  // カスタムドラッグイメージを作成
                  const icon = document.createElement('div');
                  icon.className = 'drag-ghost';
                  icon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>';
                  document.body.appendChild(icon);
                  e.dataTransfer.setDragImage(icon, 12, 12);
                  
                  // 少し遅延させてから要素を削除
                  setTimeout(() => {
                    document.body.removeChild(icon);
                  }, 100);
                  
                  onDragStart(e, item, sourceSide);
                }
              }}
              onDragOver={(e) => {
                if (onDragOver) {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverFolder(item.path);
                  onDragOver(e, sourceSide);
                }
              }}
              onDragLeave={() => {
                setDragOverFolder(null);
              }}
              onDrop={(e) => {
                if (onDrop) {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverFolder(null);
                  onDrop(e, sourceSide, item.path);
                }
              }}
              sx={{
                cursor: draggable ? 'grab' : 'pointer',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                backgroundColor: dragOverFolder === item.path ? 'rgba(0, 0, 255, 0.1)' : 'transparent',
                border: dragOverFolder === item.path ? '1px dashed blue' : 'none',
                transition: 'background-color 0.3s, border 0.3s'
              }}
            >
              <ListItemIcon>
                <Folder />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <>
                    {item.relative_path.split('/').slice(0, -1).join('/')}
                    {item.relative_path.includes('/') && '/'}
                    <span style={{ fontWeight: 'bold', backgroundColor: '#fffde7', padding: '0 4px', borderRadius: '2px' }}>
                      {item.relative_path.split('/').pop()}
                    </span>
                  </>
                }
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
              draggable={draggable}
              onDragStart={(e) => {
                if (draggable && onDragStart) {
                  // カスタムドラッグイメージを作成
                  const icon = document.createElement('div');
                  icon.className = 'drag-ghost';
                  icon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>';
                  document.body.appendChild(icon);
                  e.dataTransfer.setDragImage(icon, 12, 12);
                  
                  // 少し遅延させてから要素を削除
                  setTimeout(() => {
                    document.body.removeChild(icon);
                  }, 100);
                  
                  onDragStart(e, item, sourceSide);
                }
              }}
              sx={{
                cursor: draggable ? 'grab' : 'pointer',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              <ListItemIcon>
                <InsertDriveFile />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <>
                    {item.relative_path.split('/').slice(0, -1).join('/')}
                    {item.relative_path.includes('/') && '/'}
                    <span style={{ fontWeight: 'bold', backgroundColor: '#fffde7', padding: '0 4px', borderRadius: '2px' }}>
                      {item.relative_path.split('/').pop()}
                    </span>
                  </>
                }
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