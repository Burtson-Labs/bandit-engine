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

// Bandit Engine Watermark: BL-WM-70C7-7E0961
const __banditFingerprint_components_KnowledgeTabtsx = 'BL-FP-17186C-247F';
const __auditTrail_components_KnowledgeTabtsx = 'BL-AU-MGOIKVVI-8Q43';
// File: KnowledgeTab.tsx | Path: src/management/components/KnowledgeTab.tsx | Hash: 70c7247f

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Alert,
  Stack,
  MenuItem,
  Snackbar,
  Switch,
  useMediaQuery,
  useTheme,
  ThemeOptions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { KnowledgeDoc } from '../../chat/hooks/useKnowledgeStore';
import KnowledgeFileModal from '../../modals/knowlege/knowledge-file-modal';
import DocumentCard from '../../shared/DocumentCard';
import { useVectorStore } from '../../hooks/useVectorStore';
import { useAuthenticationStore } from '../../store/authenticationStore';
import { useFeatures } from '../../hooks/useFeatures';
import ProcessingOverlay from '../../components/shared/ProcessingOverlay';
import { useProcessingOverlay } from '../../hooks/useProcessingOverlay';
import { useConversationSyncStore } from '../../store/conversationSyncStore';

// File type detection and categorization with language detection
const getFileTypeInfo = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  // Programming languages with specific colors and labels
  type FileTypeMeta = { icon: React.ElementType; color: string; category: string; language?: string };
  const languageMap: Record<string, FileTypeMeta> = {
    // Documents
    'pdf': { icon: PictureAsPdfIcon, color: '#d32f2f', category: 'Document' },
    'doc': { icon: ArticleIcon, color: '#1976d2', category: 'Document' },
    'docx': { icon: ArticleIcon, color: '#1976d2', category: 'Document' },
    'odt': { icon: ArticleIcon, color: '#1976d2', category: 'Document' },
    'rtf': { icon: ArticleIcon, color: '#1976d2', category: 'Document' },
    
    // Text files
    'txt': { icon: DescriptionIcon, color: '#388e3c', category: 'Text' },
    'md': { icon: DescriptionIcon, color: '#388e3c', category: 'Text', language: 'Markdown' },
    'markdown': { icon: DescriptionIcon, color: '#388e3c', category: 'Text', language: 'Markdown' },
    
    // Web languages
    'js': { icon: CodeIcon, color: '#f7df1e', category: 'Code', language: 'JavaScript' },
    'jsx': { icon: CodeIcon, color: '#61dafb', category: 'Code', language: 'React' },
    'ts': { icon: CodeIcon, color: '#3178c6', category: 'Code', language: 'TypeScript' },
    'tsx': { icon: CodeIcon, color: '#61dafb', category: 'Code', language: 'React TS' },
    'html': { icon: CodeIcon, color: '#e34f26', category: 'Code', language: 'HTML' },
    'css': { icon: CodeIcon, color: '#1572b6', category: 'Code', language: 'CSS' },
    'scss': { icon: CodeIcon, color: '#cf649a', category: 'Code', language: 'SCSS' },
    'sass': { icon: CodeIcon, color: '#cf649a', category: 'Code', language: 'Sass' },
    'php': { icon: CodeIcon, color: '#777bb4', category: 'Code', language: 'PHP' },
    
    // Systems languages
    'c': { icon: CodeIcon, color: '#a8b9cc', category: 'Code', language: 'C' },
    'cpp': { icon: CodeIcon, color: '#f34b7d', category: 'Code', language: 'C++' },
    'cs': { icon: CodeIcon, color: '#239120', category: 'Code', language: 'C#' },
    'java': { icon: CodeIcon, color: '#ed8b00', category: 'Code', language: 'Java' },
    'py': { icon: CodeIcon, color: '#3776ab', category: 'Code', language: 'Python' },
    'go': { icon: CodeIcon, color: '#00add8', category: 'Code', language: 'Go' },
    'rs': { icon: CodeIcon, color: '#ce422b', category: 'Code', language: 'Rust' },
    'kt': { icon: CodeIcon, color: '#7f52ff', category: 'Code', language: 'Kotlin' },
    'swift': { icon: CodeIcon, color: '#fa7343', category: 'Code', language: 'Swift' },
    'scala': { icon: CodeIcon, color: '#dc322f', category: 'Code', language: 'Scala' },
    'rb': { icon: CodeIcon, color: '#cc342d', category: 'Code', language: 'Ruby' },
    
    // Scripts
    'sh': { icon: CodeIcon, color: '#4eaa25', category: 'Code', language: 'Shell' },
    'bash': { icon: CodeIcon, color: '#4eaa25', category: 'Code', language: 'Bash' },
    'bat': { icon: CodeIcon, color: '#c1f12e', category: 'Code', language: 'Batch' },
    'ps1': { icon: CodeIcon, color: '#012456', category: 'Code', language: 'PowerShell' },
    
    // Data formats
    'json': { icon: DataObjectIcon, color: '#f7df1e', category: 'Data', language: 'JSON' },
    'xml': { icon: DataObjectIcon, color: '#ff6600', category: 'Data', language: 'XML' },
    'yaml': { icon: DataObjectIcon, color: '#cb171e', category: 'Data', language: 'YAML' },
    'yml': { icon: DataObjectIcon, color: '#cb171e', category: 'Data', language: 'YAML' },
    'csv': { icon: DataObjectIcon, color: '#217346', category: 'Data', language: 'CSV' },
  };
  
  return languageMap[ext] || { icon: DescriptionIcon, color: '#666', category: 'Other' };
};

