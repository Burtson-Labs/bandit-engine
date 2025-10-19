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

// Bandit Engine Watermark: BL-WM-10D4-7CC05E
const __banditFingerprint_components_BrandingTabtsx = 'BL-FP-9A095E-D769';
const __auditTrail_components_BrandingTabtsx = 'BL-AU-MGOIKVVH-B385';
// File: BrandingTab.tsx | Path: src/management/components/BrandingTab.tsx | Hash: 10d4d769

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Paper,
  Chip,
  Alert,
  Fade,
  Skeleton,
  Stack,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import PreviewIcon from '@mui/icons-material/Preview';
import RestoreIcon from '@mui/icons-material/Restore';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SaveIcon from '@mui/icons-material/Save';
import LogoCropper from '../../components/LogoCropper';

// Default logos from CDN
const banditAiLogo = "https://cdn.burtson.ai/logos/bandit-ai-logo-simple.png";
const lightLogo = "https://cdn.burtson.ai/logos/bandit-ai-logo-simple-alt.png";

interface BrandingTabProps {
  logoFile: File | null;
  logoBase64: string | null;
  brandingText: string;
  setBrandingText: (text: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  predefinedThemes: Record<string, ThemeOptions & { name: string }>;
  handleLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRestoreDefaults: () => void;
  handleExportConfig: () => void;
  handleImportConfig: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveBranding: () => void;
  setLogoFile?: (file: File | null) => void;
  setLogoBase64?: (base64: string | null) => void;
}

const BrandingTab: React.FC<BrandingTabProps> = ({
  logoFile,
  logoBase64,
  brandingText,
  setBrandingText,
  theme,
  setTheme,
  predefinedThemes,
  handleLogoUpload,
  handleRestoreDefaults,
  handleExportConfig,
  handleImportConfig,
  handleSaveBranding,
  setLogoFile,
  setLogoBase64,
}) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [dragOver, setDragOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get the appropriate default logo based on theme mode
  const getDefaultLogo = () => {
    // Use Material-UI theme mode for better accuracy
    return muiTheme.palette.mode === 'light' ? lightLogo : banditAiLogo;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && (files[0].type === 'image/png' || files[0].type === 'image/jpeg' || files[0].type === 'image/jpg')) {
      handleImageUpload(files[0]);
    }
  };

  const handleImageUpload = (file: File) => {
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setSnackbarMessage('Please select a JPG or PNG image file.');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSnackbarMessage('Image file size must be less than 10MB.');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      return;
    }

