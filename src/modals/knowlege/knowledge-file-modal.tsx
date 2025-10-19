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

// Bandit Engine Watermark: BL-WM-C410-8CA568
const __banditFingerprint_knowlege_knowledgefilemodaltsx = 'BL-FP-823E15-0B23';
const __auditTrail_knowlege_knowledgefilemodaltsx = 'BL-AU-MGOIKVVO-T646';
// File: knowledge-file-modal.tsx | Path: src/modals/knowlege/knowledge-file-modal.tsx | Hash: c4100b23

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import CodeIcon from "@mui/icons-material/Code";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DataObjectIcon from "@mui/icons-material/DataObject";
import ArticleIcon from "@mui/icons-material/Article";
import { KnowledgeDoc } from "../../store/knowledgeStore";
import { useVectorStore } from "../../hooks/useVectorStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import type { Root, Element, Text } from "hast";
import { getHighlightTree } from "../../utils/lowlight";
import { renderLowlightChildren } from "../../utils/markdownRendering";
import { debugLogger } from "../../services/logging/debugLogger";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

type FileTypeInfo = {
  icon: React.ElementType;
  color: string;
  category: string;
  language?: string;
};

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
    
    // Web languages
    'js': { icon: CodeIcon, color: '#f7df1e', category: 'Code', language: 'JavaScript' },
    'jsx': { icon: CodeIcon, color: '#61dafb', category: 'Code', language: 'JavaScript' },
    'ts': { icon: CodeIcon, color: '#3178c6', category: 'Code', language: 'TypeScript' },
    'tsx': { icon: CodeIcon, color: '#61dafb', category: 'Code', language: 'TypeScript' },
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

const isPDF = (filename: string): boolean => filename.toLowerCase().endsWith('.pdf');

const LANGUAGE_MAP: Record<string, string> = {
  // Web technologies
  'js': 'javascript',
  'jsx': 'jsx',
  'ts': 'typescript',
  'tsx': 'tsx',
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',

  // Data formats
  'json': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'yml': 'yaml',
  'csv': 'csv',

  // Systems programming
  'c': 'c',
  'cpp': 'cpp',
  'cxx': 'cpp',
  'cc': 'cpp',
  'h': 'c',
  'hpp': 'cpp',
  'cs': 'csharp',
  'java': 'java',
  'py': 'python',
  'go': 'go',
  'rs': 'rust',
  'kt': 'kotlin',
  'swift': 'swift',
  'scala': 'scala',
  'rb': 'ruby',
  'php': 'php',

  // Scripting
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'fish': 'bash',
  'bat': 'batch',
  'cmd': 'batch',
  'ps1': 'powershell',

  // Markup and documentation
  'md': 'markdown',
  'markdown': 'markdown',
  'tex': 'latex',
  'sql': 'sql',

  // Configuration
  'ini': 'ini',
  'conf': 'ini',
  'config': 'ini',
  'toml': 'toml',
  'dockerfile': 'docker',

  // Other
  'r': 'r',
  'matlab': 'matlab',
  'm': 'matlab',
  'lua': 'lua',
  'perl': 'perl',
  'pl': 'perl',
};

const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  return LANGUAGE_MAP[ext] || 'text';
};

const isCodeFile = (filename: string): boolean => getLanguageFromFilename(filename) !== 'text';

const formatJsonContent = (content: string): string => {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
};

const getFormattedContent = (content: string, filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop() || '';

  if (ext === 'json') {
    return formatJsonContent(content);
  }

  return content;
};

interface Props {
  open: boolean;
  onClose: () => void;
  doc: KnowledgeDoc | null;
  isVectorDocument?: boolean;
}