// File size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Content source badge information with proper vector detection
const getContentSourceInfo = (doc: KnowledgeDoc, isVectorMode: boolean) => {
  // Check if this is a vector document - simplified logic focusing on s3Url
  const isVectorDocument = isVectorMode && !!doc.s3Url;
  
  if (isVectorDocument) {
    // Vector documents from S3/private cloud - use teamSid to determine team vs personal
    const teamSid = doc.teamSid;
    if (teamSid) {
      return {
        label: 'Team',
        icon: GroupIcon,
        color: '#388e3c', // Green
        bgColor: '#388e3c20'
      };
    } else {
      return {
        label: 'Personal',
        icon: PersonIcon,
        color: '#1976d2', // Blue  
        bgColor: '#1976d220'
      };
    }
  }
  
  // For legacy content source classification
  if (doc.contentSource) {
    if (doc.contentSource === 'user') {
      return {
        label: 'Personal',
        icon: PersonIcon,
        color: '#1976d2', // Blue
        bgColor: '#1976d220'
      };
    } else if (doc.contentSource === 'team') {
      return {
        label: 'Team',
        icon: GroupIcon,
        color: '#388e3c', // Green
        bgColor: '#388e3c20'
      };
    }
  }
  
  // For local IndexedDB documents
  return {
    label: 'Local',
    icon: LockIcon,
    color: '#757575', // Gray
    bgColor: '#75757520'
  };
};

// Document upload status
interface UploadStatus {
  filename: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

// View modes
type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';

interface KnowledgeTabProps {
  documents: KnowledgeDoc[];
  addDocuments: (files: File[]) => Promise<void>;
  removeDocument: (id: string) => void;
  loadDocuments: () => Promise<void>;
  clearAllDocuments: () => Promise<void>;
  currentTheme: ThemeOptions;
  isLimitedAdmin?: boolean; // For premium users with limited admin access
}

const KnowledgeTab: React.FC<KnowledgeTabProps> = ({
  documents,
  addDocuments,
  removeDocument,
  loadDocuments,
  clearAllDocuments,
  currentTheme,
  isLimitedAdmin = false,
}) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  // Vector store integration for seamless advanced search
  const authStore = useAuthenticationStore();
  const features = useFeatures();
  const isAdvancedVectorFeaturesEnabled = useConversationSyncStore(
    (state) => state.isAdvancedVectorFeaturesEnabled
  );
  
  const {
    isVectorEnabled,
    uploadDocument: uploadToVector,
    searchDocuments: searchVectorDocuments,
    getUserDocuments,
    downloadVectorFile,
    getFilePreview,
    refreshCompatibilityCheck,
    initializeVectorService
  } = useVectorStore();

  // Processing overlay for vector operations
  const { showProcessing, hideProcessing, updateProgress, processingState } = useProcessingOverlay();

  // Allow access for admins, pro tier users, and team tier users
  const shouldUseVector =
    (features.isAdmin() || features.hasAdvancedSearch() || features.hasAdvancedMemories()) &&
    isAdvancedVectorFeaturesEnabled &&
    isVectorEnabled;

  const [clearDocsDialogOpen, setClearDocsDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [vectorDocuments, setVectorDocuments] = useState<KnowledgeDoc[]>([]);
  const [loadingVectorDocs, setLoadingVectorDocs] = useState(false);
  
  // Enhanced state management for better UX
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contentSourceFilter, setContentSourceFilter] = useState<'all' | 'personal' | 'team'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning'>('success');
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(new Set());
  // Check if user has a team (teamSid or teamId in JWT)
  const hasTeam = !!(authStore.user?.teamSid || authStore.user?.teamId);
  
  const [shareWithTeam, setShareWithTeam] = useState<boolean>(false); // Default to personal (off) for safety
  const [dragActive, setDragActive] = useState(false);

  // Convert vector database files to KnowledgeDoc format
  type RawVectorDocument = {
    id?: string;
    fileId?: string;
    _id?: string;
    name?: string;
    filename?: string;
    content?: string;
    preview?: string;
    mimeType?: string;
    type?: string;
    uploadedAt?: string;
    createdAt?: string;
    embedding?: number[];
    size?: number;
    uploadedBy?: string;
    userId?: string;
    userEmail?: string;
    bucket?: string;
    key?: string;
    teamSid?: string;
  };

