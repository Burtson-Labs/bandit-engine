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

// Bandit Engine Watermark: BL-WM-E95F-A26839
const __banditFingerprint_chat_chatinputtsx = 'BL-FP-E7A13E-4AF0';
const __auditTrail_chat_chatinputtsx = 'BL-AU-MGOIKVUX-SXD7';
// File: chat-input.tsx | Path: src/chat/chat-input.tsx | Hash: e95f4af0

import React, { useEffect, useRef, useState } from "react";
import { Box, TextField, IconButton, Tooltip, Avatar, Typography, CircularProgress, Collapse } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import PsychologyIcon from "@mui/icons-material/Psychology";
import FeedbackIcon from "@mui/icons-material/Feedback";
import HearingDisabledIcon from "@mui/icons-material/HearingDisabled";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { BanditPersonality } from "../store/modelStore";
import { usePreferencesStore } from "../store/preferencesStore";
import { usePackageSettingsStore } from "../store/packageSettingsStore";
import Transcriber from "../services/stt/transcriber";
import MemoryModal from "./memory-modal";
import { useTheme, alpha } from "@mui/material/styles";
import { debugLogger } from "../services/logging/debugLogger";
import brandingService from "../services/branding/brandingService";
import { FeedbackModal } from "../components/feedback/FeedbackModal";
import { useFeatures, useFeatureVisibility } from "../hooks/useFeatures";
import { useVoiceStore } from "../store/voiceStore";
import { useVoiceModeStore } from "../store/voiceModeStore";
import { shallow } from "zustand/shallow";