    setSelectedImageFile(file);
    setCropperOpen(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleCropComplete = (croppedImageData: string) => {
    // Create a fake event to work with existing handleLogoUpload
    const fakeEvent = {
      target: {
        files: null,
        value: ''
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    // Set the base64 directly if we have setters
    if (setLogoBase64 && setLogoFile) {
      setLogoBase64(croppedImageData);
      setLogoFile(null);
    } else {
      // Fallback to existing handler
      handleLogoUpload(fakeEvent);
    }

    setCropperOpen(false);
    setSelectedImageFile(null);

    setSnackbarMessage('Logo cropped and applied successfully!');
    setSnackbarSeverity('success');
    setShowSnackbar(true);
  };

  const handleCropperClose = () => {
    setCropperOpen(false);
    setSelectedImageFile(null);
  };

  const handleSaveWithFeedback = async () => {
    setSaveStatus('saving');
    try {
      await handleSaveBranding();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleExportWithFeedback = async () => {
    try {
      await handleExportConfig();
      setSnackbarMessage('Branding configuration exported successfully');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage('Failed to export branding configuration');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const handleImportWithFeedback = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await handleImportConfig(event);
      setSnackbarMessage('Branding configuration imported successfully');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage('Failed to import branding configuration');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const handleResetWithFeedback = async () => {
    try {
      await handleRestoreDefaults();
      setSnackbarMessage('Branding settings reset to defaults');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage('Failed to reset branding settings');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const handleDeleteLogo = () => {
    // Reset the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Use direct state setters if available, otherwise try the upload handler
    if (setLogoFile && setLogoBase64) {
      setLogoFile(null);
      setLogoBase64(null);
    } else {
      // Fallback to the upload handler approach
      const fakeEvent = {
        target: {
          files: null,
          value: ''
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleLogoUpload(fakeEvent);
    }
  };

  return (
    <Box sx={{ height: "100%", display: 'flex', flexDirection: 'column', p: { xs: 1.5, sm: 2 } }}>
      {/* Header Section */}
      <Box sx={{ mb: { xs: 2, md: 3 }, flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "primary.main", fontSize: { xs: '1.55rem', md: '1.8rem' } }}
        >
          Branding & Themes
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.5 }}
        >
          Customize your brand identity and visual appearance.
        </Typography>

        <Alert severity="info" sx={{ borderRadius: 2, px: { xs: 1.5, sm: 2 }, py: { xs: 1.25, sm: 1.5 } }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.82rem', sm: '0.88rem' }, lineHeight: 1.6 }}>
            <strong>Logo requirements:</strong> JPG or PNG up to 10MB. Uploads open a built-in cropper to help you
            finalize the perfect size. Leave any fields blank to fall back to Bandit defaults.
          </Typography>
        </Alert>
      </Box>

      {/* Main Content Section */}
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 1.5, md: 2.5 },
          mb: { xs: 2, md: 3 },
        }}
      >
        {/* Logo Upload and Branding Text Section */}
        <Box
          sx={{
            width: { xs: '100%', md: '26%' },
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: 320 },
            gap: { xs: 2, md: 0 },
          }}
        >
          {/* Logo Upload Section - Fixed height to match preview */}
          <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem', color: "text.primary" }}>
              <UploadIcon color="primary" fontSize="small" />
              Logo Upload
            </Typography>

            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : logoBase64 ? 'success.main' : 'info.main',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragOver ? 'action.hover' : logoBase64 ? 'success.50' : 'info.50',
                transition: 'all 0.3s ease',
                position: 'relative',
                flex: '1 1 auto',
                minHeight: 160,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  '& .upload-icon': {
                    color: 'primary.main',
                  }
                }
              }}
            >
              {logoBase64 || getDefaultLogo() ? (
                <Fade in={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <img
                      src={logoBase64 || getDefaultLogo()}
                      alt="Logo Preview"
                      style={{
                        maxWidth: '140px',
                        maxHeight: '140px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        imageRendering: 'auto' as const,
                        objectFit: 'contain',
                        filter: 'contrast(1.1) saturate(1.05)',
                      }}
                    />
                    <Typography variant="body2" color={logoBase64 ? "success.main" : "info.main"} sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {logoBase64 ? "✓ Custom Logo" : "Default Logo"}
                    </Typography>
                    {!logoBase64 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', textAlign: 'center' }}>
                        🎯 Click to upload & crop your logo
                      </Typography>
                    )}
                  </Box>
                </Fade>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <UploadIcon
                    className="upload-icon"
                    sx={{
                      fontSize: 56,
                      color: 'text.secondary',
                      transition: 'color 0.3s ease'
                    }}
                  />
                  <Typography variant="body2" color="text.primary" sx={{ fontSize: '1rem' }}>
                    {dragOver ? 'Drop here' : '🎯 Upload & Crop Logo'}
                  </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.82rem', textAlign: 'center' }}>
                JPG/PNG • Drag & drop or tap to upload • Built-in cropper
              </Typography>
            </Box>
          )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                hidden
                onChange={handleFileInputChange}
              />
            </Box>

            {logoBase64 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ flex: 1, fontSize: '0.8rem', py: 0.75 }}
                >
                  Replace
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteLogo}
                  sx={{ flex: 1, fontSize: '0.8rem', py: 0.75 }}
                >
                  Remove
                </Button>
              </Box>
            )}
          </Box>
          {/* Branding Text Section - Fixed at bottom */}
          <Box sx={{ mt: 2, flex: '0 0 auto' }}>
            <TextField
              label="Custom Branding Text"
              variant="outlined"
              value={brandingText}
              onChange={(e) => setBrandingText(e.target.value)}
              fullWidth
              placeholder="e.g., Powered by YourCompany"
              size="small"
              sx={{
                '& .MuiInputBase-root': { fontSize: '0.85rem' },
                '& .MuiFormHelperText-root': { fontSize: '0.7rem' }
              }}
            />
          </Box>
        </Box>
        {/* Live Preview Section */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem', color: "text.primary" }}>
            <PreviewIcon color="primary" fontSize="small" />
            Live Preview
          </Typography>
          {/* New Chat Preview - closer to real chat page */}
          <Box
            sx={{
              height: { xs: 260, md: 320 },
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              bgcolor: 'background.default',
              borderRadius: 2,
              overflow: 'hidden',
              px: 2,
              py: 3,
            }}
          >
            {/* Centered Logo - Top section */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: '1 1 auto',
              minHeight: 0
            }}>
              {logoBase64 || getDefaultLogo() ? (
                <img
                  src={logoBase64 || getDefaultLogo()}
                  alt="Logo Preview"
                  style={{
                    maxWidth: '320px',
                    height: 'auto',
                    imageRendering: 'auto' as const,
                    objectFit: 'contain',
                    filter: 'contrast(1.1) saturate(1.05)',
                  }}
                />
              ) : (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Skeleton
                    variant="rectangular"
                    width={160}
                    height={40}
                    sx={{
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                    }}
                  />
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                    Logo preview
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Chat Interface - Bottom section */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              flex: '0 0 auto',
              gap: 1,
            }}>
              {/* Conversation Starters */}
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    width={80}
                    height={24}
                    sx={{
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }}
                  />
                ))}
              </Stack>

              {/* Chat Input */}
              <Paper elevation={3} sx={{ px: 2, py: 1.5, borderRadius: 2, width: '100%', maxWidth: 500 }}>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  What's on your mind?
                </Typography>
              </Paper>

              {/* Branding Footer */}
              <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary', mt: 1 }}>
                {brandingText ? `${brandingText} • ` : 'Bandit AI • '}may be wrong — double-check important info.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Theme Selection - Compact */}
      <Paper sx={{ p: 2, borderRadius: 2, flex: '0 0 auto', mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, fontSize: '1rem', color: "text.primary" }}>
          Theme Selection
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "repeat(4, 1fr)",
              sm: "repeat(6, 1fr)",
              md: "repeat(8, 1fr)",
              lg: "repeat(10, 1fr)",
              xl: "repeat(12, 1fr)",
            },
          }}
        >
          {Object.values(predefinedThemes).map((themeOption) => {
            const isSelected = themeOption.name === theme;
            return (
              <Card
                key={themeOption.name}
                onClick={() => setTheme(themeOption.name)}
                sx={{
                  cursor: "pointer",
                  border: isSelected ? "2px solid" : "1px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  borderRadius: 1.5,
                  transition: "all 0.2s ease",
                  position: 'relative',
                  overflow: 'visible',
                  "&:hover": {
                    transform: 'scale(1.05)',
                    boxShadow: 2,
                    borderColor: "primary.main",
                  },
                }}
                elevation={isSelected ? 2 : 0}
              >
                {isSelected && (
                  <Chip
                    label="Selected"
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      zIndex: 1,
                      fontSize: '0.6rem',
                      height: 16,
                    }}
                  />
                )}
                <CardContent sx={{ p: 1 }}>
                  <Box
                    sx={{
                      height: 40,
                      backgroundColor: themeOption.palette?.background?.default,
                      borderRadius: 1,
                      position: "relative",
                      border: "1px solid",
                      borderColor: "divider",
                      mb: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        left: 4,
                        width: 12,
                        height: 12,
                        backgroundColor: themeOption.palette?.primary?.main,
                        borderRadius: "50%",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 12,
                        height: 12,
                        backgroundColor: themeOption.palette?.secondary?.main,
                        borderRadius: "50%",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        right: 4,
                        height: 2,
                        backgroundColor: themeOption.palette?.primary?.main,
                        borderRadius: 1,
                        opacity: 0.7,
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: "center",
                      color: "text.primary",
                      fontWeight: 600,
                      fontSize: "0.65rem",
                      display: 'block',
                      lineHeight: 1.2,
                    }}
                  >
                    {themeOption.name}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Paper>

      {/* Action Buttons - Compact */}
      <Paper sx={{ p: 2, borderRadius: 2, flex: '0 0 auto' }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, fontSize: '1rem', color: "text.primary" }}>
          Actions
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ flexBasis: { xs: 'calc(50% - 6px)', sm: 'calc(25% - 9px)' } }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={handleSaveWithFeedback}
              disabled={saveStatus === 'saving'}
              color={saveStatus === 'saved' ? 'success' : saveStatus === 'error' ? 'error' : 'primary'}
              sx={{ height: 36, fontSize: '0.8rem' }}
            >
              {saveStatus === 'saving' ? 'Saving...' :
                saveStatus === 'saved' ? '✓ Saved' :
                  saveStatus === 'error' ? '✗ Error' : 'Save'}
            </Button>
          </Box>

          <Box sx={{ flexBasis: { xs: 'calc(50% - 6px)', sm: 'calc(25% - 9px)' } }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={handleExportWithFeedback}
              sx={{ height: 36, fontSize: '0.8rem' }}
            >
              Export
            </Button>
          </Box>

          <Box sx={{ flexBasis: { xs: 'calc(50% - 6px)', sm: 'calc(25% - 9px)' } }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<FileUploadIcon />}
              onClick={() => importInputRef.current?.click()}
              sx={{ height: 36, fontSize: '0.8rem' }}
            >
              Import
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              hidden
              onChange={handleImportWithFeedback}
            />
          </Box>

          <Box sx={{ flexBasis: { xs: 'calc(50% - 6px)', sm: 'calc(25% - 9px)' } }}>
            <Button
              variant="outlined"
              fullWidth
              color="warning"
              startIcon={<RestoreIcon />}
              onClick={handleResetWithFeedback}
              sx={{ height: 36, fontSize: '0.8rem' }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Paper>

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

      {/* Logo Cropper Dialog */}
      <LogoCropper
        open={cropperOpen}
        onClose={handleCropperClose}
        onCrop={handleCropComplete}
        imageFile={selectedImageFile}
      />
    </Box>
  );
};

export default BrandingTab;
