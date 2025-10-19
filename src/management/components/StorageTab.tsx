/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI NOTICE: This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-9903-36654D
const __banditFingerprint_components_StorageTabtsx = 'BL-FP-53E9DF-19E2';
const __auditTrail_components_StorageTabtsx = 'BL-AU-MGOIKVVK-EY8O';
// File: StorageTab.tsx | Path: src/management/components/StorageTab.tsx | Hash: 990319e2

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Snackbar,
  useTheme,
  ThemeOptions,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { debugLogger } from '../../services/logging/debugLogger';
import indexedDBService from '../../services/indexedDB/indexedDBService';
import { useConversationSyncStore } from '../../store/conversationSyncStore';

// Storage category types
interface StorageCategory {
  name: string;
  icon: React.ElementType;
  color: string;
  size: number;
  itemCount: number;
  description: string;
  stores: string[];
  canClear: boolean;
  clearWarning?: string;
}

interface StorageTabProps {
  currentTheme: ThemeOptions;
}

interface StorageQuotaState {
  used: number;
  quota: number;
  available: number;
  browserQuotaEstimate: number;
}

const DEFAULT_DISPLAY_QUOTA_BYTES = 1024 * 1024 * 1024; // Default 1 GB cap when the browser doesn't report a quota
const MAX_DISPLAY_QUOTA_BYTES = 5 * 1024 * 1024 * 1024; // Clamp giant device-wide quotas to 5 GB for display clarity

// Utility functions for storage management
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStorageQuota = async (): Promise<{ used: number; quota: number }> => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
  } catch (error) {
    debugLogger.warn('Could not get storage estimate', { error });
  }
  return { used: 0, quota: 0 };
};

