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

// Bandit Engine Watermark: BL-WM-AC9A-B43BC2
const __banditFingerprint_shared_DocumentCardtsx = 'BL-FP-3F514D-0451';
const __auditTrail_shared_DocumentCardtsx = 'BL-AU-MGOIKVW1-S428';
// File: DocumentCard.tsx | Path: src/shared/DocumentCard.tsx | Hash: ac9a0451

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Tooltip,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ArticleIcon from "@mui/icons-material/Article";
import CodeIcon from "@mui/icons-material/Code";
import { debugLogger } from "../services/logging/debugLogger";
import DataObjectIcon from "@mui/icons-material/DataObject";
import PersonIcon from "@mui/icons-material/Person";
import CloudIcon from "@mui/icons-material/Cloud";
import { KnowledgeDoc } from "../store/knowledgeStore";
import { useKnowledgeStore } from "../chat/hooks/useKnowledgeStore";
import { useVectorStore } from "../hooks/useVectorStore";
import { useTheme } from "@mui/material/styles";

interface DocumentCardProps {
  doc: KnowledgeDoc;
  onView: () => void;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  isDeleting?: boolean; // For deletion animation
  variant?: 'mini' | 'full'; // Mini for chat responses, full for knowledge tab
  showSelection?: boolean;
  showDelete?: boolean;
  showPreview?: boolean;
  // New props for handling error states
  isHistoricalReference?: boolean; // True when this card is from a past conversation
  allowErrorStates?: boolean; // Whether to show error states instead of hiding the card
}

type FileTypeInfo = {
  icon: React.ElementType;
  color: string;
  category: string;
  language?: string;
};

// Enhanced file type detection (from KnowledgeTab)
const getFileTypeInfo = (filename: string): FileTypeInfo => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const languageMap: Record<string, FileTypeInfo> = {
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
    
    // Programming languages
    'js': { icon: CodeIcon, color: '#f7df1e', category: 'Code', language: 'JavaScript' },
    'jsx': { icon: CodeIcon, color: '#61dafb', category: 'Code', language: 'React' },
    'ts': { icon: CodeIcon, color: '#3178c6', category: 'Code', language: 'TypeScript' },
    'tsx': { icon: CodeIcon, color: '#61dafb', category: 'Code', language: 'React TS' },
    'py': { icon: CodeIcon, color: '#3776ab', category: 'Code', language: 'Python' },
    'java': { icon: CodeIcon, color: '#ed8b00', category: 'Code', language: 'Java' },
    'c': { icon: CodeIcon, color: '#a8b9cc', category: 'Code', language: 'C' },
    'cpp': { icon: CodeIcon, color: '#00599c', category: 'Code', language: 'C++' },
    'cs': { icon: CodeIcon, color: '#239120', category: 'Code', language: 'C#' },
    'go': { icon: CodeIcon, color: '#00add8', category: 'Code', language: 'Go' },
    'rs': { icon: CodeIcon, color: '#dea584', category: 'Code', language: 'Rust' },
    'php': { icon: CodeIcon, color: '#777bb4', category: 'Code', language: 'PHP' },
    'rb': { icon: CodeIcon, color: '#cc342d', category: 'Code', language: 'Ruby' },
    'kt': { icon: CodeIcon, color: '#7f52ff', category: 'Code', language: 'Kotlin' },
    'swift': { icon: CodeIcon, color: '#fa7343', category: 'Code', language: 'Swift' },
    
    // Data files
    'json': { icon: DataObjectIcon, color: '#ffd600', category: 'Data', language: 'JSON' },
    'xml': { icon: DataObjectIcon, color: '#ff6600', category: 'Data', language: 'XML' },
    'yaml': { icon: DataObjectIcon, color: '#cb171e', category: 'Data', language: 'YAML' },
    'yml': { icon: DataObjectIcon, color: '#cb171e', category: 'Data', language: 'YAML' },
    'csv': { icon: DataObjectIcon, color: '#14a085', category: 'Data', language: 'CSV' },
  };

  return languageMap[ext] || { icon: DescriptionIcon, color: '#666', category: 'File' };
};

