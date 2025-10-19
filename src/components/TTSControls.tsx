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

// Bandit Engine Watermark: BL-WM-A773-AF8DC2
const __banditFingerprint_components_TTSControlstsx = 'BL-FP-A6BD69-5E21';
const __auditTrail_components_TTSControlstsx = 'BL-AU-MGOIKVV9-XEEG';
// File: TTSControls.tsx | Path: src/components/TTSControls.tsx | Hash: a7735e21

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useTTS } from '../hooks/useTTS';
import { TTSState } from '../services/tts/streaming-tts';
import { useVoiceStore } from '../store/voiceStore';

export interface TTSControlsProps {
  text?: string;
  title?: string;
  showAdvancedOptions?: boolean;
  compact?: boolean;
}

/**
 * Enhanced TTS Controls Component with streaming support
 * Demonstrates the new streaming TTS functionality with play/pause/stop controls
 */
export const TTSControls: React.FC<TTSControlsProps> = ({
  text = "Hello! This is a demonstration of our new streaming TTS system. It can start playing audio much faster than before, and you can stop it anytime.",
  title = "TTS Streaming Demo",
  showAdvancedOptions = true,
  compact = false
}) => {
  const [useRealtime, setUseRealtime] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  
  const {
    isPlaying,
    isPaused,
    isLoading,
    error,
    progress,
    state,
    speak,
    stop,
    pause,
    resume,
    isAvailable,
    currentVoice
  } = useTTS();

  const { availableVoices } = useVoiceStore();

  const handlePlay = async () => {
    try {
      await speak(text, {
        useStreaming,
        useRealtime: useRealtime && useStreaming, // Real-time requires streaming
      });
    } catch (err) {
      console.error('TTS failed:', err);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handlePause = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const getStateColor = (): ChipProps["color"] => {
    switch (state) {
      case TTSState.PLAYING: return 'success';
      case TTSState.LOADING: return 'warning';
      case TTSState.PAUSED: return 'info';
      case TTSState.ERROR: return 'error';
      default: return 'default';
    }
  };

  const getStateLabel = () => {
    switch (state) {
      case TTSState.PLAYING: return 'Playing';
      case TTSState.LOADING: return 'Loading';
      case TTSState.PAUSED: return 'Paused';
      case TTSState.ERROR: return 'Error';
      default: return 'Ready';
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAvailable) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            TTS service is not available. Please check your configuration.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={isPlaying ? "Stop" : isPaused ? "Resume" : "Play"}>
          <IconButton
            onClick={isPlaying ? handleStop : isPaused ? handlePause : handlePlay}
            disabled={isLoading}
            color="primary"
          >
            {isLoading ? (
              <VolumeIcon />
            ) : isPlaying ? (
              <StopIcon />
            ) : isPaused ? (
              <PlayIcon />
            ) : (
              <PlayIcon />
            )}
          </IconButton>
        </Tooltip>
        
        {(isPlaying || isPaused) && (
          <Tooltip title="Pause/Resume">
            <IconButton onClick={handlePause} size="small">
              {isPaused ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>
        )}
        
        <Chip 
          label={getStateLabel()} 
          color={getStateColor()} 
          size="small" 
        />
      </Box>
    );
  }

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Voice: {currentVoice ? currentVoice.split('-')[1] : 'Default'}
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            "{text.length > 100 ? text.substring(0, 100) + '...' : text}"
          </Typography>
        </Box>

        {/* Progress indicator */}
        {(isLoading || isPlaying || isPaused) && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption">
                {formatTime(progress?.currentTime || 0)}
              </Typography>
              <Typography variant="caption">
                {formatTime(progress?.duration || 0)}
              </Typography>
            </Box>
            <LinearProgress 
              variant={isLoading ? "indeterminate" : "determinate"}
              value={progress?.duration ? (progress.currentTime / progress.duration) * 100 : 0}
              sx={{ height: 6, borderRadius: 3 }}
            />
            {progress && progress.duration > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Buffered: {Math.round((progress.buffered / progress.duration) * 100)}%
              </Typography>
            )}
          </Box>
        )}

        {/* Status chip */}
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={getStateLabel()} 
            color={getStateColor()}
            icon={
              state === TTSState.PLAYING ? <VolumeIcon /> :
              state === TTSState.LOADING ? <SpeedIcon /> :
              undefined
            }
          />
        </Box>

        {/* Advanced options */}
        {showAdvancedOptions && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Streaming Options
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  disabled={isPlaying || isLoading}
                />
              }
              label="Enable Streaming (faster startup)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={useRealtime}
                  onChange={(e) => setUseRealtime(e.target.checked)}
                  disabled={isPlaying || isLoading || !useStreaming}
                />
              }
              label="Real-time Streaming (lowest latency)"
            />
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Button
          variant="contained"
          startIcon={<PlayIcon />}
          onClick={handlePlay}
          disabled={isLoading || isPlaying}
          color="primary"
        >
          Play
        </Button>
        
        <Button
          variant="outlined"
          startIcon={isPaused ? <PlayIcon /> : <PauseIcon />}
          onClick={handlePause}
          disabled={!isPlaying && !isPaused}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<StopIcon />}
          onClick={handleStop}
          disabled={!isPlaying && !isPaused && !isLoading}
          color="secondary"
        >
          Stop
        </Button>

        <Box sx={{ ml: 'auto' }}>
          <Tooltip title={`${availableVoices.length} voices available`}>
            <Chip 
              label={`${availableVoices.length} voices`} 
              size="small" 
              variant="outlined"
            />
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default TTSControls;
