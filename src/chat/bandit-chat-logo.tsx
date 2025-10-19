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

// Bandit Engine Watermark: BL-WM-C315-723983
const __banditFingerprint_chat_banditchatlogotsx = 'BL-FP-B03B6D-55C4';
const __auditTrail_chat_banditchatlogotsx = 'BL-AU-MGOIKVUW-H7IF';
// File: bandit-chat-logo.tsx | Path: src/chat/bandit-chat-logo.tsx | Hash: c31555c4

import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
const darkLogo = "https://cdn.burtson.ai/logos/bandit-ai-logo-simple.png";
const lightLogo = "https://cdn.burtson.ai/logos/bandit-ai-logo-simple-alt.png";

interface BanditChatLogoProps {
  atTop?: boolean;
  visible?: boolean;
}

const BanditChatLogo: React.FC<BanditChatLogoProps> = ({ atTop = false, visible = false }) => {
  const theme = useTheme();
  const logoUrl = theme.palette.mode === "light" ? lightLogo : darkLogo;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      const timeout = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timeout);
    }

    setIsVisible(false);
  }, [visible]);

  const backgroundStyle = { backgroundImage: `url(${logoUrl})` };
  const className = `bandit-logo ${isVisible ? "bandit-logo-visible" : "bandit-logo-hidden"}`;

  return (
    <div className="bandit-logo-container" style={atTop ? { alignItems: 'flex-start' } : undefined}>
      <div
        className={className}
        style={{
          ...backgroundStyle,
          ...(atTop ? { height: '40vh', marginTop: '16px' } : {}),
        }}
      />
    </div>
  );
};
export default BanditChatLogo;