// Content source info (from KnowledgeTab)
const getContentSourceInfo = (doc: KnowledgeDoc, shouldUseVector: boolean) => {
  if (shouldUseVector && doc.s3Url) {
    // Vector database document
    return {
      icon: CloudIcon,
      label: doc.isTeamContent ? 'Team Cloud' : 'Cloud',
      color: '#1976d2',
      bgColor: '#1976d220',
    };
  } else {
    // Local document
    return {
      icon: PersonIcon,
      label: 'Local',
      color: '#388e3c',
      bgColor: '#388e3c20',
    };
  }
};

// Format file size utility
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  onView,
  onDelete,
  onSelect,
  isSelected = false,
  isDeleting = false,
  variant = 'mini',
  showSelection = false,
  showDelete = false,
  showPreview = true,
  isHistoricalReference = false,
  allowErrorStates = true,
}) => {
  const theme = useTheme();
  const { isVectorDocument } = useKnowledgeStore();
  const { downloadVectorFile, isVectorEnabled } = useVectorStore();
  const [documentState, setDocumentState] = useState<'available' | 'unavailable' | 'access-changed' | 'checking'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check document availability and access status
  useEffect(() => {
    const checkDocumentStatus = async () => {
      try {
        const isVector = isVectorDocument(doc);
        
        // Case 1: Vector document but vector access is now disabled
        if (isVector && !isVectorEnabled) {
          setDocumentState('access-changed');
          setErrorMessage('Vector database access disabled. Document not accessible.');
          return;
        }
        
        // Case 2: Vector document - try to verify it exists
        if (isVector) {
          try {
            // Attempt to get file blob to verify existence
            const fileId = doc.s3Url || doc.id;
            // Note: We don't actually fetch here to avoid performance issues,
            // but this is where we could add a lightweight existence check
            setDocumentState('available');
          } catch (error) {
            setDocumentState('unavailable');
            setErrorMessage('Document no longer exists in cloud storage.');
          }
        }
        // Case 3: Local document - check if it has content or rawData
        else {
          if (!doc.content && !doc.rawData) {
            setDocumentState('unavailable');
            setErrorMessage('Document content not available.');
          } else {
            setDocumentState('available');
          }
        }
      } catch (error) {
        setDocumentState('unavailable');
        setErrorMessage('Unable to verify document status.');
      }
    };

    if (isHistoricalReference) {
      checkDocumentStatus();
    } else {
      setDocumentState('available');
    }
  }, [doc, isHistoricalReference, isVectorEnabled, isVectorDocument]);
  
  const fileInfo = getFileTypeInfo(doc.name);
  const IconComponent = fileInfo.icon;
  const shouldUseVector = isVectorEnabled;
  const sourceInfo = getContentSourceInfo(doc, shouldUseVector);

  // Don't render if document is unavailable and error states are not allowed
  if (documentState === 'unavailable' && !allowErrorStates) {
    return null;
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent download if document is not available
    if (documentState !== 'available') {
      debugLogger.warn('Cannot download document - not available', { documentState, documentId: doc.id });
      return;
    }
    
    try {
      const isVector = isVectorDocument(doc);
      debugLogger.debug('Document download initiated', { name: doc.name, isVector });
      
      if (isVector) {
        const fileId = doc.s3Url || doc.id;
        debugLogger.debug('Downloading vector document', { fileId, name: doc.name });
        await downloadVectorFile(fileId, doc.name);
      } else {
        if (doc.rawData) {
          debugLogger.debug('Downloading local document from raw data', { name: doc.name });
          const binaryString = atob(doc.rawData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const mimeType = doc.type || doc.mimeType || 'application/octet-stream';
          const blob = new Blob([bytes], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = doc.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          debugLogger.debug('Downloading local document from content fallback', { name: doc.name });
          const content = doc.content || '';
          const mimeType = doc.type || doc.mimeType || 'text/plain';
          const blob = new Blob([content], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = doc.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      debugLogger.error('DocumentCard download failed', { error, documentId: doc.id, name: doc.name });
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent interaction if document is not available
    if (documentState !== 'available') {
      e.stopPropagation();
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      onSelect?.(doc.id);
    } else {
      onView();
    }
  };

  // Helper function to get error state styling
  const getErrorStateStyles = () => {
    if (documentState === 'available') return {};
    
    return {
      opacity: 0.6,
      position: 'relative',
      pointerEvents: documentState === 'checking' ? 'none' : 'auto',
      '&::after': (documentState === 'unavailable' || documentState === 'access-changed') ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(1px)',
        borderRadius: 'inherit',
        pointerEvents: 'none',
      } : {},
    };
  };

  // Helper function to render error message overlay
  const renderErrorOverlay = () => {
    if (documentState === 'available' || documentState === 'checking') return null;
    
    const errorIcon = documentState === 'access-changed' ? CloudOffIcon : ErrorOutlineIcon;
    const ErrorIcon = errorIcon;
    
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
        }}
      >
        <Tooltip title={errorMessage} arrow>
          <ErrorIcon 
            sx={{ 
              fontSize: variant === 'mini' ? 16 : 20,
              color: 'error.main',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            }} 
          />
        </Tooltip>
      </Box>
    );
  };

  if (variant === 'mini') {
    return (
      <Card
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: isSelected ? "primary.main" : "divider",
          bgcolor: isSelected ? "primary.main" + "08" : "background.paper",
          boxShadow: 4,
          width: 180,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 160,
          cursor: documentState === 'available' ? "pointer" : "not-allowed",
          transition: "all 0.2s ease-in-out",
          '&:hover': documentState === 'available' ? {
            boxShadow: 6,
            borderColor: "primary.light",
            transform: "translateY(-2px)",
          } : {},
          ...getErrorStateStyles(),
        }}
        onClick={handleCardClick}
      >
        {renderErrorOverlay()}
        
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1,
          }}
        >
          <IconComponent sx={{ fontSize: 32, color: fileInfo.color }} />
        </Box>
        
        <Tooltip title={doc.name} arrow>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "text.primary",
              fontWeight: 500,
              mb: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
            }}
          >
            {doc.name}
          </Typography>
        </Tooltip>

        <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap", justifyContent: "center" }}>
          <Chip
            icon={<sourceInfo.icon sx={{ fontSize: '0.8rem !important' }} />}
            label={sourceInfo.label}
            size="small"
            sx={{
              bgcolor: sourceInfo.bgColor,
              color: sourceInfo.color,
              fontWeight: 600,
              fontSize: '0.65rem',
            }}
          />
          <Chip 
            label={fileInfo.category} 
            size="small" 
            sx={{ 
              bgcolor: fileInfo.color + '20',
              color: fileInfo.color,
              fontWeight: 500,
              fontSize: '0.65rem',
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Tooltip title={documentState === 'available' ? "View" : "Document not available"}>
            <span>
              <Button
                size="small"
                variant="contained"
                color="primary"
                disabled={documentState !== 'available'}
                sx={{
                  px: 1.5,
                  borderRadius: "999px",
                  minWidth: 0,
                  height: 32,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (documentState === 'available') onView();
                }}
              >
                <SearchIcon fontSize="small" />
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={documentState === 'available' ? "Download" : errorMessage}>
            <span>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                disabled={documentState !== 'available'}
                sx={{
                  px: 1.5,
                  borderRadius: "999px",
                  minWidth: 0,
                  height: 32,
                }}
                onClick={handleDownload}
              >
                <DownloadIcon fontSize="small" />
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Card>
    );
  }

  // Full variant for Knowledge Tab
  return (
    <Card
      sx={{
        position: "relative",
        height: { xs: 260, sm: 280, md: 300 },
        cursor: documentState === 'available' ? "pointer" : "not-allowed",
        transition: "all 0.3s ease-in-out",
        border: isSelected ? `2px solid ${theme.palette?.primary?.main}` : `1px solid ${theme.palette?.divider}`,
        "&:hover": documentState === 'available' ? {
          boxShadow: 6,
          transform: isDeleting ? 'scale(0.9)' : 'translateY(-2px)',
        } : {},
        bgcolor: isSelected ? `${theme.palette?.primary?.main}08` : 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        opacity: isDeleting ? 0.4 : 1,
        transform: isDeleting ? 'scale(0.9)' : 'scale(1)',
        ...getErrorStateStyles(),
      }}
      onClick={handleCardClick}
    >
      {renderErrorOverlay()}
      
      <CardContent sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* File Type Icon and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, height: 32 }}>
          <IconComponent sx={{ fontSize: 32, color: fileInfo.color, flexShrink: 0 }} />
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            {showSelection && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(doc.id);
                }}
                sx={{ 
                  width: 24, 
                  height: 24,
                  bgcolor: isSelected ? 'primary.main' : 'transparent',
                  color: isSelected ? 'primary.contrastText' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                  }
                }}
              >
                {isSelected ? '✓' : '○'}
              </IconButton>
            )}
            {showDelete && (
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(doc.id);
                }}
                sx={{ width: 24, height: 24 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Document Preview */}
        {showPreview && (
          <Box
            sx={{
              mb: 1.5,
              p: { xs: 1, sm: 1.5 },
              borderRadius: 1.5,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              position: 'relative',
              height: { xs: 60, sm: 70, md: 80 },
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {doc.content && doc.content.length > 0 ? (
              <Typography
                variant="body2"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: 'text.secondary',
                  lineHeight: 1.3,
                  fontSize: '0.8rem',
                }}
              >
                {doc.content.substring(0, 100)}...
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.6 }}>
                <InfoIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" color="text.disabled">
                  No preview available
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Document Name */}
        <Tooltip title={doc.name} arrow>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              mb: 1,
              color: 'text.primary',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              height: { xs: '1.2rem', sm: '1.3rem' },
            }}
          >
            {doc.name}
          </Typography>
        </Tooltip>
        
        {/* Tags and size */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, minHeight: 40 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1, mr: 1 }}>
            <Chip
              icon={<sourceInfo.icon sx={{ fontSize: '0.9rem !important' }} />}
              label={sourceInfo.label}
              size="small"
              sx={{
                bgcolor: sourceInfo.bgColor,
                color: sourceInfo.color,
                fontWeight: 700,
                fontSize: '0.75rem',
                border: `2px solid ${sourceInfo.color}60`,
                '& .MuiChip-icon': {
                  color: `${sourceInfo.color} !important`,
                },
                boxShadow: `0 2px 4px ${sourceInfo.color}20`,
              }}
            />
            
            <Chip 
              label={fileInfo.category} 
              size="small" 
              sx={{ 
                bgcolor: fileInfo.color + '20',
                color: fileInfo.color,
                fontWeight: 500,
                fontSize: '0.65rem',
              }}
            />
            {fileInfo.language && (
              <Chip 
                label={fileInfo.language} 
                size="small" 
                sx={{ 
                  bgcolor: fileInfo.color + '15',
                  color: fileInfo.color,
                  fontWeight: 400,
                  fontSize: '0.6rem',
                  border: `1px solid ${fileInfo.color}30`,
                }}
              />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {formatFileSize((doc.content?.length || 0) * 2)}
          </Typography>
        </Box>

        {/* Download Button */}
        <Box sx={{ mt: 'auto' }}>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            disabled={documentState !== 'available'}
            sx={{ 
              textTransform: 'none',
              height: { xs: 32, sm: 36, md: 40 },
              flexShrink: 0,
              borderWidth: 2,
              fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
              fontWeight: 600,
              '&:hover': documentState === 'available' ? {
                borderWidth: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                transform: 'translateY(-1px)',
                boxShadow: 2,
              } : {},
              '&.Mui-disabled': {
                opacity: 0.6,
                borderColor: 'action.disabled',
                color: 'text.disabled',
              },
            }}
            onClick={handleDownload}
            startIcon={<DownloadIcon sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} />}
          >
            {documentState === 'available' ? 'Download' : 'Unavailable'}
          </Button>
          
          {/* Error message for full variant */}
          {documentState !== 'available' && documentState !== 'checking' && (
            <Alert 
              severity="warning" 
              sx={{ 
                mt: 1, 
                fontSize: '0.75rem',
                '& .MuiAlert-icon': { fontSize: '1rem' },
                '& .MuiAlert-message': { padding: '0' },
              }}
            >
              {errorMessage}
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;
