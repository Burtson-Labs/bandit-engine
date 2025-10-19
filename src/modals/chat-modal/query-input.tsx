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

// Bandit Engine Watermark: BL-WM-C6A0-891060
const __banditFingerprint_chatmodal_queryinputtsx = 'BL-FP-B479CD-6C52';
const __auditTrail_chatmodal_queryinputtsx = 'BL-AU-MGOIKVVO-66S9';
// File: query-input.tsx | Path: src/modals/chat-modal/query-input.tsx | Hash: c6a06c52

import React, { useRef } from "react";
import { Box, TextField, IconButton, Tooltip, InputAdornment, useTheme } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

interface QueryInputProps {
  inputValue: string;
  onChange: (val: string) => void;
  onSend: (
    event: React.MouseEvent<HTMLButtonElement | HTMLDivElement> | React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>,
    value: string
  ) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  startAdornment?: React.ReactNode; // Added startAdornment prop
  endAdornment?: React.ReactNode;   // Added endAdornment prop
}

const QueryInput: React.FC<QueryInputProps> = ({
  inputValue,
  onChange,
  onSend,
  apiKey,
  setApiKey,
  showSettings,
  setShowSettings,
  startAdornment, // Destructure startAdornment
  endAdornment,   // Destructure endAdornment
}) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = (
    e: React.MouseEvent<HTMLButtonElement | HTMLDivElement> | React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>,
    payload: string
  ) => {
    onSend(e, payload);
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() !== "") {
        handleSend(e, inputValue);
      }
    }
  };

  return (
    <Box onMouseDown={(e) => e.stopPropagation()} sx={{ padding: 2 }}>
      {showSettings ? (
        <TextField
          fullWidth
          variant="outlined"
          label="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          InputProps={{
            sx: { color: theme.palette.text.primary, borderColor: theme.palette.divider },
            startAdornment: (
              <InputAdornment position="start">
                <Tooltip title="Toggle Settings">
                  <IconButton
                    aria-label="settings"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <CheckIcon sx={{ color: showSettings ? theme.palette.primary.main : theme.palette.text.primary }} />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: theme.palette.background.paper, borderRadius: 1 }}
        />
      ) : (
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask me anything..."
          value={inputValue}
          inputRef={inputRef}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          multiline
          maxRows={4}
          InputProps={{
            sx: { color: theme.palette.text.primary, borderColor: theme.palette.divider },
            startAdornment: startAdornment, // Use startAdornment prop
            endAdornment: endAdornment,   // Use endAdornment prop
          }}
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 1,
            "& .MuiOutlinedInput-root": { padding: "10px" },
          }}
        />
      )}
    </Box>
  );
};

export default QueryInput;
