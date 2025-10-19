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

// Bandit Engine Watermark: BL-WM-4406-DFAD47
const __banditFingerprint_feedback_FeedbackModaltsx = 'BL-FP-226BC1-E25A';
const __auditTrail_feedback_FeedbackModaltsx = 'BL-AU-MGOIKVVA-WQG3';
// File: FeedbackModal.tsx | Path: src/components/feedback/FeedbackModal.tsx | Hash: 4406e25a

import React, { useState, useCallback, useRef } from 'react';
import { GlobalStyles } from '@mui/material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Chip,
  Alert,
  Paper,
  Avatar,
  CircularProgress,
  Fade,
  Slider,
  Stack,
  useMediaQuery,
  Snackbar,
} from '@mui/material';
import {
  Close as CloseIcon,
  BugReport as BugReportIcon,
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Help as HelpIcon,
  Message as MessageIcon,
  PhotoCamera as PhotoCameraIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Mail as MailIcon,
  PsychologyAltRounded,
  AttachFileRounded,
} from '@mui/icons-material';
import { 
  FeedbackRequest, 
  FeedbackResponse,
  FeedbackCategories, 
  FeedbackPriorities 
} from '../../services/gateway/feedback.interfaces';
import { useModelStore } from '../../store/modelStore';
import { useConversationStore } from '../../store/conversationStore';
import { usePackageSettingsStore } from '../../store/packageSettingsStore';
import { GatewayService } from '../../services/gateway/gateway.service';
import { authenticationService } from '../../services/auth/authenticationService';
import { useTheme, alpha } from '@mui/material/styles';

export interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  feedbackEmail?: string;
}

const feedbackCategories: FeedbackCategories = {
  bug: {
    label: 'Bug Report',
    description: "Something isn't working as expected",
    icon: 'BugReport',
    color: '#f44336',
  },
  feature: {
    label: 'Feature Request',
    description: 'Suggest a new feature or enhancement',
    icon: 'Lightbulb',
    color: '#2196f3',
  },
  improvement: {
    label: 'Improvement',
    description: 'Suggest improvements to existing features',
    icon: 'TrendingUp',
    color: '#ff9800',
  },
  question: {
    label: 'Question',
    description: 'Ask a question about usage or functionality',
    icon: 'Help',
    color: '#9c27b0',
  },
  other: {
    label: 'Other',
    description: 'General feedback or other topics',
    icon: 'Message',
    color: '#607d8b',
  },
};

const feedbackPriorities: FeedbackPriorities = {
  low: {
    label: 'Low',
    description: 'Minor issue, can wait',
    color: '#4caf50',
  },
  medium: {
    label: 'Medium',
    description: 'Normal priority',
    color: '#ff9800',
  },
  high: {
    label: 'High',
    description: 'Important, needs attention soon',
    color: '#f44336',
  },
  critical: {
    label: 'Critical',
    description: 'Urgent, blocks usage',
    color: '#d32f2f',
  },
};

