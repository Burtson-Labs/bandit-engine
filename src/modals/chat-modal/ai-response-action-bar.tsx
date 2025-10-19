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

// Bandit Engine Watermark: BL-WM-39FF-8FD178
const __banditFingerprint_chatmodal_airesponseactionbartsx = 'BL-FP-F5CD26-176D';
const __auditTrail_chatmodal_airesponseactionbartsx = 'BL-AU-MGOIKVVL-8RC1';
// File: ai-response-action-bar.tsx | Path: src/modals/chat-modal/ai-response-action-bar.tsx | Hash: 39ff176d

import { useState, useEffect } from "react";
import { useVoiceStore } from "../../store/voiceStore";
import { usePreferencesStore } from "../../store/preferencesStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { useTTS } from "../../hooks/useTTS";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { CampaignOutlined, CampaignRounded } from "@mui/icons-material";
import StopIcon from "@mui/icons-material/Stop";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { debugLogger } from "../../services/logging/debugLogger";
import { authenticationService } from "../../services/auth/authenticationService";

const AiResponseActionsBar: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  
  const {
    isPlaying,
    isPaused,
    isLoading,
    error: ttsError,
    speak: ttsSpeak,
    stop: ttsStop,
    pause: ttsPause,
    resume: ttsResume,
    isAvailable: isTTSAvailable
  } = useTTS();

  const { availableVoices, loadVoicesFromAPI, initialized } = useVoiceStore();
  const { preferences } = usePreferencesStore();
  const { settings: packageSettings } = usePackageSettingsStore();

  // Load voices when component mounts if none are available
  useEffect(() => {
    const isAuthenticated = authenticationService.isAuthenticated();
    const token = authenticationService.getToken();
    
    if (!initialized || availableVoices.length === 0) {
      if (token && isAuthenticated) {
        debugLogger.debug('AI Action Bar: Voices not initialized or unavailable, attempting to load from API');
        loadVoicesFromAPI();
      } else {
        debugLogger.debug('AI Action Bar: No valid JWT token available - skipping voice loading');
      }
    }
  }, [initialized, availableVoices.length, loadVoicesFromAPI]);

  // Show TTS error if any
  useEffect(() => {
    if (ttsError) {
      debugLogger.error('TTS Error in action bar:', { error: ttsError });
    }
  }, [ttsError]);

  const handleCopy = () => {
    // Remove HTML tags
    let plainText = text.replace(/<\/?[^>]+(>|$)/g, "");

    // Remove Markdown syntax
    plainText = plainText
      .replace(/`{1,3}[\s\S]*?`{1,3}/g, "") // inline and block code
      .replace(/!\[.*?\]\(.*?\)/g, "") // images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
      .replace(/[*_~`>#-]/g, "") // emphasis, headings, etc.
      .replace(/^\s*\d+\s*[:.]?\s*$/gm, "") // numbered list items like "1. :" or "2:"
      .replace(/^\s*[:.]+\s*$/gm, "") // lines with just colons or periods
      .replace(/:+(?=\s|$)/g, "") // trailing colons
      .replace(/\n{3,}/g, "\n\n"); // limit excessive line breaks

    plainText = plainText.trim();

    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTTSClick = async () => {
    try {
      if (!isTTSAvailable) {
        return;
      }

      if (isPaused) {
        // If paused, resume
        ttsResume();
      } else if (!isPlaying) {
        // If idle or error, start playing with streaming
        // Clean the text first - remove HTML tags and Markdown syntax
        let cleanText = text.replace(/<\/?[^>]+(>|$)/g, "");

        // Remove Markdown syntax
        cleanText = cleanText
          .replace(/`{1,3}[\s\S]*?`{1,3}/g, "") // inline and block code
          .replace(/!\[.*?\]\(.*?\)/g, "") // images
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
          .replace(/[*_~`>#-]/g, "") // emphasis, headings, etc.
          .replace(/^\s*\d+\s*[:.]?\s*$/gm, "") // numbered list items like "1. :" or "2:"
          .replace(/^\s*[:.]+\s*$/gm, "") // lines with just colons or periods
          .replace(/:+(?=\s|$)/g, "") // trailing colons
          .replace(/\n{3,}/g, "\n\n"); // limit excessive line breaks

        cleanText = cleanText.trim();

        if (!cleanText) {
          return;
        }

        await ttsSpeak(cleanText, { 
          useStreaming: true, // Enable streaming for faster response
          useRealtime: true   // Use real-time streaming for immediate playback
        });
      }
      // Note: If already playing, do nothing (pause and stop have their own buttons)
    } catch (error) {
      debugLogger.error('TTS playback failed:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  const handleFeedback = (type: "like" | "dislike") => {
    setFeedback(type);
    // Example: memoryEnhancer.addMemory(`User ${type === "like" ? "liked" : "disliked"} this response`);
  };

  return (
    <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
      <Tooltip title={copied ? "Copied!" : "Copy entire response"}>
        <IconButton
          onClick={handleCopy}
          size="small"
          sx={{
            color: (theme) =>
              theme.palette.mode === "dark" ? "#ccc" : "#555",
            "&:hover": {
              color: (theme) =>
                theme.palette.mode === "dark" ? "#fff" : "#000",
            },
          }}
        >
          {copied ? <CheckIcon sx={{ fontSize: 18 }} /> : <ContentCopyIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Tooltip>

      {isTTSAvailable && ( 
        <>
          {/* Main TTS Button - Play/Resume */}
          <Tooltip
            title={
              !isTTSAvailable ? "TTS not available - check configuration" :
              isLoading ? "Loading audio..." :
              isPaused ? "Resume playback" :
              isPlaying ? "Playing audio..." :
              "Play response with voice"
            }
          >
            <IconButton
              onClick={handleTTSClick}
              size="small"
              disabled={isLoading}
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#ccc" : "#555",
                "&:hover": {
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#fff" : "#000",
                },
                "&:disabled": {
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#666" : "#aaa",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={18} />
              ) : isPaused ? (
                <PlayArrowIcon sx={{ fontSize: 18 }} />
              ) : !isPlaying ? (
                <CampaignOutlined sx={{ fontSize: 18 }} />
              ) : (
                <CampaignRounded sx={{ fontSize: 18, color: '#4caf50' }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Pause Button - Only show when playing */}
          {isPlaying && (
            <Tooltip title="Pause playback">
              <IconButton
                onClick={() => ttsPause()}
                size="small"
                sx={{
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#ccc" : "#555",
                  "&:hover": {
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
              >
                <PauseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Stop Button - Show when playing or paused */}
          {(isPlaying || isPaused) && (
            <Tooltip title="Stop playback">
              <IconButton
                onClick={() => ttsStop()}
                size="small"
                sx={{
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#ccc" : "#555",
                  "&:hover": {
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
              >
                <StopIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </>
      )}

      <Tooltip title="Like this response">
        <IconButton
          onClick={() => handleFeedback("like")}
          size="small"
          sx={{
            color: feedback === "like"
              ? "#00e676"
              : (theme) =>
                  theme.palette.mode === "dark" ? "#ccc" : "#555",
            "&:hover": {
              color: feedback === "like"
                ? "#00e676"
                : (theme) =>
                    theme.palette.mode === "dark" ? "#fff" : "#000",
            },
          }}
        >
          <ThumbUpIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Dislike this response">
        <IconButton
          onClick={() => handleFeedback("dislike")}
          sx={{
            color: feedback === "dislike"
              ? "#ff1744"
              : (theme) =>
                  theme.palette.mode === "dark" ? "#ccc" : "#555",
            "&:hover": {
              color: feedback === "dislike"
                ? "#ff1744"
                : (theme) =>
                    theme.palette.mode === "dark" ? "#fff" : "#000",
            },
          }}
        >
          <ThumbDownIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default AiResponseActionsBar;