  const mapVectorDocsToKnowledgeDocs = useCallback((vectorDocs: RawVectorDocument[]): KnowledgeDoc[] => {
    return vectorDocs.map((doc) => {
      const primaryId = doc.id ?? doc.fileId ?? doc._id;
      const docId = typeof primaryId === 'string'
        ? primaryId
        : primaryId
        ? JSON.stringify(primaryId)
        : uuidv4();

      const filename = doc.filename || doc.name || 'Unknown Document';
      const uploadedAt = doc.uploadedAt || doc.createdAt || new Date().toISOString();
      const mimeType = doc.mimeType || doc.type || 'application/octet-stream';
      const isTeamDocument = Boolean(doc.teamSid);

      return {
        id: docId,
        name: filename,
        content: doc.preview ?? doc.content ?? '',
        s3Url: docId,
        type: mimeType,
        addedDate: new Date(uploadedAt),
        embedding: doc.embedding,
        size: doc.size ?? 0,
        uploadedBy: doc.uploadedBy || doc.userId || '',
        userEmail: doc.userEmail || '',
        bucket: doc.bucket || '',
        key: doc.key || docId,
        isUserContent: !isTeamDocument,
        isTeamContent: isTeamDocument,
        contentSource: isTeamDocument ? 'team' : 'user',
        ...(isTeamDocument ? { teamSid: doc.teamSid } : {}),
      };
    });
  }, []);

  // Load vector documents when vector storage is enabled
  const loadVectorDocuments = useCallback(async () => {
    if (!shouldUseVector) {
      return;
    }
    
    setLoadingVectorDocs(true);
    try {
      const docs = await getUserDocuments(0, 100); // Load first 100 documents
      const mappedDocs = mapVectorDocsToKnowledgeDocs(docs);
      setVectorDocuments(mappedDocs);
    } catch (error) {
      console.error('Failed to load vector documents:', error);
    } finally {
      setLoadingVectorDocs(false);
    }
  }, [shouldUseVector, getUserDocuments, mapVectorDocsToKnowledgeDocs]);

  // Load documents on mount and when vector storage availability changes
  useEffect(() => {
    if (shouldUseVector) {
      loadVectorDocuments();
    }
  }, [shouldUseVector, loadVectorDocuments]);