const iconMap = {
  BugReport: BugReportIcon,
  Lightbulb: LightbulbIcon,
  TrendingUp: TrendingUpIcon,
  Help: HelpIcon,
  Message: MessageIcon,
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  onClose,
  feedbackEmail,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Store state
  const { selectedModel } = useModelStore();
  const { conversations } = useConversationStore();
  const { settings } = usePackageSettingsStore();
  
  // Form state
  const [formData, setFormData] = useState<Partial<FeedbackRequest>>({
    title: '',
    description: '',
    category: 'bug',
    priority: 'medium',
    contactEmail: '',
    images: [],
    attachments: [],
    annoyanceLevel: 3, // 1-5 scale, 3 = neutral
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchLatestYRef = useRef<number | null>(null);

  // Get browser info
  const getBrowserInfo = useCallback(() => {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (ua.includes('Chrome')) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Firefox')) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Safari')) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    }
    
    return {
      name: browserName,
      version: browserVersion,
      platform: navigator.platform,
    };
  }, []);

  // Handle form changes
  const handleInputChange = (field: keyof FeedbackRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Handle file uploads
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only take the first file
    if (file.type.startsWith('image/')) {
      // Handle single image only - replace existing if present
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [base64], // Only keep one image
        }));
      };
      reader.readAsDataURL(file);
    } else {
      // Show error for non-image files
      setSnackbarMessage('❌ Please select an image file only (JPG, PNG, GIF)');
      setSnackbarOpen(true);
    }
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Remove image (single image)
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [],
    }));
  };

  // Copy image to clipboard
  const copyImageToClipboard = async () => {
    if (!formData.images?.[0]) return;
    
    try {
      // Convert base64 to blob
      const base64Data = formData.images[0].split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      
      setSnackbarMessage('📎 Image copied to clipboard! Paste it in your email.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
      setSnackbarMessage('❌ Failed to copy image. Please attach manually.');
      setSnackbarOpen(true);
    }
  };

  const handleHeaderTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const touch = event.touches[0];
    touchStartYRef.current = touch.clientY;
    touchLatestYRef.current = touch.clientY;
  };

  const handleHeaderTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    if (touchStartYRef.current === null) return;
    touchLatestYRef.current = event.touches[0].clientY;
  };

  const handleHeaderTouchEnd = () => {
    if (!isMobile) return;
    if (touchStartYRef.current === null || touchLatestYRef.current === null) {
      touchStartYRef.current = null;
      touchLatestYRef.current = null;
      return;
    }

    const delta = touchLatestYRef.current - touchStartYRef.current;
    touchStartYRef.current = null;
    touchLatestYRef.current = null;

    if (delta > 80) {
      handleClose();
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || [],
    }));
  };

  // Generate session info
  const getSessionInfo = useCallback(() => {
    const currentConversation = conversations[0]; // Get current conversation
    return {
      currentModel: selectedModel,
      currentProvider: 'Bandit AI',
      conversationId: currentConversation?.id || 'N/A',
      timestamp: new Date().toISOString(),
    };
  }, [selectedModel, conversations]);

  // Handle submit
  const handleSubmit = async () => {
    if (!formData.title?.trim() || !formData.description?.trim()) {
      setErrorMessage('Please fill in both title and description');
      return;
    }

    // Show confirmation dialog if there's an image
    if (formData.images && formData.images.length > 0) {
      setConfirmDialogOpen(true);
      return;
    }

    // If no image, proceed directly
    await performSubmit();
  };

  // Perform the actual submission
  const performSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setConfirmDialogOpen(false);

    try {
      // Create gateway service instance
      const gatewayUrl = settings?.gatewayApiUrl;
      if (!gatewayUrl) {
        throw new Error('Gateway API URL not configured');
      }

      const gatewayService = new GatewayService(
        gatewayUrl,
        () => authenticationService.getToken(),
        feedbackEmail || settings?.feedbackEmail
      );

      // Prepare complete feedback request
      const feedbackRequest: FeedbackRequest = {
        title: formData.title!,
        description: formData.description!,
        category: formData.category ?? 'bug',
        priority: formData.priority ?? 'medium',
        annoyanceLevel: formData.annoyanceLevel,
        images: formData.images,
        attachments: formData.attachments,
        contactEmail: formData.contactEmail,
        userAgent: navigator.userAgent,
        browserInfo: getBrowserInfo(),
        sessionInfo: getSessionInfo(),
      };

      // Submit feedback using gateway service
      gatewayService.submitFeedback(feedbackRequest).subscribe({
        next: async (response: FeedbackResponse) => {
          // Copy image to clipboard if present
          if (formData.images && formData.images.length > 0) {
            await copyImageToClipboard();
          }
          
          if (response?.mailtoUrl) {
            // Open mailto URL if provided (fallback case)
            window.location.href = response.mailtoUrl;
          }
          
          setSubmitStatus('success');
          
          // Close modal after a short delay
          setTimeout(() => {
            handleClose();
          }, 2000);
        },
        error: (subscribeError: unknown) => {
          console.error('Failed to submit feedback:', subscribeError);
          setErrorMessage('Failed to submit feedback. Please try again.');
          setSubmitStatus('error');
          setIsSubmitting(false);
        },
        complete: () => {
          setIsSubmitting(false);
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize feedback:', error);
      setErrorMessage('Failed to initialize feedback system. Please try again.');
      setSubmitStatus('error');
      setIsSubmitting(false);
    }
  };

  // Handle close with reset
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'bug',
      priority: 'medium',
      contactEmail: '',
      images: [],
      attachments: [],
      annoyanceLevel: 3,
    });
    setSubmitStatus('idle');
    setErrorMessage('');
    setSnackbarOpen(false);
    setSnackbarMessage('');
    setConfirmDialogOpen(false);
    onClose();
  };

  const selectedCategory = feedbackCategories[formData.category as keyof FeedbackCategories];
  const selectedPriority = feedbackPriorities[formData.priority as keyof FeedbackPriorities];
  const IconComponent = iconMap[selectedCategory?.icon as keyof typeof iconMap] || MessageIcon;

  const isValid = !!formData.title?.trim() && !!formData.description?.trim();

  return (
    <>
      {/* Global or component-scoped scrollbar styles */}
      <GlobalStyles styles={{
        '::-webkit-scrollbar': {
          width: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: '#444',
          borderRadius: '4px',
          border: '1px solid #222',
        },
      }} />
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={Fade}
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            bgcolor: theme.palette.background.paper,
            backgroundImage: theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 32px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 32px 120px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.02)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            maxHeight: '100dvh',
            margin: isMobile ? 0 : 'auto',
            position: 'relative',
          },
        }}
        BackdropProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark'
              ? 'rgba(0, 0, 0, 0.7)'
              : 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
          },
        }}
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        {/* Custom DialogTitle for header */}
        <DialogTitle
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 1.25 : 1.5,
            pr: { xs: 2, sm: 3 },
            pl: { xs: 2, sm: 3 },
            pt: { xs: isMobile ? 1.5 : 3, sm: 3 },
            pb: { xs: 1.5, sm: 2 },
            touchAction: 'pan-y',
          }}
        >
          {isMobile && (
            <Box
              sx={{
                width: 56,
                height: 6,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.text.primary, 0.18),
                alignSelf: 'center',
                mb: 1,
              }}
            />
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              width: '100%',
            }}
          >
            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight="bold" noWrap>Send Feedback</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>Help us improve Bandit AI</Typography>
            </Stack>
            <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: { xs: 1.5, sm: 3 },
            maxHeight: 'calc(100dvh - 80px)',
            overflowY: 'auto',
            backgroundColor: 'background.default',
            scrollbarGutter: 'stable',
          }}
        >

        {/* Modal Content Below */}
        {submitStatus === 'success' && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-icon': {
                color: theme.palette.success.main,
              },
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(46,125,50,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(76,175,80,0.05) 0%, rgba(46,125,50,0.05) 100%)',
              border: `1px solid ${theme.palette.success.main}30`,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Feedback submitted successfully!
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.9 }}>
              {formData.images && formData.images.length > 0
                ? "Your email client should open with the feedback details. The image has been copied to your clipboard - paste it in the email!"
                : (formData.attachments && formData.attachments.length > 0)
                ? "Your email client should open with the feedback details. Please manually attach your files to the email."
                : "Your email client should open with the feedback details."
              }
            </Typography>
          </Alert>
        )}

        {errorMessage && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-icon': {
                color: theme.palette.error.main,
              },
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(211,47,47,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(244,67,54,0.05) 0%, rgba(211,47,47,0.05) 100%)',
              border: `1px solid ${theme.palette.error.main}30`,
              borderRadius: 2,
            }}
          >
            {errorMessage}
          </Alert>
        )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateRows: 'auto auto auto auto',
              rowGap: '24px',
              columnGap: '0px',
              width: '100%',
            }}
          >
          {/* Feedback Details */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gridTemplateRows: 'auto auto auto',
              gap: '16px',
              mb: 0,
            }}
          >
            <Box
              sx={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                mb: 0,
                mt: 2,
                alignSelf: 'end',
              }}
            >
              <MessageIcon sx={{ color: theme.palette.text.primary }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0,
                }}
              >
                Feedback Details
              </Typography>
            </Box>
            {/* Title - full width */}
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={handleInputChange('title')}
              placeholder="Brief summary of your feedback"
              required
              size="medium"
              InputLabelProps={{ shrink: true }}
              sx={{
                minHeight: 48,
                gridColumn: '1 / -1',
                '& .MuiInputBase-root': {
                  minHeight: 48,
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 6px 16px rgba(0,0,0,0.4)'
                      : '0 6px 16px rgba(0,0,0,0.15)',
                  },
                },
              }}
            />
            {/* Category */}
            <FormControl
              fullWidth
              size="medium"
              sx={{
                minHeight: 48,
                '& .MuiInputBase-root': {
                  minHeight: 48,
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 6px 16px rgba(0,0,0,0.4)'
                      : '0 6px 16px rgba(0,0,0,0.15)',
                  },
                },
              }}
            >
              <InputLabel shrink id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                value={formData.category}
                label="Category"
                onChange={handleInputChange('category')}
              >
                {Object.entries(feedbackCategories).map(([key, category]) => {
                  const Icon = iconMap[category.icon as keyof typeof iconMap];
                  return (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Icon sx={{ color: category.color, fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{category.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {category.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            {/* Priority */}
            <FormControl
              fullWidth
              size="medium"
              sx={{
                minHeight: 48,
                '& .MuiInputBase-root': {
                  minHeight: 48,
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 6px 16px rgba(0,0,0,0.4)'
                      : '0 6px 16px rgba(0,0,0,0.15)',
                  },
                },
              }}
            >
              <InputLabel shrink id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                id="priority"
                value={formData.priority}
                label="Priority"
                onChange={handleInputChange('priority')}
              >
                {Object.entries(feedbackPriorities).map(([key, priority]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: priority.color,
                          boxShadow: `0 0 0 2px ${priority.color}20`,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{priority.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {priority.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Description - full width, tall */}
            <TextField
              fullWidth
              multiline
              rows={5}
              label="Description"
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="Please provide detailed information about your feedback..."
              required
              size="medium"
              InputLabelProps={{ shrink: true }}
              sx={{
                minHeight: 48,
                gridColumn: '1 / -1',
                '& .MuiInputBase-root': {
                  minHeight: 48,
                  alignItems: 'flex-start',
                  py: 1.5,
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 6px 16px rgba(0,0,0,0.4)'
                      : '0 6px 16px rgba(0,0,0,0.15)',
                  },
                },
              }}
            />
          </Box>
          {/* Impact Assessment & Attachments - side by side, visually aligned */}
          <Box
            className="feedback-section-row"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              alignItems: 'stretch',
              width: '100%',
              // Responsive stacking for mobile
              flexDirection: { xs: 'column', md: 'row' },
            }}
          >
            {/* Impact Assessment */}
            <Box
              className="impact-assessment-card impact-section"
              sx={{
                flex: 1,
                minWidth: 300,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                p: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                <PsychologyAltRounded sx={{ color: theme.palette.warning.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  Impact Assessment
                </Typography>
              </Box>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    minHeight: 180,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
                      : 'linear-gradient(135deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.03) 100%)',
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    justifyContent: 'center',
                    height: '100%',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 24px rgba(0,0,0,0.4)'
                        : '0 8px 24px rgba(0,0,0,0.12)',
                    },
                  }}
                >
                  <Stack spacing={3}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: theme.palette.warning.main + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                        }}
                      >
                        <PsychologyAltRounded sx={{ color: theme.palette.warning.main, fontSize: 22 }} />
                      </Box>
                      How annoying is this issue? ({formData.annoyanceLevel}/5)
                    </Typography>
                    <Box sx={{ px: 2, py: 1 }}>
                      <Slider
                        value={formData.annoyanceLevel}
                        onChange={(_, value) => setFormData(prev => ({ ...prev, annoyanceLevel: value as number }))}
                        min={1}
                        max={5}
                        step={1}
                        marks={[
                          { value: 1, label: '😊 Not at all' },
                          { value: 2, label: '😐 Slightly' },
                          { value: 3, label: '🙄 Moderately' },
                          { value: 4, label: '😠 Very' },
                          { value: 5, label: '🤬 Extremely' },
                        ]}
                        sx={{
                          height: 8,
                          '& .MuiSlider-mark': {
                            backgroundColor: theme.palette.divider,
                            width: 3,
                            height: 3,
                          },
                          '& .MuiSlider-markLabel': {
                            fontSize: '0.8rem',
                            color: theme.palette.text.secondary,
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            top: 32,
                            fontWeight: 500,
                          },
                          '& .MuiSlider-thumb': {
                            width: 24,
                            height: 24,
                            background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                            boxShadow: `0 4px 12px ${theme.palette.warning.main}40`,
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: `0 0 0 12px ${theme.palette.warning.main}20, 0 4px 12px ${theme.palette.warning.main}40`,
                            },
                          },
                          '& .MuiSlider-track': {
                            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
                            height: 6,
                            border: 'none',
                          },
                          '& .MuiSlider-rail': {
                            height: 6,
                            backgroundColor: theme.palette.divider,
                            opacity: 0.3,
                          },
                          mb: 5, // Space for labels
                        }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </div>
            </Box>
            {/* Attachments */}
            <Box
              className="attachments-upload-card attachments-section"
              sx={{
                flex: 1,
                minWidth: 300,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                p: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                <AttachFileRounded sx={{ color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  Attachments
                </Typography>
              </Box>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    p: 0,
                    mb: 0,
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 2,
                      border: '2px dashed',
                      borderColor: (theme) => theme.palette.divider,
                      borderRadius: 2,
                      height: '100%',
                      mb: 0,
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: theme.palette.primary.main + '15',
                        color: theme.palette.primary.main,
                        boxShadow: `0 4px 16px ${theme.palette.primary.main}20`,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <AttachFileIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1.1rem' }}>
                        Attach One Image
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.95rem' }}>
                        Click here to upload a single image
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{
                        opacity: 0.8,
                        fontSize: '0.85rem',
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.05)',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                      }}>
                        Support: Images only (JPG, PNG, GIF) - Max 10MB
                      </Typography>
                    </Box>
                  </Box>
                  {/* Attachment Reminder - positioned at bottom */}
                  {((formData.images && formData.images.length > 0) || (formData.attachments && formData.attachments.length > 0)) && (
                    <Alert
                      severity="info"
                      sx={{
                        mt: 'auto',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        py: 0.5,
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(25,118,210,0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(33,150,243,0.05) 0%, rgba(25,118,210,0.05) 100%)',
                        border: `1px solid ${theme.palette.info.main}30`,
                        '& .MuiAlert-icon': {
                          color: theme.palette.info.main,
                          fontSize: '0.875rem',
                        },
                        '& .MuiAlert-message': {
                          fontSize: '0.75rem',
                        },
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                        {formData.images && formData.images.length > 0 
                          ? '📎 Image will be copied to clipboard - paste in email!'
                          : '📎 Files ready for email attachment'
                        }
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </div>
              {/* Display uploaded image (single) */}
              {formData.images && formData.images.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <PhotoCameraIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Attached Image
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 2px 8px rgba(0,0,0,0.3)'
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 16px rgba(0,0,0,0.4)'
                            : '0 4px 16px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <img
                        src={formData.images[0]}
                        alt="Attachment"
                        style={{
                          width: 120,
                          height: 120,
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={removeImage}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(244,67,54,0.9)',
                          color: 'white',
                          width: 24,
                          height: 24,
                          '&:hover': {
                            bgcolor: 'rgba(244,67,54,1)',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={copyImageToClipboard}
                        startIcon={<AttachFileIcon />}
                        sx={{
                          mb: 1,
                          borderColor: theme.palette.primary.main + '50',
                          color: theme.palette.primary.main,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: theme.palette.primary.main + '10',
                          },
                        }}
                      >
                        Copy to Clipboard
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                        Image will be copied when you submit
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              {/* Display other attachments */}
              {formData.attachments && formData.attachments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Attached Files ({formData.attachments.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.attachments.map((attachment, index) => (
                      <Chip
                        key={index}
                        label={attachment.name}
                        onDelete={() => removeAttachment(index)}
                        deleteIcon={<DeleteIcon />}
                        variant="outlined"
                        sx={{ maxWidth: 200 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>

        {/* DialogActions sticky footer with single full-width Send Feedback button */}
        <DialogActions
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            px: { xs: 2, sm: 3 },
            py: 1.5,
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'center',
          }}
        >
          <Button
            fullWidth
            startIcon={<MailIcon />}
            disabled={!isValid}
            onClick={handleSubmit}
            variant="contained"
          >
            Send Feedback
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for clipboard feedback */}
      <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            '& .MuiSnackbarContent-root': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(76,175,80,0.15) 0%, rgba(46,125,50,0.15) 100%)'
                : 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(46,125,50,0.1) 100%)',
              color: theme.palette.text.primary,
              fontSize: '0.9rem',
              fontWeight: 500,
              borderRadius: 2,
              border: `1px solid ${theme.palette.success.main}30`,
              backdropFilter: 'blur(10px)',
            },
          }}
          message={snackbarMessage}
        />
      
      {/* Confirmation Dialog for Image Submission */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper,
            backgroundImage: theme.palette.mode === 'dark' 
              ? 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 16px 60px rgba(0,0,0,0.6)' 
              : '0 16px 60px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.info.main + '20',
              color: theme.palette.info.main,
              width: 40,
              height: 40,
            }}
          >
            <PhotoCameraIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Ready to Submit with Image
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Here's what will happen when you submit
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(33,150,243,0.05) 0%, rgba(25,118,210,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(33,150,243,0.03) 0%, rgba(25,118,210,0.03) 100%)',
                border: `1px solid ${theme.palette.info.main}20`,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  bgcolor: theme.palette.info.main + '20', 
                  color: theme.palette.info.main,
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  1
                </Box>
                Your image will be copied to clipboard
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  bgcolor: theme.palette.info.main + '20', 
                  color: theme.palette.info.main,
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  2
                </Box>
                Your email client will open
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  bgcolor: theme.palette.info.main + '20', 
                  color: theme.palette.info.main,
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  3
                </Box>
                Paste the image with Ctrl+V (or Cmd+V)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, fontStyle: 'italic' }}>
                The email will have a clear spot where you should paste
              </Typography>
            </Paper>
            
            <Alert severity="info" sx={{ 
              background: 'transparent',
              border: `1px solid ${theme.palette.info.main}30`,
            }}>
              <Typography variant="body2">
                <strong>💡 Tip:</strong> Make sure to paste the image before sending your email!
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setConfirmDialogOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={performSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <MailIcon />}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              },
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Got it, Submit Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
