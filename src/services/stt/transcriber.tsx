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

// Bandit Engine Watermark: BL-WM-F291-151AAD
const __banditFingerprint_stt_transcribertsx = 'BL-FP-CF71B4-71EF';
const __auditTrail_stt_transcribertsx = 'BL-AU-MGOIKVVZ-JTMQ';
// File: transcriber.tsx | Path: src/services/stt/transcriber.tsx | Hash: f29171ef

import { useState, useRef } from "react";
import MicIcon from "@mui/icons-material/Mic";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { SoundRecorderService } from "./sound-recorder.service";
import { STTClient } from "./stt-client";
import { CircularProgress, IconButton, useTheme } from "@mui/material";
import { from, Subscription, switchMap } from "rxjs";
import { debugLogger } from "../logging/debugLogger";

interface TranscriberProps {
  onTranscriptionCompleted: (text: string) => void;
}

type RecorderStatus = "IDLE" | "RECORDING" | "LOADING";

const initialButtonStyles = (badgeBackground: string, fileText: string, hoverBadgeBackground: string) => ({
  bgcolor: badgeBackground,
  color: fileText,
  width: 36,
  height: 36,
  borderRadius: "50%",
  "&:hover": { bgcolor: hoverBadgeBackground },
});

const Transcriber: React.FC<TranscriberProps> = ({ onTranscriptionCompleted }) => {
  const theme = useTheme();
  const badgeBackground = theme.palette.chat.badge;
  const fileText = theme.palette.chat.fileText;
  const hoverBadgeBackground = theme.palette.chat.badgeHover;
  const [status, setStatus] = useState<RecorderStatus>("IDLE");
  const recorderRef = useRef(new SoundRecorderService());
  const [iconButtonStyles] = useState(() => initialButtonStyles(badgeBackground, fileText, hoverBadgeBackground));
  const [recordingSub, setRecordingSub] = useState<Subscription>(() => new Subscription());
  const start = () => {
    recordingSub.unsubscribe();
    const recording = recorderRef.current.start();
    const text = recording.pipe(
      switchMap((blob: Blob) => {
        debugLogger.debug('Processing audio blob for transcription');
        return from(STTClient.transcribe(blob));
      })
    );
    const sub = text.subscribe({
      next: (value) => onTranscriptionCompleted(value),
      error: (error) => setStatus("IDLE"),
      complete: () => setStatus("IDLE"),
    });

    setRecordingSub(sub);
  };

  const stop = () => {
    recorderRef.current.stop();
  };
  const handleRecordClick = () => {
    setStatus("RECORDING");
    start();
  };
  const handleCancelClick = () => {
    setStatus("IDLE");
  };
  const handleSubmitClick = () => {
    setStatus("LOADING");
    stop();
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        transition: "all 0.2s ease",
        backgroundColor: status === "RECORDING" ? "rgba(0,0,0,.3)" : "rgba(0,0,0,0)",
        borderRadius: "50px",
      }}
    >
      {status === "IDLE" ? (
        <IconButton sx={{ ...iconButtonStyles }} onClick={handleRecordClick}>
          <MicIcon sx={{ color: "#aaa", cursor: "pointer" }} />
        </IconButton>
      ) : status === "RECORDING" ? (
        <>
          <IconButton
            onClick={handleCancelClick}
            sx={{ ...iconButtonStyles, marginRight: 1 }}
          >
            <CloseIcon></CloseIcon>
          </IconButton>
          <IconButton
            sx={{
              ...iconButtonStyles,
              filter: "invert(110%)",
            }}
            onClick={handleSubmitClick}
          >
            <CheckIcon></CheckIcon>
          </IconButton>
        </>
      ) : status === "LOADING" ? (
        <IconButton sx={{ ...iconButtonStyles }}>
          <CircularProgress size={20} />
        </IconButton>
      ) : null}
    </div>
  );
};

export default Transcriber;