const KnowledgeFileModal: React.FC<Props> = ({ open, onClose, doc, isVectorDocument = false }) => {
  const [fullContent, setFullContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.2);
  const [pdfCanvases, setPdfCanvases] = useState<HTMLCanvasElement[]>([]);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { downloadVectorFile, getFileBlob } = useVectorStore();
  const packageSettings = usePackageSettingsStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  const isDarkTheme = theme.palette.mode === 'dark';

  useEffect(() => {
    if (typeof window !== 'undefined') {
 
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.burtson.ai/scripts/pdf.worker.js';
    }
  }, [])
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  const baseContent = fullContent || doc?.content || '';
  const filename = doc?.name || '';
  const formattedContent = useMemo(
    () => getFormattedContent(baseContent, filename),
    [baseContent, filename]
  );

  const highlightLanguage = useMemo(() => {
    if (!filename || !isCodeFile(filename)) {
      return "";
    }
    return getLanguageFromFilename(filename).toLowerCase();
  }, [filename]);

  const highlightTree = useMemo<Root | null>(() => {
    if (!highlightLanguage) {
      return null;
    }
    return getHighlightTree(formattedContent, highlightLanguage);
  }, [formattedContent, highlightLanguage]);

  const highlightedNodes = useMemo(() => {
    if (!highlightTree) {
      return [] as React.ReactNode[];
    }

    const highlightChildren = (highlightTree.children || []).filter((node): node is Element | Text => {
      return node.type === "element" || node.type === "text";
    });

    return renderLowlightChildren(
      highlightChildren,
      `hl-doc-${highlightLanguage || "auto"}`
    );
  }, [highlightTree, highlightLanguage]);

  const resolvedHighlightLanguage = useMemo(() => {
    const data = highlightTree?.data;
    if (data && typeof data === "object" && data !== null && "language" in data) {
      const languageValue = (data as { language?: unknown }).language;
      if (typeof languageValue === "string") {
        return languageValue.toLowerCase();
      }
    }
    return highlightLanguage;
  }, [highlightTree, highlightLanguage]);

  const renderPdfPage = async (pdf: PDFDocumentProxy, pageNumber: number, scale: number = 1.2): Promise<HTMLCanvasElement> => {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to obtain 2D context for PDF rendering');
    }
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    return canvas;
  };

  const loadPdfDocument = useCallback(async (arrayBuffer: ArrayBuffer) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      // Render all pages
      const canvases: HTMLCanvasElement[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const canvas = await renderPdfPage(pdf, i, pdfScale);
        canvases.push(canvas);
      }
      setPdfCanvases(canvases);
    } catch (err) {
      debugLogger.error("Failed to load PDF", { error: err });
      throw err;
    }
  }, [pdfScale]);

  // Helper function to create blob from local file rawData
  const createLocalFileBlob = (doc: KnowledgeDoc): Blob => {
    if (!doc.rawData) {
      throw new Error('No raw data available for local file');
    }
    
    const binaryString = atob(doc.rawData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const mimeType = doc.type || doc.mimeType || 'application/octet-stream';
    return new Blob([bytes], { type: mimeType });
  };

  const loadPdfFromDataUrl = async (dataUrl: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      await loadPdfDocument(arrayBuffer);
    } catch (err) {
      debugLogger.error('Failed to load PDF from data URL', { error: err });
      setError('Failed to load PDF preview');
    } finally {
      setLoading(false);
    }
  };

  const loadFullContent = useCallback(async () => {
    if (!doc) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (isPDF(doc.name)) {
        // For PDF files, get the binary data and render it
        const fileBlob = await getFileBlob(doc.id);
        const arrayBuffer = await fileBlob.arrayBuffer();
        await loadPdfDocument(arrayBuffer);
      } else {
        // For text files, get the text content
        const fileBlob = await getFileBlob(doc.id);
        const content = await fileBlob.text();
        setFullContent(content);
      }
    } catch (err) {
      debugLogger.error('Failed to load full file content', { error: err });
      if (isPDF(doc.name)) {
        setError('Failed to load PDF. The file may be corrupted or too large.');
      } else {
        setError('Failed to load full file content. Showing preview instead.');
        setFullContent(doc.content || '');
      }
    } finally {
      setLoading(false);
    }
  }, [doc, getFileBlob, loadPdfDocument]);

  useEffect(() => {
    if (open && doc && isVectorDocument) {
      loadFullContent();
    } else if (open && doc) {
      if (isPDF(doc.name)) {
        if (doc.rawData) {
          try {
            const blob = createLocalFileBlob(doc);
            const arrayBuffer = blob.arrayBuffer();
            arrayBuffer.then(loadPdfDocument).catch(err => {
              debugLogger.error("Failed to load local PDF", { error: err });
              setError('Failed to load PDF preview');
            });
          } catch (err) {
            debugLogger.error("Failed to create blob from local PDF data", { error: err });
            setError('PDF preview not available for this document');
          }
        } else {
          setError('PDF preview not available for this document');
        }
      } else {
        setFullContent(doc.content || '');
      }
    }
    
    if (!open) {
      setPdfDocument(null);
      setPdfCanvases([]);
      setCurrentPage(1);
      setTotalPages(0);
      setPdfScale(1.2);
      setFullContent('');
      setError(null);
      setViewMode('formatted');
    }
  }, [open, doc, isVectorDocument, loadFullContent, loadPdfDocument]);

  const handleZoomIn = async () => {
    // Clear any existing timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    
    const newScale = Math.min(pdfScale + 0.25, 3.0);
    setPdfScale(newScale);
    
    // Debounce the actual re-rendering to prevent rapid successive calls
    zoomTimeoutRef.current = setTimeout(async () => {
      if (pdfDocument) {
        setLoading(true);
        try {
          const canvases: HTMLCanvasElement[] = [];
          for (let i = 1; i <= pdfDocument.numPages; i++) {
            const canvas = await renderPdfPage(pdfDocument, i, newScale);
            canvases.push(canvas);
          }
          setPdfCanvases(canvases);
        } catch (error) {
          debugLogger.error('Zoom in failed', { error });
          // Revert to previous scale on error
          setPdfScale(pdfScale);
        } finally {
          setLoading(false);
        }
      }
    }, 300); // 300ms debounce
  };

  const handleZoomOut = async () => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    
    const newScale = Math.max(pdfScale - 0.25, 0.5);
    setPdfScale(newScale);
    
    zoomTimeoutRef.current = setTimeout(async () => {
      if (pdfDocument) {
        setLoading(true);
        try {
          const canvases: HTMLCanvasElement[] = [];
          for (let i = 1; i <= pdfDocument.numPages; i++) {
            const canvas = await renderPdfPage(pdfDocument, i, newScale);
            canvases.push(canvas);
          }
          setPdfCanvases(canvases);
        } catch (error) {
          debugLogger.error('Zoom out failed', { error });
          setPdfScale(pdfScale);
        } finally {
          setLoading(false);
        }
      }
    }, 300);
  };

  const handleDownload = async () => {
    if (!doc || !isVectorDocument) return;
    
    try {
      await downloadVectorFile(doc.id, doc.name);
    } catch (err) {
      debugLogger.error('Vector document download failed', { error: err, docId: doc.id });
    }
  };
  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          {/* Document info section with badge and title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {/* Document type badge */}
            {doc && (
              <Box sx={{ mr: 1, flexShrink: 0 }}>
                {(() => {
                  const fileInfo = getFileTypeInfo(doc.name);
                  const IconComponent = fileInfo.icon;
                  return (
                    <Tooltip title={`${fileInfo.category} file`} placement="bottom">
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          bgcolor: fileInfo.color, 
                          color: 'white', 
                          borderRadius: 1, 
                          px: 1, 
                          py: 0.25,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        <IconComponent sx={{ fontSize: '1rem', mr: 0.5 }} />
                        {fileInfo.language || fileInfo.category}
                      </Box>
                    </Tooltip>
                  );
                })()}
              </Box>
            )}
            
            {/* Title with responsive truncation */}
            <Tooltip title={doc?.name || ''} placement="bottom-start">
              <Typography 
                sx={{ 
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  // Responsive max width for title truncation
                  maxWidth: {
                    xs: '120px',    // Mobile: very short for small screens (reduced to account for badge)
                    sm: '180px',    // Small tablet: short (reduced)
                    md: '280px',    // Medium: medium length (reduced)
                    lg: '380px',    // Large: longer (reduced)
                    xl: '480px'     // Extra large: longest (reduced)
                  },
                  cursor: 'help' // Indicate tooltip is available
                }} 
                variant="h6"
              >
                {doc?.name}
              </Typography>
            </Tooltip>
            
            {/* Additional file info - only show page count for PDFs */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, ml: 1 }}>
              {isPDF(doc?.name || '') && totalPages > 0 && (
                <Typography component="span" variant="body2" sx={{ opacity: 0.8 }}>
                  ({totalPages} page{totalPages > 1 ? 's' : ''})
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Toolbar actions section */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 1 }}>
            {/* Code View Toggle for non-PDF files */}
            {!isPDF(doc?.name || '') && isCodeFile(doc?.name || '') && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="formatted" sx={{ color: 'inherit' }}>
                  <CodeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Formatted
                </ToggleButton>
                <ToggleButton value="raw" sx={{ color: 'inherit' }}>
                  <TextFieldsIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Raw
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            
            {/* PDF Navigation Controls - Hidden on mobile */}
            {isPDF(doc?.name || '') && pdfDocument && !isMobile && (
              <>
                <Button 
                  color="inherit" 
                  startIcon={<ZoomOutIcon />}
                  onClick={handleZoomOut}
                  disabled={pdfScale <= 0.5}
                  size="small"
                >
                  Zoom Out
                </Button>
                <Typography variant="body2" sx={{ color: 'inherit', mx: 1 }}>
                  {Math.round(pdfScale * 100)}%
                </Typography>
                <Button 
                  color="inherit" 
                  startIcon={<ZoomInIcon />}
                  onClick={handleZoomIn}
                  disabled={pdfScale >= 3.0}
                  size="small"
                >
                  Zoom In
                </Button>
              </>
            )}
            
            {/* Download and Close buttons */}
            {isVectorDocument && (
              <IconButton edge="end" color="inherit" onClick={handleDownload}>
                <DownloadIcon />
              </IconButton>
            )}
            <IconButton edge="end" color="inherit" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3, bgcolor: "background.default", height: "100%", overflowY: "auto" }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              {isPDF(doc?.name || '') ? 'Loading PDF document...' : 'Loading full file content...'}
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!loading && isPDF(doc?.name || '') && pdfCanvases.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {pdfCanvases.map((canvas, index) => (
              <Paper 
                key={index} 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  maxWidth: '100%',
                  overflow: 'auto',
                  // Custom scrollbar styling for PDF viewer
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: isDarkTheme ? '#2d2d2d' : '#f5f5f5',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: isDarkTheme ? '#555' : '#c1c1c1',
                    borderRadius: '4px',
                    '&:hover': {
                      background: isDarkTheme ? '#666' : '#a1a1a1',
                    },
                  },
                  '&::-webkit-scrollbar-corner': {
                    background: isDarkTheme ? '#2d2d2d' : '#f5f5f5',
                  },
                  // Firefox scrollbar support
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDarkTheme ? '#555 #2d2d2d' : '#c1c1c1 #f5f5f5',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Page {index + 1} of {totalPages}
                </Typography>
                <Box
                  ref={(el: HTMLDivElement | null) => {
                    if (el && canvas) {
                      el.innerHTML = '';
                      el.appendChild(canvas);
                    }
                  }}
                  sx={{
                    '& canvas': {
                      display: 'block',
                      maxWidth: '100%',
                      height: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                    }
                  }}
                />
              </Paper>
            ))}
          </Box>
        )}
        
        {!loading && !isPDF(doc?.name || '') && (
          <Box>
            {isCodeFile(doc?.name || '') && viewMode === 'formatted' ? (
              <Box>
                {/* Language indicator */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Syntax highlighted as <strong>{getLanguageFromFilename(doc?.name || '').toUpperCase()}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(fullContent || doc?.content || '').split('\n').length} lines
                  </Typography>
                </Box>
                
                <Paper 
                  elevation={1} 
                  sx={{ 
                    overflow: 'auto',
                    maxHeight: { xs: 'calc(100vh - 320px)', sm: 'calc(100vh - 280px)' },
                    border: '1px solid',
                    borderColor: 'divider',
                    // Custom scrollbar styling to match theme
                    '&::-webkit-scrollbar': {
                      width: { xs: '8px', sm: '12px' },
                      height: { xs: '8px', sm: '12px' },
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: isDarkTheme ? '#2d2d2d' : '#f5f5f5',
                      borderRadius: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: isDarkTheme ? '#555' : '#c1c1c1',
                      borderRadius: '6px',
                      border: isDarkTheme ? '2px solid #2d2d2d' : '2px solid #f5f5f5',
                      '&:hover': {
                        backgroundColor: isDarkTheme ? '#777' : '#a8a8a8',
                      },
                    },
                    '&::-webkit-scrollbar-corner': {
                      backgroundColor: isDarkTheme ? '#2d2d2d' : '#f5f5f5',
                    },
                    // Firefox scrollbar styling
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDarkTheme ? '#555 #2d2d2d' : '#c1c1c1 #f5f5f5',
                    '& pre': {
                      margin: 0,
                      padding: { xs: '12px !important', sm: '16px !important' },
                      borderRadius: '8px',
                      fontSize: { xs: '12px', sm: '14px' },
                      lineHeight: 1.5,
                      // Better mobile text handling
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }
                  }}
                >
                  <Box
                    sx={{
                      '& .hljs': {
                        display: 'block',
                        padding: { xs: '12px', sm: '16px' },
                        margin: 0,
                        fontSize: { xs: '12px', sm: '14px' },
                        lineHeight: 1.55,
                        backgroundColor: isDarkTheme ? '#0f172a' : '#f5f6ff',
                        color: isDarkTheme ? '#e2e8f0' : '#1e293b',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      },
                      '& .hljs-comment, & .hljs-quote': {
                        color: isDarkTheme ? '#64748b' : '#64748b',
                        fontStyle: 'italic',
                      },
                      '& .hljs-keyword, & .hljs-selector-tag, & .hljs-literal, & .hljs-built_in': {
                        color: isDarkTheme ? '#c792ea' : '#7c3aed',
                      },
                      '& .hljs-string, & .hljs-doctag, & .hljs-template-tag, & .hljs-attr': {
                        color: isDarkTheme ? '#7fdbca' : '#0f766e',
                      },
                      '& .hljs-number, & .hljs-symbol, & .hljs-bullet, & .hljs-meta': {
                        color: isDarkTheme ? '#f78c6c' : '#b45309',
                      },
                      '& .hljs-title, & .hljs-section, & .hljs-selector-id, & .hljs-function': {
                        color: isDarkTheme ? '#82aaff' : '#2563eb',
                      },
                      '& .hljs-variable, & .hljs-params, & .hljs-property': {
                        color: isDarkTheme ? '#f07178' : '#d97706',
                      },
                    }}
                  >
                    <pre className={`hljs language-${resolvedHighlightLanguage || 'text'}`}>
                      <code className="hljs">
                        {highlightedNodes.length > 0 ? highlightedNodes : formattedContent}
                      </code>
                    </pre>
                  </Box>
                </Paper>
              </Box>
            ) : (
              <Typography
                component="pre"
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  color: "text.primary",
                  lineHeight: 1.5,
                  bgcolor: 'background.paper',
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'auto',
                  maxHeight: 'calc(100vh - 200px)',
                }}
              >
                {fullContent || doc?.content}
              </Typography>
            )}
          </Box>
        )}
        
        {!loading && isPDF(doc?.name || '') && pdfCanvases.length === 0 && !error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              PDF Preview Not Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This PDF file cannot be previewed. You can download it to view the full content.
            </Typography>
            {isVectorDocument && (
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ mt: 2 }}
              >
                Download PDF
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default KnowledgeFileModal;
