import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DEFAULT_PATH, BASE_API_URL } from '../constants/config';

export const useFileManager = () => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState(DEFAULT_PATH);
  const [depth, setDepth] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFolders, setShowFolders] = useState(true);
  const [extensionFilter, setExtensionFilter] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathFromUrl = urlParams.get('path');
    
    if (pathFromUrl) {
      console.log('Path from URL:', pathFromUrl);
      setCurrentPath(pathFromUrl);
    } else {
      console.log('No path specified in URL, using default path:', currentPath);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [currentPath, depth, extensionFilter]);

  const loadFiles = async () => {
    try {
      console.log('Loading files from:', currentPath);
      setLoading(true);
      const response = await axios.get(
        `${BASE_API_URL}/view_file?file_path=${encodeURIComponent(currentPath)}&depth=${depth}&extensions=${encodeURIComponent(extensionFilter)}`
      );
      setLoading(false);
      console.log('Files loaded:', response.data);
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (item.is_dir) {
      console.log('Directory clicked:', item.path);
      const newPath = item.path;
      setCurrentPath(newPath);
      window.history.pushState({}, '', `?path=${encodeURIComponent(newPath)}`);
    } else {
      console.log('File clicked:', item.path);
    }
  };

  const handleFilterClick = (filter) => {
    setExtensionFilter(filter);
  };

  const separateItems = (items) => {
    const directories = items.filter(item => item.is_dir);
    const files = items.filter(item => !item.is_dir);
    return { directories, files };
  };

  const navigateToParent = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    console.log('Moving to parent directory:', parentPath);
    setCurrentPath(parentPath);
    window.history.pushState({}, '', `?path=${encodeURIComponent(parentPath)}`);
  };

  const handleSearch = useCallback((searchTerm, isRegex) => {
    if (!searchTerm) {
      loadFiles();
      return;
    }

    let searchRegex;
    try {
      searchRegex = isRegex ? new RegExp(searchTerm) : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    } catch (e) {
      console.error('Invalid regex pattern:', e);
      return;
    }

    setFiles(prevFiles => {
      return prevFiles.filter(item => {
        return searchRegex.test(item.name);
      });
    });
  }, [loadFiles]);

  const handlePathChange = (newPath) => {
    console.log('Changing path to:', newPath);
    setCurrentPath(newPath);
    window.history.pushState({}, '', `?path=${encodeURIComponent(newPath)}`);
  };

  return {
    files,
    currentPath,
    depth,
    loading,
    showFolders,
    extensionFilter,
    handleItemClick,
    handlePathChange,
    handleFilterClick,
    setDepth,
    setShowFolders,
    separateItems,
    navigateToParent,
    handleSearch
  };
};