interface ChatInputProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  pastedImages: string[];
  setPastedImages: React.Dispatch<React.SetStateAction<string[]>>;
  inputRef: React.RefObject<HTMLInputElement>;
  inputContainerRef: React.RefObject<HTMLDivElement>;
  isMobile: boolean;
  inputHeight: number;
  setInputHeight: (val: number) => void;
  isSubmitting: boolean;
  selectedVoice: string;
  availableVoices: string[];
  handleVoiceChange: (voiceId: string) => void;
  selectedModel: string;
  availableModels: BanditPersonality[];
  handleModelChange: (modelId: string) => void;
  onSend: (question: string, images: string[], displayQuestion: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = (props) => {
  const {
    inputValue,
    setInputValue,
    pastedImages,
    inputRef,
    isMobile,
    setPastedImages,
    inputContainerRef,
    isSubmitting,
    onSend,
    onStop,
    isStreaming,
  } = props;

  // Theme and color variables
  const theme = useTheme();
  const inputBackground = theme.palette.chat.input;
  const shellBackground = theme.palette.chat.shell;
  const badgeBackground = theme.palette.chat.badge;
  const hoverBadgeBackground = theme.palette.chat.badgeHover;
  const fileBg = theme.palette.chat.file;
  const fileIconBg = theme.palette.chat.fileIcon;
  const fileText = theme.palette.chat.fileText;
  const captionColor = theme.palette.chat.caption;

  const { preferences } = usePreferencesStore();
  const { settings: packageSettings } = usePackageSettingsStore();
  const isVoiceServiceAvailable = useVoiceStore((state) => state.isServiceAvailable);
  const {
    isVoiceModeEnabled,
    voiceStatus,
    voiceError,
    toggleVoiceMode,
    voiceLastTranscript,
  } = useVoiceModeStore(
    (state) => ({
      isVoiceModeEnabled: state.enabled,
      voiceStatus: state.status,
      voiceError: state.error,
      toggleVoiceMode: state.toggle,
      voiceLastTranscript: state.lastTranscript,
    }),
    shallow
  );
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [fileInputs, setFileInputs] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brandingText, setBrandingText] = useState<string>("");
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);

  const compactMobile = isMobile;
  const primaryIconSize = isMobile ? 32 : 40;
  const sendIconSize = isMobile ? 36 : 44;
  const attachmentsGap = isMobile ? 0.6 : 1;
  const attachmentChipPaddingX = isMobile ? 1 : 1.5;
  const attachmentChipPaddingY = isMobile ? 0.55 : 0.75;
  const mobileShellPadding = `calc(var(--input-offset, 1.5rem) - 0.4rem)`;
  const streamingActive = Boolean(isStreaming);
  const sendButtonBackground = streamingActive
    ? alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.75 : 0.65)
    : fileText;
  const sendButtonColor = streamingActive
    ? theme.palette.common.white
    : fileIconBg;
  const sendButtonHover = streamingActive
    ? alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.9 : 0.82)
    : hoverBadgeBackground;
  const sendButtonShadow = streamingActive
    ? `0 0 0 3px ${alpha(theme.palette.error.main, 0.18)}`
    : "none";

  // Feature flag checks
  const { hasSTT, hasMemory, hasDocumentKnowledge } = useFeatures();
  const { showMemoryToggle, showDocumentUpload } = useFeatureVisibility();

  // Check if STT is available (URL is configured in package settings) AND enabled in preferences AND user has STT feature
  const isSTTAvailable = !!packageSettings?.gatewayApiUrl && preferences.sttEnabled && hasSTT();
  const isTTSAvailable = !!(
    packageSettings?.gatewayApiUrl &&
    preferences.ttsEnabled &&
    isVoiceServiceAvailable
  );
  const isVoiceModeEligible = isSTTAvailable && isTTSAvailable;
  
  // Check if memory modal should be shown
  const isMemoryEnabled = preferences.memoryEnabled && showMemoryToggle();

  // Check if document upload should be shown
  const isDocumentUploadEnabled = showDocumentUpload();

  // Check if feedback button should be shown
  const isFeedbackEnabled = preferences.feedbackEnabled;

  const gatewayUrlLower = packageSettings?.gatewayApiUrl?.toLowerCase?.() ?? "";
  const isPlaygroundMode =
    packageSettings?.playgroundMode === true ||
    gatewayUrlLower.startsWith("playground://") ||
    (typeof window !== "undefined" && window.location.pathname.includes("/playground"));

  useEffect(() => {
    const lockViewportHeight = () => {
      if (isMobile) {
        document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
        document.documentElement.style.setProperty(
          "--input-offset",
          `max(env(safe-area-inset-bottom, 0px), 1.5rem)`
        );
      }
    };
    lockViewportHeight();
    window.addEventListener("resize", lockViewportHeight);
    return () => window.removeEventListener("resize", lockViewportHeight);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setKeyboardOpen(false);
      return;
    }

    const viewport = window.visualViewport;
    let baseline = viewport?.height ?? window.innerHeight;
    const THRESHOLD = 120;

    const detectKeyboard = () => {
      const current = viewport?.height ?? window.innerHeight;
      if (current > baseline) {
        baseline = current;
      }
      setKeyboardOpen(baseline - current > THRESHOLD);
    };

    detectKeyboard();
    viewport?.addEventListener("resize", detectKeyboard);
    window.addEventListener("resize", detectKeyboard);

    return () => {
      viewport?.removeEventListener("resize", detectKeyboard);
      window.removeEventListener("resize", detectKeyboard);
    };
  }, [isMobile]);

  // Load branding text for disclaimer
  useEffect(() => {
    const loadBrandingText = async () => {
      try {
        const branding = await brandingService.getBranding();
        setBrandingText(branding?.brandingText || "");
      } catch (error) {
        debugLogger.error("Failed to load branding text", { error });
        setBrandingText("");
      }
    };
    loadBrandingText();
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const result = event.target?.result;
                if (result) {
                  setPastedImages((prev) => [...prev, result as string]);
                }
              };
              reader.readAsDataURL(file);
            }
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [setPastedImages]);

  const getFileIcon = (filename: string) => {
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

  const removeImage = (index: number) => {
    setPastedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (inputValue.trim() === "" && pastedImages.length === 0 && fileInputs.length === 0)
      return;
    const tempImages = [...pastedImages];

    // Utility to escape prompt injection in user-uploaded content
    const escapePromptInjection = (text: string) => {
      return text
        .replace(/<\s*\/?script.*?>/gi, "")
        .replace(/```.*?```/gs, "")
        .replace(/(?<=\n|^)\/?(system|assistant|user):/gi, "[removed-role]");
    };

    const getFileText = async (file: File): Promise<string> => {
      const isCodeFile = (name: string) =>
        name.endsWith(".js") ||
        name.endsWith(".ts") ||
        name.endsWith(".tsx") ||
        name.endsWith(".json") ||
        name.endsWith(".py") ||
        name.endsWith(".java") ||
        name.endsWith(".c") ||
        name.endsWith(".cpp") ||
        name.endsWith(".cs");

      const sanitize = (text: string, name: string) =>
        isCodeFile(name) ? text.trim() : text.replace(/[^\x20-\x7E\r\n\t]/g, "").trim();

      const name = file.name.toLowerCase();

      try {
        if (
          file.type.startsWith("text/") ||
          name.endsWith(".md") ||
          name.endsWith(".txt") ||
          name.endsWith(".js") ||
          name.endsWith(".ts") ||
          name.endsWith(".tsx") ||
          name.endsWith(".json") ||
          name.endsWith(".py") ||
          name.endsWith(".java") ||
          name.endsWith(".c") ||
          name.endsWith(".cpp") ||
          name.endsWith(".cs")
        ) {
          const text = await file.text();
          // Sanitize prompt injection for non-code files
          if (
            name.endsWith(".txt") ||
            name.endsWith(".md") ||
            name.endsWith(".docx") ||
            name.endsWith(".pdf")
          ) {
            return `📄 ${file.name}\n${sanitize(escapePromptInjection(text), file.name)}`;
          } else {
            return `📄 ${file.name}\n${sanitize(text, file.name)}`;
          }
        }

        if (name.endsWith(".docx")) {
          const mammoth = await import("mammoth");
          const arrayBuffer = await file.arrayBuffer();
          const { value } = await mammoth.extractRawText({ arrayBuffer });
          return `📄 ${file.name}\n${sanitize(escapePromptInjection(value), file.name)}`;
        }

        if (name.endsWith(".pdf")) {
          const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.burtson.ai/scripts/pdf.worker.js';

          const buffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: buffer });

          try {
            const pdf = await loadingTask.promise;
            debugLogger.info("PDF loaded", { numPages: pdf.numPages });

            const maxPages = Math.min(pdf.numPages, 10);
            const pages = await Promise.all(
              Array.from({ length: maxPages }, async (_, i) => {
                try {
                  const page = await pdf.getPage(i + 1);
                  const content = await page.getTextContent();
                  return content.items
                    .map((item: unknown) => {
                      if (
                        item &&
                        typeof item === "object" &&
                        "str" in item &&
                        typeof (item as { str: unknown }).str === "string"
                      ) {
                        return (item as { str: string }).str;
                      }
                      return "";
                    })
                    .join(" ");
                } catch (err) {
                  debugLogger.error(`Failed to read page ${i + 1}`, { error: err });
                  return "";
                }
              })
            );

            const joined = pages.join("\n\n");
            debugLogger.info("Extracted PDF content", { contentPreview: joined.slice(0, 500) });
            return `📄 ${file.name}\n${sanitize(
              escapePromptInjection(joined),
              file.name
            )}`;
          } catch (error) {
            debugLogger.error("PDF load failed", {
              error: error instanceof Error ? error.message : String(error),
              fileName: file.name,
            });
            return "";
          }
        }

        return "";
      } catch {
        return "";
      }
    };

    const fileTexts = await Promise.all(fileInputs.map(getFileText));
    // Logging all extracted file texts
    debugLogger.debug("All extracted file texts", { fileTexts });
    const fileContent = fileTexts.filter(Boolean).join("\n\n");

    const tempQuestionBase =
      inputValue.trim() ||
      (tempImages.length === 1
        ? "[📷 You attached an image]"
        : tempImages.length > 1
          ? `[📷 You attached ${tempImages.length} images]`
          : "");

    const fileDisplaySummary =
      fileInputs.length > 0
        ? `[📎 Attached ${fileInputs.length} file${fileInputs.length > 1 ? "s" : ""
        }: ${fileInputs.map((f) => f.name).join(", ")}]`
        : "";

    //TODO:displayQuestion is what shows in chat history, excludes file content
    const displayQuestion = [
      tempQuestionBase ||
      (fileDisplaySummary ? "[📤 You submitted content without text]" : ""),
      fileDisplaySummary,
    ]
      .filter(Boolean)
      .join("\n\n");
    // fullPrompt is what is sent to the LLM (inputValue + fileContent)
    const fullPrompt = [inputValue, fileContent].filter(Boolean).join("\n\n");

    setInputValue("");
    setPastedImages([]);
    setFileInputs([]);
    onSend(fullPrompt, tempImages, displayQuestion);
    inputRef.current?.blur();
    fileInputRef.current!.value = ""; // clear input field manually
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTranscriptionCompleted = (transcribed: string) => {
    const value = (inputValue + transcribed).trim();
    setInputValue(value);
    inputRef.current?.focus();
  };

  const memory = localStorage.getItem("bandit-memory");

  const hasAttachmentAction = !isPlaygroundMode && fileInputs.length < 3 && isDocumentUploadEnabled;
  const hasMemoryAction = isMemoryEnabled;
  const hasFeedbackAction = isFeedbackEnabled && isMobile;
  const hasSttAction = isSTTAvailable && !isVoiceModeEnabled;
  const hasSecondaryActions = isMobile && (hasAttachmentAction || hasMemoryAction || hasFeedbackAction || hasSttAction);

  useEffect(() => {
    if (!isMobile || !hasSecondaryActions) {
      setMoreActionsOpen(false);
    }
  }, [isMobile, hasSecondaryActions]);

  const renderAttachmentButton = (key?: string) => {
    if (!hasAttachmentAction) return null;
    return (
      <Tooltip key={key ?? "attach"} title="Attach files or images">
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          sx={{
            bgcolor: badgeBackground,
            color: fileText,
            width: primaryIconSize,
            height: primaryIconSize,
            borderRadius: "50%",
            "&:hover": { bgcolor: hoverBadgeBackground },
          }}
        >
          +
        </IconButton>
      </Tooltip>
    );
  };

  const renderMemoryButton = (key?: string) => {
    if (!hasMemoryAction) return null;
    return (
      <Tooltip key={key ?? "memory"} title="Memory">
        <IconButton
          onClick={() => setMemoryOpen(true)}
          sx={{
            bgcolor: badgeBackground,
            color: fileText,
            width: primaryIconSize,
            height: primaryIconSize,
            borderRadius: "50%",
            "&:hover": { bgcolor: hoverBadgeBackground },
          }}
        >
          <PsychologyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  const renderFeedbackButton = (key?: string) => {
    if (!hasFeedbackAction) return null;
    return (
      <Tooltip key={key ?? "feedback"} title="Send Feedback">
        <IconButton
          onClick={() => setFeedbackModalOpen(true)}
          sx={{
            bgcolor: badgeBackground,
            color: fileText,
            width: primaryIconSize,
            height: primaryIconSize,
            borderRadius: "50%",
            "&:hover": { bgcolor: hoverBadgeBackground },
          }}
        >
          <FeedbackIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  const renderSttButton = (key?: string) => {
    if (!hasSttAction) return null;
    return (
      <Box key={key ?? "stt"} sx={{ display: "flex", alignItems: "center" }}>
        <Transcriber onTranscriptionCompleted={handleTranscriptionCompleted} />
      </Box>
    );
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          bgcolor: shellBackground,
          zIndex: isMobile ? 1300 : 1000,
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          alignItems: "center",
          justifyContent: "end",
          marginTop: isMobile ? (compactMobile ? 0.5 : 1) : 2,
          px: isMobile ? (compactMobile ? 1.5 : 2) : 0,
          pb: isMobile ? mobileShellPadding : 3,
          pointerEvents: "none",
          "& > *": { pointerEvents: "auto" },
        }}
        ref={inputContainerRef}
      >
        <Box
          sx={{
            width: "100%",
            bgcolor: inputBackground,
            borderRadius: "24px",
            boxShadow: isMobile
              ? `0 0 0 1px ${theme.palette.mode === "dark" ? "#444" : "#eee"}`
              : "0 4px 20px rgba(0, 0, 0, 0.4)",
            px: isMobile ? (compactMobile ? 1 : 1.5) : 3,
            pt: isMobile ? (compactMobile ? 0.6 : 1) : 1,
            pb: isMobile ? (compactMobile ? 0.9 : 1.5) : 1.5,
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? (compactMobile ? 0.75 : 1) : 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: attachmentsGap,
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            {fileInputs.map((file, idx) => (
              <Box
                key={idx}
                sx={{
                  position: "relative",
                  bgcolor: fileBg,
                  px: attachmentChipPaddingX,
                  py: attachmentChipPaddingY,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? (compactMobile ? 0.6 : 0.9) : 1,
                }}
              >
                <Avatar
                  sx={{
                    width: isMobile ? (compactMobile ? 16 : 18) : 18,
                    height: isMobile ? (compactMobile ? 16 : 18) : 18,
                    fontSize: "0.7rem",
                    bgcolor: fileIconBg,
                    color: fileText,
                  }}
                  variant="rounded"
                >
                  {getFileIcon(file.name)}
                </Avatar>
                <Typography variant="caption" sx={{ color: fileText }}>
                  {file.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() =>
                    setFileInputs((prev) => prev.filter((_, i) => i !== idx))
                  }
                  sx={{ ml: 0.5, color: theme.palette.mode === "dark" ? "#aaa" : "#444" }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
            {pastedImages.map((img, idx) => (
              <Box key={`img-${idx}`} sx={{ position: "relative" }}>
              <Avatar
                src={img}
                variant="rounded"
                sx={{
                  width: isMobile ? (compactMobile ? 30 : 32) : 32,
                  height: isMobile ? (compactMobile ? 30 : 32) : 32,
                  border: `1px solid ${fileIconBg}`,
                }}
              />
                <IconButton
                  size="small"
                  onClick={() => removeImage(idx)}
                  sx={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    bgcolor: fileText,
                    p: 0.3,
                    zIndex: 2,
                    transition: "background-color 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255, 5, 5, 0.85)",
                    },
                  }}
                >
                  <CloseIcon
                    sx={{
                      fontSize: 14,
                      color: badgeBackground,
                    }}
                  />
                </IconButton>
              </Box>
            ))}
            <input
              type="file"
              accept=".txt,.docx,.pdf,.md,.json,.js,.ts,.tsx,.py,.java,.c,.cpp,.cs,image/*"
              multiple
              hidden
              ref={fileInputRef}
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                const nonImages = selected.filter(
                  (file) => !file.type.startsWith("image/")
                );
                const images = selected.filter((file) => file.type.startsWith("image/"));

                if (nonImages.length + fileInputs.length > 3) {
                  fileInputRef.current!.value = ""; // allow re-upload of same file
                  return;
                }

                const safeNonImages = nonImages.filter((file) => file.size <= 1_000_000); // Optional: size cap
                setFileInputs((prev) => [...prev, ...safeNonImages]);

                images.forEach((image) => {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result;
                    if (result) {
                      setPastedImages((prev) => [...prev, result as string]);
                    }
                  };
                  reader.readAsDataURL(image);
                });

                fileInputRef.current!.value = ""; // allow re-upload of same file
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={isMobile ? (compactMobile ? 6 : 12) : 6}
              placeholder={"What's on your mind?"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              inputRef={inputRef}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  flex: "1 1 auto",
                  maxHeight: isMobile ? (compactMobile ? "120px" : "150px") : "none",
                  overflowY: "auto",
                  color: fileText,
                  "& .MuiInputBase-inputMultiline": {
                    fontSize: isMobile ? (compactMobile ? "0.95rem" : "1rem") : "1rem",
                  },
                },
              }}
              sx={{
                flex: 1,
                "& .MuiInputBase-root": {},
              }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: isMobile ? 0.6 : 1,
              mt: isMobile ? 0.5 : 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 0.6 : 1,
                minHeight: primaryIconSize,
              }}
            >
              {isVoiceModeEligible && (
                <>
                  <Tooltip
                    title={
                      !isVoiceModeEnabled
                        ? "Enable voice mode"
                        : voiceStatus === "error"
                          ? voiceError || "Voice mode error"
                          : voiceStatus === "processing"
                            ? "Transcribing your speech"
                            : voiceStatus === "recording"
                              ? "Recording - click to stop"
                              : voiceStatus === "initializing"
                                ? "Preparing microphone"
                        : "Listening - click to turn off"
                    }
                  >
                    <IconButton
                      onClick={toggleVoiceMode}
                      sx={{
                        width: primaryIconSize,
                        height: primaryIconSize,
                        borderRadius: "50%",
                        bgcolor: isVoiceModeEnabled
                          ? alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.45 : 0.3)
                          : badgeBackground,
                        color: isVoiceModeEnabled
                          ? theme.palette.common.white
                          : fileText,
                        boxShadow:
                          isVoiceModeEnabled && voiceStatus === "recording"
                            ? `0 0 0 2px ${alpha(theme.palette.error.main, 0.25)}`
                            : "none",
                        transform:
                          isVoiceModeEnabled && voiceStatus === "recording" ? "scale(1.05)" : "none",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                        "&:hover": {
                          bgcolor: isVoiceModeEnabled
                            ? alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.55 : 0.38)
                            : hoverBadgeBackground,
                        },
                      }}
                    >
                      {!isVoiceModeEnabled ? (
                        <GraphicEqIcon fontSize="small" sx={{ color: theme.palette.mode === "dark" ? fileText : theme.palette.text.secondary }} />
                      ) : voiceStatus === "processing" || voiceStatus === "initializing" ? (
                        <CircularProgress size={18} sx={{ color: fileText }} />
                      ) : voiceStatus === "error" ? (
                        <HearingDisabledIcon fontSize="small" sx={{ color: theme.palette.error.light }} />
                      ) : voiceStatus === "recording" ? (
                        <GraphicEqIcon fontSize="small" sx={{ color: theme.palette.error.light }} />
                      ) : (
                        <GraphicEqIcon fontSize="small" sx={{ color: theme.palette.common.white }} />
                      )}
                    </IconButton>
                  </Tooltip>
                  {!isMobile && isVoiceModeEnabled && (
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          voiceStatus === "error"
                            ? theme.palette.error.main
                            : voiceStatus === "processing"
                              ? theme.palette.warning.main
                              : fileText,
                        maxWidth: 240,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {voiceStatus === "error"
                        ? voiceError || "Voice mode unavailable"
                        : voiceStatus === "initializing"
                          ? "Starting voice mode..."
                          : voiceStatus === "recording"
                            ? "Recording..."
                            : voiceStatus === "processing"
                              ? "Transcribing..."
                              : voiceLastTranscript
                                ? `Heard: "${
                                    voiceLastTranscript.length > 60
                                      ? `${voiceLastTranscript.slice(0, 57)}...`
                                      : voiceLastTranscript
                                  }"`
                                : "Listening..."}
                    </Typography>
                  )}
                </>
              )}
              {!isMobile && renderAttachmentButton("attach-inline")}
              {!isMobile && renderMemoryButton("memory-inline")}
              {!isMobile && renderSttButton("stt-inline")}
              {isMobile && hasSecondaryActions && (
                <IconButton
                  onClick={() => setMoreActionsOpen((prev) => !prev)}
                  sx={{
                    bgcolor: badgeBackground,
                    color: fileText,
                    width: primaryIconSize,
                    height: primaryIconSize,
                    borderRadius: "50%",
                    transition: "background-color 0.2s ease",
                    "&:hover": { bgcolor: hoverBadgeBackground },
                  }}
                >
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{
                      transition: "transform 0.2s ease",
                      transform: moreActionsOpen ? "rotate(0deg)" : "rotate(180deg)",
                    }}
                  />
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 0.6 : 1 }}>
              <Tooltip title={isStreaming ? "Stop response" : "Send message"}>
                <span>
                  <IconButton
                    onClick={isStreaming ? (onStop || (() => {})) : handleSubmit}
                    disabled={
                      (isStreaming ? false : isSubmitting) ||
                      (!isStreaming &&
                        !inputValue.trim() &&
                        pastedImages.length === 0 &&
                        fileInputs.length === 0)
                    }
                    sx={{
                      bgcolor: sendButtonBackground,
                      color: sendButtonColor,
                      borderRadius: "50%",
                      width: sendIconSize,
                      height: sendIconSize,
                      boxShadow: sendButtonShadow,
                      transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": { bgcolor: sendButtonHover },
                      "&.Mui-disabled": { opacity: 0.5 },
                    }}
                  >
                    {isStreaming ? <CloseIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
          {isMobile && hasSecondaryActions && (
            <Collapse in={moreActionsOpen} unmountOnExit>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.7,
                  mt: 0.6,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                {renderAttachmentButton("attach-tray")}
                {renderMemoryButton("memory-tray")}
                {renderSttButton("stt-tray")}
                {renderFeedbackButton("feedback-tray")}
              </Box>
            </Collapse>
          )}
        </Box>

        <Typography
          variant="caption"
          sx={{
            mt: isMobile ? (compactMobile ? 0.25 : 0.75) : 1,
            color: captionColor,
            fontStyle: "italic",
            fontSize: "0.75rem",
            textAlign: "center",
            opacity: isKeyboardOpen ? 0 : 1,
            maxHeight: isKeyboardOpen ? 0 : "2.4rem",
            overflow: "hidden",
            transition: "opacity 120ms ease, max-height 120ms ease, transform 120ms ease",
            transform: `translateY(${isKeyboardOpen ? '6px' : '0'})`,
            pointerEvents: "none",
          }}
        >
          {brandingText || "BanditAI"} may be wrong - double-check important info.
        </Typography>
      </Box>

      {isMemoryEnabled && (
        <MemoryModal open={memoryOpen} onClose={() => setMemoryOpen(false)} />
      )}
      
      {isFeedbackEnabled && (
        <FeedbackModal 
          open={feedbackModalOpen} 
          onClose={() => setFeedbackModalOpen(false)}
          feedbackEmail={packageSettings?.feedbackEmail}
        />
      )}
    </>
  );
};

export default ChatInput;