  // Enhanced filtering and sorting
  const filteredAndSortedDocuments = useMemo(() => {
    // Use vector documents when vector storage is enabled, otherwise use local documents
        const sourceDocuments = shouldUseVector ? vectorDocuments : documents;
    let filtered = sourceDocuments;
    
    // Search filter - use vector search when available
    if (searchQuery) {
      if (shouldUseVector) {
        // For vector search, we'll need to implement async search
        // For now, fall back to regular search to maintain UI responsiveness
        filtered = filtered.filter(doc => 
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      } else {
        filtered = filtered.filter(doc => 
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => 
        getFileTypeInfo(doc.name).category === selectedCategory
      );
    }

    // Content source filter
    if (contentSourceFilter !== 'all') {
      filtered = filtered.filter(doc => {
        const sourceInfo = getContentSourceInfo(doc, shouldUseVector);
        
        if (contentSourceFilter === 'personal') {
          return sourceInfo.label === 'Personal' || sourceInfo.label === 'Local';
        } else if (contentSourceFilter === 'team') {
          return sourceInfo.label === 'Team';
        }
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          // Use document order as fallback since we don't have upload date
          comparison = documents.indexOf(a) - documents.indexOf(b);
          break;
        case 'size':
          comparison = (a.content.length || 0) - (b.content.length || 0);
          break;
        case 'type':
          comparison = getFileTypeInfo(a.name).category.localeCompare(getFileTypeInfo(b.name).category);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [documents, vectorDocuments, shouldUseVector, searchQuery, selectedCategory, contentSourceFilter, sortBy, sortOrder]);

  // Get unique categories - use active document source
  const categories = useMemo(() => {
        const sourceDocuments = shouldUseVector ? vectorDocuments : documents;
    const cats = new Set(sourceDocuments.map(doc => getFileTypeInfo(doc.name).category));
    return Array.from(cats).sort();
  }, [documents, vectorDocuments, shouldUseVector]);

  // Calculate statistics - use active document source
  const statistics = useMemo(() => {
        const sourceDocuments = shouldUseVector ? vectorDocuments : documents;
    
    // Calculate total size - for vector docs use actual size, for local docs estimate from content
    const totalSize = sourceDocuments.reduce((sum, doc) => {
      if (shouldUseVector && doc.size) {
        return sum + doc.size; // Use actual file size from vector storage
      } else {
        return sum + (doc.content?.length || 0) * 2; // Estimate from content length
      }
    }, 0);
    
    const categoryCounts = sourceDocuments.reduce((acc, doc) => {
      const category = getFileTypeInfo(doc.name).category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDocuments: sourceDocuments.length,
      totalSize: formatFileSize(totalSize),
      categoryCounts,
    };
  }, [documents, vectorDocuments, shouldUseVector]);

  const getFileIcon = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
        return "JS";
      case "ts":
        return "TS";
      case "tsx":
        return "TX";
      case "py":
        return "🐍";
      case "json":
        return "{}";
      case "md":
        return "MD";
      case "pdf":
        return "📄";
      case "docx":
        return "📄";
      case "c":
        return "C";
      case "cpp":
        return "C++";
      case "cs":
        return "C#";
      case "java":
        return "J";
      case "txt":
        return "TXT";
      default:
        return "📁";
    }
  };

  // Enhanced file upload with progress tracking
  // Wrapper function to handle vector store integration
  const handleDocumentUpload = async (files: File[]): Promise<{ success: boolean; error?: string; usedVector: boolean }> => {
    if (shouldUseVector) {
      // Show processing overlay for vector uploads
      showProcessing(
        'Uploading to Vector Database',
        [
          "🥷 Digital ninjas securing your documents...",
          "🤖 AI robots reading and understanding content...", 
          "⚡ Neural networks encoding knowledge vectors...",
          "🧠 Machine learning creating searchable memories...",
          "🔮 AI wizards optimizing semantic search...",
          "🚀 Vector embeddings achieving light speed...",
          "💫 Transforming documents into intelligent data...",
          "🎯 Precision-targeting knowledge patterns..."
        ]
      );
      
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Update progress for each file
          updateProgress('upload', (i / files.length) * 25); // 25% for upload phase
          
          // Step 1: Upload to S3 - use shareWithTeam only if user has a team
          const shouldShareWithTeam = hasTeam ? shareWithTeam : false;
          const result = await uploadToVector(file, shouldShareWithTeam);
          
          // Step 2: AI Analysis and Embedding
          updateProgress('analyze', 25 + (i / files.length) * 50); // 25-75% for analysis
          
          if (!result.success) {
            throw new Error(result.error || 'Vector upload failed');
          }
        }
        
        // Step 3: Optimizing search
        updateProgress('optimize', 90);
        
        // Final step: Complete
        updateProgress('optimize', 100);
        
        // Reload vector documents to show the newly uploaded files
        await loadVectorDocuments();
        
        return { success: true, usedVector: true };
      } catch (error) {
        console.error('Error uploading to vector database:', error);
        hideProcessing();
        // Fallback to regular local upload only if vector fails
        try {
          await addDocuments(files);
          return { 
            success: true, 
            usedVector: false, 
            error: `Vector upload failed: ${error instanceof Error ? error.message : String(error)}. Saved locally instead.` 
          };
        } catch (localError) {
          return { 
            success: false, 
            usedVector: false, 
            error: `Both vector and local upload failed: ${localError instanceof Error ? localError.message : String(localError)}` 
          };
        }
      } finally {
        // Hide overlay after a brief delay to show completion
        setTimeout(() => {
          hideProcessing();
        }, 1500);
      }
    } else {
      // Use local IndexedDB storage for non-vector users
      try {
        await addDocuments(files);
        return { success: true, usedVector: false };
      } catch (error) {
        return { 
          success: false, 
          usedVector: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Initialize upload statuses
    const initialStatuses: UploadStatus[] = files.map(file => ({
      filename: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setUploadStatuses(initialStatuses);

    try {
      // Update progress to show processing
      setUploadStatuses(prev => prev.map(status => ({
        ...status,
        progress: 50
      })));

      // Add documents and wait for completion
      const result = await handleDocumentUpload(files);
      
      if (result.success) {
        // Complete progress
        setUploadStatuses(prev => prev.map(status => ({
          ...status,
          progress: 100,
          status: 'success' as const
        })));

        // Show appropriate success message based on upload method
        const message = result.usedVector 
          ? `Successfully uploaded ${files.length} document(s) to vector database`
          : result.error 
            ? `Upload completed with warnings: ${result.error}`
            : `Successfully uploaded ${files.length} document(s)`;
        
        setSnackbarMessage(message);
        setSnackbarSeverity(result.error ? 'warning' : 'success');
        setShowSnackbar(true);

        // Clear upload statuses after delay
        setTimeout(() => setUploadStatuses([]), 2000);

        // Force reload documents to ensure they appear
        setTimeout(async () => {
          try {
            await loadDocuments();
          } catch (loadError) {
            console.error("Failed to reload documents after upload", loadError);
          }
        }, 100);
      } else {
        // Upload failed completely
        setUploadStatuses(prev => prev.map(status => ({
          ...status,
          status: 'error' as const,
          error: 'Upload failed'
        })));
        
        setSnackbarMessage(`Failed to upload documents: ${result.error || 'Unknown error'}`);
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      }

    } catch (err) {
      setUploadStatuses(prev => prev.map(status => ({
        ...status,
        status: 'error' as const,
        error: 'Upload failed'
      })));
      
      setSnackbarMessage(`Failed to upload documents: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      
      console.error("Failed to add documents", err);
    } finally {
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) return;

    // Initialize upload statuses
    const initialStatuses: UploadStatus[] = files.map(file => ({
      filename: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setUploadStatuses(initialStatuses);

    try {
      // Update progress to show processing
      setUploadStatuses(prev => prev.map(status => ({
        ...status,
        progress: 50
      })));

      // Add documents and wait for completion
      const result = await handleDocumentUpload(files);
      
      if (result.success) {
        // Complete progress
        setUploadStatuses(prev => prev.map(status => ({
          ...status,
          progress: 100,
          status: 'success' as const
        })));

        // Show appropriate success message based on upload method
        const message = result.usedVector 
          ? `Successfully uploaded ${files.length} document(s) to vector database`
          : result.error 
            ? `Upload completed with warnings: ${result.error}`
            : `Successfully uploaded ${files.length} document(s)`;
        
        setSnackbarMessage(message);
        setSnackbarSeverity(result.error ? 'warning' : 'success');
        setShowSnackbar(true);

        // Clear upload statuses after delay
        setTimeout(() => setUploadStatuses([]), 2000);

        // Force reload documents to ensure they appear
        setTimeout(async () => {
          try {
            await loadDocuments();
          } catch (loadError) {
            console.error("Failed to reload documents after drop", loadError);
          }
        }, 100);
      } else {
        // Upload failed completely
        setUploadStatuses(prev => prev.map(status => ({
          ...status,
          status: 'error' as const,
          error: 'Upload failed'
        })));
        
        setSnackbarMessage(`Failed to upload documents: ${result.error || 'Unknown error'}`);
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      }

    } catch (err) {
      setUploadStatuses(prev => prev.map(status => ({
        ...status,
        status: 'error' as const,
        error: 'Upload failed'
      })));
      
      setSnackbarMessage(`Failed to upload documents: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      
      console.error("Drag/drop failed", err);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDownloadDocument = async (e: React.MouseEvent, doc: KnowledgeDoc) => {
    e.stopPropagation();
    
    try {
      if (shouldUseVector && doc.id) {
        // Vector database file - download using MongoDB ObjectId
        await downloadVectorFile(doc.id, doc.name);
        
        setSnackbarMessage(`Downloaded ${doc.name}`);
        setSnackbarSeverity('success');
        setShowSnackbar(true);
      } else {
        // Local file - download from memory
        const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
      setSnackbarMessage(`Failed to download ${doc.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const handleDocumentClick = async (doc: KnowledgeDoc) => {
    if (shouldUseVector && doc.id && !doc.content) {
      // Vector file without content - try to get preview using MongoDB ObjectId
      
      try {
        const preview = await getFilePreview(doc.id);
        if (preview) {
          // Create a temporary doc with preview content
          const previewDoc: KnowledgeDoc = {
            ...doc,
            content: preview.content,
            type: preview.mimeType
          };
          setSelectedDoc(previewDoc);
        } else {
          // No preview available - show info dialog instead
          setSnackbarMessage(`Preview not available for ${doc.name}. Use download to get the full file.`);
          setSnackbarSeverity('warning');
          setShowSnackbar(true);
        }
      } catch (error) {
        console.error('Failed to get preview:', error);
        setSnackbarMessage(`Failed to preview ${doc.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      }
    } else {
      // Local file or vector file with content
      setSelectedDoc(doc);
    }
  };

  const handleRemoveDocument = async (e: React.MouseEvent | null, docId: string) => {
    e?.stopPropagation();

    // Add to deleting set to trigger animation
    setDeletingDocuments((prev) => new Set(prev).add(docId));

    // Wait for animation to complete
    setTimeout(async () => {
      await removeDocument(docId);

      // Remove from deleting set
      setDeletingDocuments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });

      // Refetch vector documents to update the list
      if (shouldUseVector) {
        await loadVectorDocuments();
      }

      setSnackbarMessage('Document removed');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    }, 300); // 300ms for animation
  };

  const handleClearAllDocuments = async () => {
    await clearAllDocuments();
    
    // Refetch vector documents to update the list
    if (shouldUseVector) {
      await loadVectorDocuments();
    }
    
    setClearDocsDialogOpen(false);
    setSnackbarMessage('All documents cleared');
    setSnackbarSeverity('success');
    setShowSnackbar(true);
  };

  const handleBulkDelete = async () => {
    // Add all selected documents to deleting set to trigger animation
    setDeletingDocuments(prev => new Set([...prev, ...selectedDocuments]));
    
    // Wait for animation to complete
    setTimeout(async () => {
      const deletePromises = selectedDocuments.map(id => removeDocument(id));
      await Promise.all(deletePromises);
      
      // Remove all from deleting set
      setDeletingDocuments(prev => {
        const newSet = new Set(prev);
        selectedDocuments.forEach(id => newSet.delete(id));
        return newSet;
      });
      
      // Refetch vector documents to update the list
      if (shouldUseVector) {
        await loadVectorDocuments();
      }
      
      setSelectedDocuments([]);
      setSnackbarMessage(`Removed ${selectedDocuments.length} documents`);
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    }, 300); // 300ms for animation
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(filteredAndSortedDocuments.map(doc => doc.id));
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 } }}>
      <Box sx={{ pt: { xs: 1, md: 2 }, pb: { xs: 3, md: 4 } }}>
        {/* Enhanced Header with Statistics */}
        <Box sx={{ mb: { xs: 2.5, md: 4 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 1.5, md: 2 },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              mb: { xs: 1.5, md: 2 },
            }}
          >
            <Box sx={{ textAlign: { xs: 'left', md: 'initial' } }}>
              <Typography
                variant="h5"
                color="text.primary"
                sx={{ mb: 1, fontWeight: 600, fontSize: { xs: '1.55rem', md: '1.8rem' } }}
              >
                Document Knowledge Base
                {shouldUseVector && (
                  <Chip 
                    label="Vector DB" 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.5 }}
              >
                Add documents to your private knowledge base. Files are securely stored {shouldUseVector ? 'in the vector database' : 'locally in your browser'}.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
              {shouldUseVector && (
                <Button
                  variant="outlined"
                  size={isMobile ? 'small' : 'medium'}
                  onClick={loadVectorDocuments}
                  disabled={loadingVectorDocs}
                  sx={{ mr: { xs: 0, md: 1 }, width: { xs: '100%', md: 'auto' } }}
                >
                  {loadingVectorDocs ? 'Loading...' : 'Refresh'}
                </Button>
              )}
              {documents.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  size={isMobile ? 'small' : 'medium'}
                  startIcon={<DeleteIcon />}
                  onClick={() => setClearDocsDialogOpen(true)}
                  sx={{ ml: { xs: 0, md: 2 }, width: { xs: '100%', md: 'auto' } }}
                >
                  Clear All
                </Button>
              )}
            </Box>
          </Box>
          
          {/* Statistics Cards */}
          {documents.length > 0 && (
            <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, flexWrap: 'wrap', mb: { xs: 2, md: 3 } }}>
              <Card sx={{ minWidth: 120 }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="h6" color="primary">
                    {statistics.totalDocuments}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Documents
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 120 }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="h6" color="primary">
                    {statistics.totalSize}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Size
                  </Typography>
                </CardContent>
              </Card>
              {Object.entries(statistics.categoryCounts).map(([category, count]) => (
                <Card key={category} sx={{ minWidth: 100 }}>
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="h6" color="primary">
                      {count as number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

        </Box>

        {/* Enhanced Upload Area */}
        <Card 
          sx={{ 
            mb: 3,
            border: dragActive ? `2px dashed ${currentTheme.palette?.primary?.main}` : `1px dashed ${currentTheme.palette?.divider}`,
            bgcolor: dragActive ? `${currentTheme.palette?.primary?.main}08` : 'transparent',
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: `${currentTheme.palette?.primary?.main}04`,
              borderColor: currentTheme.palette?.primary?.main,
            }
          }}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <CardContent sx={{ textAlign: 'center', py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
            <UploadFileIcon 
              sx={{ 
                fontSize: 48, 
                color: dragActive ? 'primary.main' : 'text.secondary',
                mb: 2 
              }} 
            />
            <Typography variant="h6" color={dragActive ? 'primary' : 'text.primary'} gutterBottom>
              {dragActive ? 'Drop files here' : 'Upload Documents'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Drag and drop files here or click to browse
            </Typography>
            
            {/* Team Sharing Control for Vector Documents - only show if user has a team */}
            {shouldUseVector && hasTeam && (
              <Box 
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
                onClick={(e) => e.stopPropagation()} // Prevent triggering file upload
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Switch
                    checked={shareWithTeam}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShareWithTeam(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {shareWithTeam ? (
                      <>
                        <GroupIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
                        <Typography variant="body2" color="success.main" fontWeight={500}>
                          Share with team
                        </Typography>
                      </>
                    ) : (
                      <>
                        <PersonIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Personal only
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                  {shareWithTeam 
                    ? 'Team members can search and access these documents' 
                    : 'Documents will be private to your account only'
                  }
                </Typography>
              </Box>
            )}
            
            {/* Message for users without teams */}
            {shouldUseVector && !hasTeam && (
              <Box 
                sx={{ 
                  mb: 2, 
                  p: 1.5, 
                  bgcolor: 'info.main' + '10', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'info.main' + '30'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: '1rem', color: 'info.main' }} />
                  <Typography variant="body2" color="info.main" fontWeight={500}>
                    Personal Documents Only
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                  Documents will be stored privately in your personal account
                </Typography>
              </Box>
            )}
            
            <Typography variant="caption" color="text.secondary">
              Supported: PDF, DOC, TXT, MD, Code files, and more
            </Typography>
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.txt,.md,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.cs,.html,.css,.json,.xml,.yaml,.yml,.csv,.php,.rb,.go,.rs,.kt,.swift,.scala,.sh,.bat,.ps1"
            />
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {uploadStatuses.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {uploadStatuses.map((status, index) => (
              <Card key={index} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {status.status === 'success' ? (
                      <CheckCircleIcon color="success" />
                    ) : status.status === 'error' ? (
                      <ErrorIcon color="error" />
                    ) : (
                      <Box sx={{ width: 20, height: 20 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={status.progress}
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.primary">
                        {status.filename}
                      </Typography>
                      {status.error && (
                        <Typography variant="caption" color="error">
                          {status.error}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {status.progress}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Enhanced Search and Filter Bar */}
        {documents.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search Field */}
                <TextField
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 250 }}
                  size="small"
                />

                {/* Active Filters Status */}
                {(searchQuery || contentSourceFilter !== 'all' || selectedCategory !== 'all') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={`${[searchQuery && 'search', contentSourceFilter !== 'all' && 'source', selectedCategory !== 'all' && 'category'].filter(Boolean).length} active filter${[searchQuery && 'search', contentSourceFilter !== 'all' && 'source', selectedCategory !== 'all' && 'category'].filter(Boolean).length !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                    {contentSourceFilter !== 'all' && (
                      <Chip 
                        label={contentSourceFilter === 'personal' ? 'Personal Only' : 'Team Only'}
                        size="small"
                        color={contentSourceFilter === 'personal' ? 'info' : 'success'}
                        variant="filled"
                        icon={contentSourceFilter === 'personal' ? <PersonIcon /> : <GroupIcon />}
                      />
                    )}
                  </Box>
                )}

                {/* Category Filter */}
                <TextField
                  select
                  label="Category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Content Source Filter - Always visible for better UX */}
                <TextField
                  select
                  label="Source"
                  value={contentSourceFilter}
                  onChange={(e) => setContentSourceFilter(e.target.value as 'all' | 'personal' | 'team')}
                  size="small"
                  sx={{ 
                    minWidth: 140,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: contentSourceFilter !== 'all' ? 'primary.main' + '10' : 'transparent',
                    }
                  }}
                >
                  <MenuItem value="all">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PublicIcon sx={{ fontSize: 16 }} />
                      All Sources
                    </Box>
                  </MenuItem>
                  <MenuItem value="personal">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: '#1976d2' }} />
                      <Typography>Personal Only</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="team">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon sx={{ fontSize: 16, color: '#388e3c' }} />
                      <Typography>Team Only</Typography>
                    </Box>
                  </MenuItem>
                </TextField>

                {/* Sort Controls */}
                <TextField
                  select
                  label="Sort by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  size="small"
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="size">Size</MenuItem>
                  <MenuItem value="type">Type</MenuItem>
                </TextField>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>

                {/* View Mode Toggle */}
                <Box sx={{ display: 'flex', ml: 'auto' }}>
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                    size="small"
                  >
                    <ViewModuleIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                    size="small"
                  >
                    <ViewListIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Selection Controls */}
              {selectedDocuments.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDocuments.length} selected
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleBulkDelete}
                    >
                      Delete Selected
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={clearSelection}
                    >
                      Clear Selection
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={selectAllDocuments}
                    >
                      Select All
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Enhanced Document Grid/List */}
        {filteredAndSortedDocuments.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Documents Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {shouldUseVector ? 
                  'Upload and embed your first document to get started with advanced vector search' :
                  'Upload your first document to get started'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {/* Results Summary */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredAndSortedDocuments.length} of {shouldUseVector ? vectorDocuments.length : documents.length} documents
              {searchQuery && ` for "${searchQuery}"`}
              {shouldUseVector && ` (Vector Database)`}
            </Typography>

            {/* Document Grid/List View */}
            {viewMode === 'grid' ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                    md: "repeat(4, 1fr)",
                    lg: "repeat(6, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {filteredAndSortedDocuments.map((doc: KnowledgeDoc) => {
                  const isSelected = selectedDocuments.includes(doc.id);
                  const isDeleting = deletingDocuments.has(doc.id);
                  
                  return (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onView={() => handleDocumentClick(doc)}
                      onDelete={(id) => handleRemoveDocument(null, id)}
                      onSelect={(id) => toggleDocumentSelection(id)}
                      isSelected={isSelected}
                      isDeleting={isDeleting}
                      variant="full"
                      showSelection={true}
                      showDelete={true}
                      showPreview={true}
                    />
                  );
                })}
              </Box>
            ) : (
              /* List View */
              <Stack spacing={1}>
                {filteredAndSortedDocuments.map((doc: KnowledgeDoc) => {
                  const fileInfo = getFileTypeInfo(doc.name);
                  const IconComponent = fileInfo.icon;
                  const isSelected = selectedDocuments.includes(doc.id);
                  const isDeleting = deletingDocuments.has(doc.id);
                  
                  return (
                    <Card
                      key={doc.id}
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s ease-in-out",
                        border: isSelected ? `2px solid ${currentTheme.palette?.primary?.main}` : `1px solid ${currentTheme.palette?.divider}`,
                        "&:hover": {
                          boxShadow: 4,
                        },
                        bgcolor: isSelected ? `${currentTheme.palette?.primary?.main}08` : 'background.paper',
                        opacity: isDeleting ? 0.3 : 1,
                        transform: isDeleting ? 'scale(0.95)' : 'scale(1)',
                      }}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          toggleDocumentSelection(doc.id);
                        } else {
                          handleDocumentClick(doc);
                        }
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <IconComponent sx={{ fontSize: 32, color: fileInfo.color }} />
                          
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: 'text.primary',
                              }}
                            >
                              {doc.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                mt: 0.5,
                              }}
                            >
                              {doc.content.substring(0, 200)}...
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip 
                                label={fileInfo.category} 
                                size="small" 
                                sx={{ 
                                  bgcolor: fileInfo.color + '20',
                                  color: fileInfo.color,
                                  fontWeight: 600,
                                }}
                              />
                              {(() => {
                                const sourceInfo = getContentSourceInfo(doc, shouldUseVector);
                                return (
                                  <Chip
                                    icon={<sourceInfo.icon sx={{ fontSize: '0.8rem' }} />}
                                    label={sourceInfo.label}
                                    size="small"
                                    sx={{
                                      bgcolor: sourceInfo.bgColor,
                                      color: sourceInfo.color,
                                      fontWeight: 500,
                                      fontSize: '0.75rem',
                                      '& .MuiChip-icon': {
                                        color: sourceInfo.color,
                                      }
                                    }}
                                  />
                                );
                              })()}
                              <Chip 
                                label={formatFileSize(doc.content.length * 2)} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDocumentSelection(doc.id);
                              }}
                              sx={{ 
                                width: 32,
                                height: 32,
                                bgcolor: isSelected ? 'primary.main' : 'transparent',
                                color: isSelected ? 'primary.contrastText' : 'text.secondary',
                                border: isSelected ? 'none' : '2px solid',
                                borderColor: 'text.secondary',
                                borderRadius: '50%',
                                '&:hover': {
                                  bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                                  borderColor: isSelected ? 'primary.dark' : 'primary.main',
                                }
                              }}
                            >
                              {isSelected ? (
                                <CheckIcon sx={{ fontSize: 16 }} />
                              ) : (
                                <Box sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%',
                                  bgcolor: 'transparent'
                                }} />
                              )}
                            </IconButton>
                            
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(e, doc);
                              }}
                              sx={{ 
                                textTransform: 'none',
                                height: { xs: 32, sm: 36, md: 40 }, // Responsive height matching grid view
                                minWidth: { xs: 90, sm: 100, md: 110 }, // Consistent width
                                borderWidth: 2,
                                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }, // Responsive font
                                fontWeight: 600,
                                px: { xs: 1, sm: 1.5 }, // Responsive padding
                                '&:hover': {
                                  borderWidth: 2,
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                  transform: 'translateY(-1px)',
                                  boxShadow: 2,
                                },
                              }}
                              startIcon={<DownloadIcon sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} />}
                            >
                              Download
                            </Button>
                            
                            <IconButton
                              onClick={(e) => handleRemoveDocument(e, doc.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}

            {/* No Results */}
            {filteredAndSortedDocuments.length === 0 && (
              <Card sx={{ textAlign: 'center', py: 6 }}>
                <CardContent>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No documents found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search or filter criteria
                  </Typography>
                  <Button
                    variant="text"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    sx={{ mt: 2 }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Remove old upload area and document grid - they're replaced by the enhanced versions above */}

        {/* Enhanced Clear All Documents Dialog */}
        <Dialog open={clearDocsDialogOpen} onClose={() => setClearDocsDialogOpen(false)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              Clear All Documents?
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently delete all {documents.length} documents from your local browser storage. 
              This action cannot be undone.
            </DialogContentText>
            {documents.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You will lose {statistics.totalSize} of document content
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearDocsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleClearAllDocuments}
              color="error"
              variant="contained"
              startIcon={<DeleteIcon />}
            >
              Delete All Documents
            </Button>
          </DialogActions>
        </Dialog>

        {/* Knowledge File Modal */}
        <KnowledgeFileModal 
          open={!!selectedDoc} 
          onClose={() => setSelectedDoc(null)} 
          doc={selectedDoc}
          isVectorDocument={shouldUseVector && !!selectedDoc}
        />

        {/* Success/Error Snackbar */}
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

        {/* Quick Actions Panel (when documents are selected) */}
        {selectedDocuments.length > 0 && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow: 4,
              p: 2,
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" sx={{ mr: 2 }}>
              {selectedDocuments.length} selected
            </Typography>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              Delete
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </Box>
        )}

        {/* Vector Processing Overlay */}
        <ProcessingOverlay
          open={processingState.isVisible}
          currentStep={processingState.step}
          progress={processingState.progress}
          title={processingState.title}
          customMessages={processingState.customMessages}
        />
      </Box>
    </Box>
  );
};

export default KnowledgeTab;
