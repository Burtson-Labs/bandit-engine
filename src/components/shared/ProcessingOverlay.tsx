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

// Bandit Engine Watermark: BL-WM-E790-227D12
const __banditFingerprint_shared_ProcessingOverlaytsx = 'BL-FP-218129-2B82';
const __auditTrail_shared_ProcessingOverlaytsx = 'BL-AU-MGOIKVVB-O349';
// File: ProcessingOverlay.tsx | Path: src/components/shared/ProcessingOverlay.tsx | Hash: e7902b82

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  LinearProgress,
  Fade,
  Zoom,
  useTheme,
  alpha,
  keyframes,
} from '@mui/material';
import { 
  CloudUpload, 
  Psychology, 
  Memory, 
  AutoAwesome,
  SmartToy,
  Bolt
} from '@mui/icons-material';

// Ninja animation keyframes
const ninjaFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(2deg); }
  50% { transform: translateY(-5px) rotate(0deg); }
  75% { transform: translateY(-15px) rotate(-2deg); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration?: number; // rough estimate in seconds
}

interface ProcessingOverlayProps {
  open: boolean;
  currentStep?: string;
  progress?: number; // 0-100
  title?: string;
  onCancel?: () => void;
  steps?: ProcessingStep[];
  customMessages?: string[];
}

const defaultSteps: ProcessingStep[] = [
  {
    id: 'upload',
    title: 'Uploading to Cloud',
    description: 'Our digital ninjas are securely transferring your file...',
    icon: <CloudUpload />,
    duration: 5
  },
  {
    id: 'analyze',
    title: 'AI Analysis',
    description: 'Advanced AI robots are reading and understanding your content...',
    icon: <Psychology />,
    duration: 15
  },
  {
    id: 'embed',
    title: 'Creating Vectors',
    description: 'Neural networks are encoding knowledge into searchable vectors...',
    icon: <Memory />,
    duration: 10
  },
  {
    id: 'optimize',
    title: 'Optimizing Search',
    description: 'AI algorithms are organizing data for lightning-fast retrieval...',
    icon: <AutoAwesome />,
    duration: 8
  }
];

const cleverMessages = [
  "🥷 Digital ninjas are working their magic...",
  "🤖 AI robots are crunching your data...",
  "⚡ Neural networks firing at maximum capacity...",
  "🧠 Machine learning models deep in thought...",
  "🔮 AI wizards casting knowledge spells...",
  "⚙️ Quantum processors spinning up...",
  "🚀 Algorithms achieving warp speed...",
  "💫 Creating digital memories from your content...",
  "🎯 Precision-targeting knowledge patterns...",
  "🌟 Transforming text into searchable stardust..."
];

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  open,
  currentStep,
  progress = 0,
  title = "Processing Your Request",
  onCancel,
  steps = defaultSteps,
  customMessages
}) => {
  const theme = useTheme();
  const [messageIndex, setMessageIndex] = useState(0);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const messages = customMessages || cleverMessages;

  // Rotate clever messages
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [open, messages.length]);

  // Generate random sparkles
  useEffect(() => {
    if (!open) return;

    const generateSparkles = () => {
      const newSparkles = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setSparkles(newSparkles);
    };

    generateSparkles();
    const interval = setInterval(generateSparkles, 2000);

    return () => clearInterval(interval);
  }, [open]);

  const currentStepData = steps.find(step => step.id === currentStep) || steps[0];
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const stepProgress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : progress;

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.1)} 0%, 
            ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          position: 'relative',
          overflow: 'hidden'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      {/* Animated sparkles */}
      {sparkles.map((sparkle) => (
        <Box
          key={sparkle.id}
          sx={{
            position: 'absolute',
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: theme.palette.primary.main,
            animation: `${sparkle} 2s ease-in-out infinite`,
            zIndex: 1
          }}
        />
      ))}

      <DialogContent sx={{ textAlign: 'center', py: 4, position: 'relative', zIndex: 2 }}>
        {/* Main Animation Area */}
        <Box sx={{ mb: 3, position: 'relative', height: 120 }}>
          {/* Primary Icon with Ninja Float Animation */}
          <Zoom in={open} timeout={500}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `linear-gradient(45deg, 
                  ${theme.palette.primary.main}, 
                  ${theme.palette.secondary.main})`,
                color: 'white',
                fontSize: '2rem',
                animation: `${ninjaFloat} 4s ease-in-out infinite`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                position: 'relative'
              }}
            >
              {currentStepData.icon}
              
              {/* Rotating ring around icon */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  borderTopColor: theme.palette.primary.main,
                  animation: `${rotate} 2s linear infinite`,
                  top: -10,
                  left: -10
                }}
              />
            </Box>
          </Zoom>

          {/* Floating secondary icons */}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 20,
              animation: `${pulse} 3s ease-in-out infinite`,
              color: theme.palette.secondary.main
            }}
          >
            <SmartToy />
          </Box>
          
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 20,
              animation: `${pulse} 2.5s ease-in-out infinite`,
              color: theme.palette.primary.main,
              animationDelay: '1s'
            }}
          >
            <Bolt />
          </Box>
        </Box>

        {/* Title */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>

        {/* Current Step */}
        <Fade in={true} key={currentStepData.id}>
          <Typography 
            variant="h6" 
            color="primary" 
            gutterBottom
            sx={{ minHeight: 32 }}
          >
            {currentStepData.title}
          </Typography>
        </Fade>

        {/* Step Description */}
        <Fade in={true} key={currentStepData.description}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mb: 3, minHeight: 20 }}
          >
            {currentStepData.description}
          </Typography>
        </Fade>

        {/* Clever Message Rotation */}
        <Box sx={{ height: 24, mb: 3, overflow: 'hidden' }}>
          <Fade in={true} key={messageIndex} timeout={500}>
            <Typography
              variant="body2"
              sx={{
                fontStyle: 'italic',
                color: theme.palette.text.secondary,
                opacity: 0.8
              }}
            >
              {messages[messageIndex]}
            </Typography>
          </Fade>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={stepProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, 
                  ${theme.palette.primary.main}, 
                  ${theme.palette.secondary.main})`
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {Math.round(stepProgress)}% Complete
          </Typography>
        </Box>

        {/* Step Indicators */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          {steps.map((step, index) => (
            <Box
              key={step.id}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: index <= currentStepIndex 
                  ? theme.palette.primary.main 
                  : alpha(theme.palette.primary.main, 0.2),
                transition: 'all 0.3s ease',
                transform: index === currentStepIndex ? 'scale(1.2)' : 'scale(1)'
              }}
            />
          ))}
        </Box>

        {/* Estimated Time */}
        {currentStepData.duration && (
          <Typography variant="caption" color="text.secondary">
            Estimated time: ~{currentStepData.duration} seconds
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProcessingOverlay;