const getIndexedDBSize = async (): Promise<StorageCategory[]> => {
  const categories: StorageCategory[] = [];
  
  try {
    debugLogger.info('Starting IndexedDB size estimation');
    
    // List all available databases for debugging
    try {
      const databases = await indexedDB.databases();
      debugLogger.info('Available IndexedDB databases:', { 
        databases: databases.map(db => ({ name: db.name, version: db.version })) 
      });
    } catch (error) {
      debugLogger.warn('Could not list databases', { error });
    }
    
    // Process each category individually to prevent one timeout from breaking everything
    
    // Try multiple possible database names for conversations
    const conversationDbNames = ['bandit-conversations', 'banditConversations', 'conversations'];
    let chatSize = { size: 0, count: 0 };
    let foundConversationDb = '';
    
    for (const dbName of conversationDbNames) {
      try {
        const result = await estimateStoreSize(dbName, 'conversations');
        if (result.count > 0) {
          chatSize = result;
          foundConversationDb = dbName;
          debugLogger.info(`Found conversations in database: ${dbName}`);
          break;
        }
      } catch (error) {
        debugLogger.warn(`Failed to check conversations in ${dbName}`, { error });
      }
    }
    
    categories.push({
      name: 'Chat History',
      icon: ChatIcon,
      color: '#4caf50',
      size: chatSize.size,
      itemCount: chatSize.count,
      description: 'Conversation history and messages',
      stores: foundConversationDb ? [`${foundConversationDb}.conversations`] : [],
      canClear: chatSize.count > 0,
      clearWarning: 'This will permanently delete all your chat conversations and message history.'
    });
    
    debugLogger.info(`Chat History category created:`, { 
      itemCount: chatSize.count, 
      size: chatSize.size, 
      canClear: chatSize.count > 0,
      foundDb: foundConversationDb 
    });

    // Try multiple possible database names for knowledge
    const knowledgeDbNames = ['bandit-knowledge', 'banditKnowledge', 'knowledge'];
    let knowledgeSize = { size: 0, count: 0 };
    let foundKnowledgeDb = '';
    
    for (const dbName of knowledgeDbNames) {
      try {
        const result = await estimateStoreSize(dbName, 'documents');
        debugLogger.info(`Knowledge database ${dbName} check result:`, { 
          size: result.size, 
          count: result.count, 
          sizeFormatted: `${(result.size / 1024).toFixed(2)} KB` 
        });
        if (result.count > 0) {
          knowledgeSize = result;
          foundKnowledgeDb = dbName;
          debugLogger.info(`Found knowledge documents in database: ${dbName}`, { 
            totalSize: result.size, 
            itemCount: result.count 
          });
          break;
        }
      } catch (error) {
        debugLogger.warn(`Failed to check knowledge in ${dbName}`, { error });
      }
    }
    
    categories.push({
      name: 'Knowledge Documents',
      icon: DescriptionIcon,
      color: '#2196f3',
      size: knowledgeSize.size,
      itemCount: knowledgeSize.count,
      description: 'Uploaded documents and their embeddings',
      stores: foundKnowledgeDb ? [`${foundKnowledgeDb}.documents`] : [],
      canClear: knowledgeSize.count > 0,
      clearWarning: 'This will remove all uploaded documents and their AI embeddings. You will need to re-upload documents.'
    });

    debugLogger.info(`Knowledge Documents category created:`, { 
      itemCount: knowledgeSize.count, 
      size: knowledgeSize.size, 
      sizeFormatted: `${(knowledgeSize.size / 1024).toFixed(2)} KB`,
      canClear: knowledgeSize.count > 0,
      foundDb: foundKnowledgeDb 
    });

    // Try multiple possible database names for memory (with timeout protection)
    const memoryDbNames = ['bandit-memory-db', 'banditMemories', 'bandit-memories'];
    let memorySize = { size: 0, count: 0 };
    let foundMemoryDb = '';
    
    for (const dbName of memoryDbNames) {
      try {
        const result = await estimateStoreSize(dbName, 'memories');
        if (result.count > 0) {
          memorySize = result;
          foundMemoryDb = dbName;
          debugLogger.info(`Found memories in database: ${dbName}`);
          break;
        }
      } catch (error) {
        debugLogger.warn(`Failed to check memories in ${dbName}`, { error });
      }
    }
    
    categories.push({
      name: 'AI Memories',
      icon: PersonIcon,
      color: '#ff9800',
      size: memorySize.size,
      itemCount: memorySize.count,
      description: 'AI memory entries and learned patterns',
      stores: foundMemoryDb ? [`${foundMemoryDb}.memories`] : [],
      canClear: memorySize.count > 0,
      clearWarning: 'This will delete all AI memory entries and learned conversation patterns.'
    });

    // Try multiple possible database names for config
    const configDbNames = ['banditConfig', 'bandit-config'];
    let configSize = { size: 0, count: 0 };
    let foundConfigDb = '';
    
    for (const dbName of configDbNames) {
      try {
        const result = await estimateStoreSize(dbName, 'config');
        if (result.count > 0) {
          configSize = result;
          foundConfigDb = dbName;
          debugLogger.info(`Found config in database: ${dbName}`);
          break;
        }
      } catch (error) {
        debugLogger.warn(`Failed to check config in ${dbName}`, { error });
      }
    }
    
    categories.push({
      name: 'App Settings & Models',
      icon: SettingsIcon,
      color: '#9c27b0',
      size: configSize.size,
      itemCount: configSize.count,
      description: 'Custom models, app settings, and user preferences',
      stores: foundConfigDb ? [`${foundConfigDb}.config`] : [],
      canClear: configSize.count > 0,
      clearWarning: 'This will delete all custom AI models, app settings, themes, and preferences. The app will reset to defaults.'
    });

    // Check for AI Query databases (with timeout protection)
    const queryDbNames = ['banditAIQuery', 'ai-query-db'];
    let querySize = { size: 0, count: 0 };
    let foundQueryDb = '';
    
    for (const dbName of queryDbNames) {
      try {
        const result = await estimateStoreSize(dbName, 'queries');
        if (result.count > 0) {
          querySize = result;
          foundQueryDb = dbName;
          debugLogger.info(`Found AI queries in database: ${dbName}`);
          break;
        }
      } catch (error) {
        debugLogger.warn(`Failed to check queries in ${dbName}`, { error });
      }
    }
    
    if (querySize.count > 0) {
      categories.push({
        name: 'AI Query Cache',
        icon: PersonIcon,
        color: '#ff5722',
        size: querySize.size,
        itemCount: querySize.count,
        description: 'Cached AI query results and responses',
        stores: [`${foundQueryDb}.queries`],
        canClear: true,
        clearWarning: 'This will delete all cached AI query results.'
      });
    }
    
    debugLogger.info('Categories created:', { 
      totalCategories: categories.length,
      categories: categories.map(cat => ({ 
        name: cat.name, 
        itemCount: cat.itemCount, 
        canClear: cat.canClear,
        storesLength: cat.stores.length 
      }))
    });
    
    return categories;

  } catch (error) {
    debugLogger.error('Error estimating IndexedDB size', { error });
    // Return empty categories on error so UI doesn't hang
    return [];
  }
};

const estimateStoreSize = async (dbName: string, storeName: string): Promise<{ size: number; count: number }> => {
  try {
    debugLogger.info(`Attempting to estimate size for ${dbName}.${storeName}`);
    
    // Add a timeout for individual store estimation to prevent hanging
    const timeoutPromise = new Promise<{ size: number; count: number }>((_, reject) => {
      setTimeout(() => reject(new Error(`Store estimation timeout for ${dbName}.${storeName}`)), 3000);
    });
    
    const estimationPromise = (async () => {
      // Try to access the database directly instead of checking if it exists first
      const storeConfigs = [{ name: storeName, keyPath: "id" }];
      
      try {
        const items = await indexedDBService.getAll(dbName, 1, storeName, storeConfigs);
        const rawItems: unknown[] = Array.isArray(items) ? items : [];
        debugLogger.info(`Retrieved ${rawItems.length} items from ${dbName}.${storeName}`);
        
        if (rawItems.length === 0) {
          debugLogger.info(`No items found in ${dbName}.${storeName}`);
          return { size: 0, count: 0 };
        }
        
        // Estimate size by converting to JSON and measuring length
        const totalSize = rawItems.reduce<number>((acc, item) => {
          try {
            return acc + JSON.stringify(item ?? '').length * 2; // Rough estimate (UTF-16)
          } catch {
            return acc + 1000; // Fallback estimate for non-serializable items
          }
        }, 0);
        const itemCount = rawItems.length;
        
        debugLogger.info(`Estimated size for ${dbName}.${storeName}: ${totalSize} bytes, ${itemCount} items`);
        return { size: totalSize, count: itemCount };
      } catch (dbError) {
        debugLogger.info(`Database ${dbName} or store ${storeName} does not exist or is inaccessible`, { error: dbError });
        return { size: 0, count: 0 };
      }
    })();
    
    // Race between estimation and timeout
    return await Promise.race([estimationPromise, timeoutPromise]);
  } catch (error) {
    debugLogger.warn(`Failed to estimate size for ${dbName}.${storeName}`, { error });
    return { size: 0, count: 0 };
  }
};

const clearStorageCategory = async (category: StorageCategory): Promise<void> => {
  debugLogger.info(`Clearing storage category: ${category.name}`);
  
  for (const storeSpec of category.stores) {
    try {
      const [dbName, storeName] = storeSpec.split('.');
      debugLogger.info(`Clearing store: ${dbName}.${storeName}`);
      
      // Skip if either part is undefined
      if (!dbName || !storeName) {
        debugLogger.warn(`Invalid store specification: ${storeSpec}`);
        continue;
      }
      
      // Get all items first
      const storeConfigs = [{ name: storeName, keyPath: "id" }];
      const items = await indexedDBService.getAll(dbName, 1, storeName, storeConfigs);

      const records: unknown[] = Array.isArray(items) ? items : [];

      if (records.length > 0) {
        // Delete each item by its key
        for (const rawItem of records) {
          if (rawItem && typeof rawItem === 'object') {
            const record = rawItem as Record<string, unknown>;
            const candidate = record['id'] ?? record['key'] ?? record['name'];
            if (typeof candidate === 'string' && candidate.length > 0) {
              await indexedDBService.delete(dbName, 1, storeName, candidate, storeConfigs);
            }
          }
        }
        debugLogger.info(`Cleared ${records.length} items from ${dbName}.${storeName}`);
      } else {
        debugLogger.info(`No items found in ${dbName}.${storeName}`);
      }
    } catch (error) {
      debugLogger.error(`Failed to clear store: ${storeSpec}`, { error });
      // Don't throw error, continue with other stores
    }
  }
};

// Function to completely clear a database
const clearEntireDatabase = async (dbName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    
    deleteRequest.onsuccess = () => {
      debugLogger.info(`Successfully deleted database: ${dbName}`);
      resolve();
    };
    
    deleteRequest.onerror = () => {
      debugLogger.error(`Failed to delete database: ${dbName}`, { error: deleteRequest.error });
      reject(deleteRequest.error);
    };
    
    deleteRequest.onblocked = () => {
      debugLogger.warn(`Database deletion blocked: ${dbName}. Close all tabs using this database.`);
      // Still resolve as the deletion will complete when other tabs are closed
      resolve();
    };
  });
};

const StorageTab: React.FC<StorageTabProps> = ({ currentTheme }) => {
  const theme = useTheme();
  const [storageQuota, setStorageQuota] = useState<StorageQuotaState>({
    used: 0,
    quota: 0,
    available: 0,
    browserQuotaEstimate: 0,
  });
  const [storageCategories, setStorageCategories] = useState<StorageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [clearCategoryDialog, setClearCategoryDialog] = useState<StorageCategory | null>(null);
  const [clearing, setClearing] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const { syncEnabled, isAdvancedVectorFeaturesEnabled } = useConversationSyncStore((state) => ({
    syncEnabled: state.syncEnabled,
    isAdvancedVectorFeaturesEnabled: state.isAdvancedVectorFeaturesEnabled,
  }));
  const syncFeaturesActive = syncEnabled || isAdvancedVectorFeaturesEnabled;
  const usageSummaryMessage = syncFeaturesActive
    ? 'IndexedDB/local storage is shown below. Conversation sync or advanced vector storage may copy items to your configured gateway.'
    : 'IndexedDB/local storage lives entirely in this browser when sync features are disabled.';
  const storageStatusPrimary = syncFeaturesActive ? 'IndexedDB/local storage (sync features enabled)' : 'IndexedDB/local storage only';


  // Load storage data
  const loadStorageData = async () => {
    setLoading(true);
    try {
      debugLogger.info('Loading storage data...');
      
      const [quotaEstimate, categories] = await Promise.all([
        getStorageQuota(),
        getIndexedDBSize()
      ]);

      const calculatedUsed = categories.reduce((sum, cat) => sum + cat.size, 0);
      const browserQuota = quotaEstimate.quota && quotaEstimate.quota > 0 ? quotaEstimate.quota : 0;
      const normalizedQuota = browserQuota > 0
        ? Math.min(Math.max(browserQuota, calculatedUsed || DEFAULT_DISPLAY_QUOTA_BYTES), MAX_DISPLAY_QUOTA_BYTES)
        : Math.max(DEFAULT_DISPLAY_QUOTA_BYTES, calculatedUsed);

      const available = Math.max(normalizedQuota - calculatedUsed, 0);

      debugLogger.info('Storage data loaded successfully', { 
        browserQuota,
        browserUsageEstimate: quotaEstimate.used,
        normalizedQuota,
        calculatedUsed,
        available,
        categoriesCount: categories.length,
        categories: categories.map(cat => ({ 
          name: cat.name, 
          itemCount: cat.itemCount, 
          size: cat.size,
          canClear: cat.canClear 
        }))
      });

      setStorageQuota({
        used: calculatedUsed,
        quota: normalizedQuota,
        available,
        browserQuotaEstimate: browserQuota,
      });
      setStorageCategories(categories);
    } catch (error) {
      debugLogger.error('Failed to load storage data', { error });
      setSnackbarMessage('Failed to load storage data. Please try refreshing.');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      // Set empty data so UI doesn't break
      setStorageCategories([]);
      setStorageQuota({ used: 0, quota: DEFAULT_DISPLAY_QUOTA_BYTES, available: DEFAULT_DISPLAY_QUOTA_BYTES, browserQuotaEstimate: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  // Calculate totals
  const totalUsed = useMemo(() => {
    return storageCategories.reduce((sum, cat) => sum + cat.size, 0);
  }, [storageCategories]);


  const usagePercentage = useMemo(() => {
    if (storageQuota.quota === 0) return 0;
    const percentage = Math.min((storageQuota.used / storageQuota.quota) * 100, 100);
    // Show at least 0.1% if there's any usage to make it visible
    return percentage > 0 && percentage < 0.1 ? 0.1 : percentage;
  }, [storageQuota]);

  const clearableCategories = useMemo(() => {
    return storageCategories.filter(cat => cat.canClear);
  }, [storageCategories]);

  // Handle category clearing
  const handleClearCategory = async (category: StorageCategory) => {
    setClearing(true);
    try {
      await clearStorageCategory(category);
      setSnackbarMessage(`Successfully cleared ${category.name}`);
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      setClearCategoryDialog(null);
      await loadStorageData(); // Refresh data
    } catch (error) {
      setSnackbarMessage(`Failed to clear ${category.name}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      debugLogger.error('Failed to clear category', { category: category.name, error });
    } finally {
      setClearing(false);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    setClearing(true);
    try {
      for (const category of clearableCategories) {
        await clearStorageCategory(category);
      }
      setSnackbarMessage('Successfully cleared all storage data');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      setClearAllDialogOpen(false);
      await loadStorageData(); // Refresh data
    } catch (error) {
      setSnackbarMessage('Failed to clear all storage data');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      debugLogger.error('Failed to clear all storage', { error });
    } finally {
      setClearing(false);
    }
  };

  // Handle nuclear clear (completely delete all databases)
  const handleNuclearClear = async () => {
    if (!window.confirm('⚠️ NUCLEAR CLEAR WARNING ⚠️\n\nThis will PERMANENTLY DELETE ALL DATABASES and cannot be undone!\n\nDifference from "Clear All Data":\n• Clear All Data: Deletes items but keeps database structure\n• Nuclear Clear: Completely destroys databases and reloads app\n\nThis includes:\n- All chat history\n- All knowledge documents\n- All custom models\n- All app settings\n- Everything!\n\nAre you absolutely sure?')) {
      return;
    }
    
    if (!window.confirm('This is your FINAL WARNING!\n\nClick OK to permanently delete EVERYTHING or Cancel to abort.')) {
      return;
    }
    
    setClearing(true);
    try {
      // Include ALL databases seen in the user's system
      const databases = [
        // Current databases
        'banditConfig', 'bandit-knowledge', 'bandit-conversations', 'bandit-memory-db',
        // Legacy/duplicate databases
        'banditConversations', 'banditKnowledge', 'banditMemories', 'banditAIQuery',
        'ai-query-db', 'knowledge'
      ];
      
      for (const dbName of databases) {
        await clearEntireDatabase(dbName);
      }
      
      // Also clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      setSnackbarMessage('Nuclear clear completed! All data has been permanently deleted.');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      
      // Reload the page after a delay to reset everything
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      setSnackbarMessage('Nuclear clear failed - some data may remain');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      debugLogger.error('Nuclear clear failed', { error });
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary" sx={{ ml: 2 }}>
          Analyzing storage usage...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ px: { xs: 2, sm: 4, md: 6 }, pt: 3, pb: 5 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'flex-start' }, 
            gap: { xs: 2, sm: 0 },
            mb: 2 
          }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" color="text.primary" sx={{ mb: 1, fontWeight: 600 }}>
                Storage Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor and manage your local browser storage usage
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              justifyContent: { xs: 'stretch', sm: 'flex-end' },
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button
                variant="outlined"
                size="small"
                onClick={loadStorageData}
                disabled={loading}
                sx={{ 
                  minWidth: { xs: 'auto', sm: 'fit-content' },
                  flex: { xs: '1', sm: '0 0 auto' },
                  minHeight: 36
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                  <RefreshIcon fontSize="medium" />
                  Refresh
                </Box>
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshIcon fontSize="medium" />
                </Box>
              </Button>
              {clearableCategories.length > 0 && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CleaningServicesIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                    onClick={() => setClearAllDialogOpen(true)}
                    sx={{
                      minWidth: { xs: 'auto', sm: 'fit-content' },
                      flex: { xs: '1', sm: '0 0 auto' },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Clear All Data</Box>
                    <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Clear All</Box>
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                    onClick={() => handleNuclearClear()}
                    sx={{ 
                      minWidth: { xs: 'auto', sm: 'fit-content' },
                      flex: { xs: '1', sm: '0 0 auto' },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Nuclear Clear</Box>
                    <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Nuclear</Box>
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* Storage Overview */}
        <Box sx={{ mb: 4 }}>
          {/* Storage Quota - Full width on mobile */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 180 
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "text.primary" }}>
                <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Storage Quota
              </Typography>
              <Box sx={{ mb: 2, flex: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    label={`${formatBytes(storageQuota.used)} Used`} 
                    color="warning" 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${formatBytes(storageQuota.available)} Available`} 
                    color="success" 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${formatBytes(storageQuota.quota)} Total`} 
                    color="info" 
                    size="small" 
                    variant="outlined"
                  />
                  {storageQuota.browserQuotaEstimate > 0 &&
                   storageQuota.quota > 0 &&
                   Math.abs(storageQuota.browserQuotaEstimate - storageQuota.quota) > storageQuota.quota * 0.05 && (
                    <Chip
                      label={`≈${formatBytes(storageQuota.browserQuotaEstimate)} Browser Estimate`}
                      color="default"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={usagePercentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: usagePercentage > 80 ? 'error.main' : usagePercentage > 60 ? 'warning.main' : 'success.main',
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {usagePercentage.toFixed(1)}% used
                </Typography>
              </Box>
              {usagePercentage > 80 && (
                <Alert severity="warning" sx={{ mt: 'auto' }}>
                  Storage usage is high. Consider clearing unused data.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Usage Summary - Full width on mobile */}
          <Card>
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 140 
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "text.primary" }}>
                Usage Summary
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label={`${storageCategories.length} Categories`} 
                  color="primary" 
                  size="small" 
                />
                <Chip 
                  label={`${storageCategories.reduce((sum, cat) => sum + cat.itemCount, 0)} Items`} 
                  color="secondary" 
                  size="small" 
                />
                <Chip 
                  label={`${formatBytes(totalUsed)} Used`} 
                  color="info" 
                  size="small" 
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
                {usageSummaryMessage}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Storage Categories */}
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>
          Storage Categories
        </Typography>

        <Box sx={{ 
          maxHeight: '60vh',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          {storageCategories.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                No storage data found. This could mean:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>All databases are empty</li>
                <li>Data is stored under different names</li>
                <li>There was an error accessing the databases</li>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Try clicking "Refresh" or check the browser console for more details.
              </Typography>
            </Alert>
          ) : (
            <Stack spacing={2}>
              {storageCategories.map((category) => {
                const IconComponent = category.icon;
                // Calculate percentage relative to total storage quota for more meaningful display
                const categoryPercentage = storageQuota.quota > 0 ? (category.size / storageQuota.quota) * 100 : 0;
                // Also calculate percentage relative to total used storage
                const categoryRelativePercentage = totalUsed > 0 ? (category.size / totalUsed) * 100 : 0;
                
                debugLogger.info(`Category ${category.name} percentage calculation:`, {
                  categorySize: category.size,
                  totalUsed,
                  storageQuota: storageQuota.quota,
                  categoryPercentage: categoryPercentage.toFixed(2),
                  categoryRelativePercentage: categoryRelativePercentage.toFixed(2)
                });
                
                return (
                  <Accordion key={category.name} sx={{ bgcolor: 'background.paper' }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`${category.name}-content`}
                      id={`${category.name}-header`}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                        <IconComponent sx={{ color: category.color, mr: 2 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="body1" 
                            style={{ 
                              fontWeight: 600,
                              color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary
                            }}
                          >
                            {category.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {formatBytes(category.size)}
                            </Typography>
                            <Chip 
                              label={`${category.itemCount} items`} 
                              size="small" 
                              variant="outlined"
                            />
                            <Box sx={{ flex: 1, mx: 2 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(categoryRelativePercentage, 100)} // Use relative percentage for visual bar
                                sx={{
                                  height: 4,
                                  borderRadius: 2,
                                  bgcolor: 'action.hover',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 2,
                                    bgcolor: category.color,
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {categoryRelativePercentage.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ pl: 5 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {category.description}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Storage Locations:
                        </Typography>
                        <List dense>
                          {category.stores.map((store) => (
                            <ListItem key={store} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <StorageIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={store}
                                primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
                              />
                            </ListItem>
                          ))}
                        </List>

                        {category.canClear ? (
                          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => setClearCategoryDialog(category)}
                              disabled={clearing}
                            >
                              Clear {category.name}
                            </Button>
                            {category.clearWarning && (
                              <Alert severity="warning" sx={{ mt: 2 }}>
                                <Typography variant="caption">
                                  {category.clearWarning}
                                </Typography>
                              </Alert>
                            )}
                          </Box>
                        ) : (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="caption">
                              {category.itemCount === 0 ? 'This category is empty.' : 'This category cannot be cleared automatically.'}
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Storage Tips */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "text.primary" }}>
              <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Storage Tips & Clear Options
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon
                    sx={{
                      color: syncFeaturesActive
                        ? theme.palette.warning.main
                        : theme.palette.success.main,
                    }}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={storageStatusPrimary}
                  secondary={
                    syncFeaturesActive
                      ? 'Some features (conversation sync or advanced vector storage) can sync items to your configured gateway storage.'
                      : 'With conversation sync and advanced vector storage turned off, everything stays in this browser.'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CleaningServicesIcon color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary="Clear All Data (Safe)"
                  secondary="Deletes all items but keeps database structure intact. App continues working normally."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DeleteIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Nuclear Clear (Complete Reset)"
                  secondary="Completely destroys all databases and forces app reload. Use only for complete reset."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="Backup important data"
                  secondary="Export custom models and important documents before clearing storage"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Clear Category Dialog */}
        <Dialog 
          open={!!clearCategoryDialog} 
          onClose={() => setClearCategoryDialog(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              Clear {clearCategoryDialog?.name}?
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently delete all data in the "{clearCategoryDialog?.name}" category.
            </DialogContentText>
            {clearCategoryDialog?.clearWarning && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {clearCategoryDialog.clearWarning}
              </Alert>
            )}
            {clearCategoryDialog && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Will clear:</strong>
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  • {clearCategoryDialog.itemCount} items<br/>
                  • {formatBytes(clearCategoryDialog.size)} of data<br/>
                  • {clearCategoryDialog.stores.length} storage location{clearCategoryDialog.stores.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setClearCategoryDialog(null)}
              disabled={clearing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => clearCategoryDialog && handleClearCategory(clearCategoryDialog)}
              color="error"
              variant="contained"
              startIcon={clearing ? <CircularProgress size={16} /> : <DeleteIcon />}
              disabled={clearing}
            >
              {clearing ? 'Clearing...' : 'Clear Data'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Clear All Dialog */}
        <Dialog 
          open={clearAllDialogOpen} 
          onClose={() => setClearAllDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              Clear All Storage Data?
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently delete ALL your local data including:
            </DialogContentText>
            <List dense sx={{ mt: 1 }}>
              {clearableCategories.map((category) => (
                <ListItem key={category.name}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <category.icon fontSize="small" sx={{ color: category.color }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={category.name}
                    secondary={`${category.itemCount} items • ${formatBytes(category.size)}`}
                  />
                </ListItem>
              ))}
            </List>
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>This action cannot be undone!</strong> Make sure to export any important data before proceeding.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setClearAllDialogOpen(false)}
              disabled={clearing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearAll}
              color="error"
              variant="contained"
              startIcon={clearing ? <CircularProgress size={16} /> : <CleaningServicesIcon />}
              disabled={clearing}
            >
              {clearing ? 'Clearing All...' : 'Clear All Data'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={showSnackbar}
          autoHideDuration={4000}
          onClose={() => setShowSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={() => setShowSnackbar(false)}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default StorageTab;
