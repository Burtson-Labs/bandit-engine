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

// Bandit Engine Watermark: BL-WM-33AD-0DA2DC
const __banditFingerprint_chat_customlogotsx = 'BL-FP-2A41D9-C05C';
const __auditTrail_chat_customlogotsx = 'BL-AU-MGOIKVV0-YYER';
// File: custom-logo.tsx | Path: src/chat/custom-logo.tsx | Hash: 33adc05c

import React, { useEffect } from "react";
import { Box, Avatar, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import "./chat.css";
import brandingService from "../services/branding/brandingService";
import { debugLogger } from "../services/logging/debugLogger";

interface BanditLogoProps {
  visible: boolean;
  atTop?: boolean;
}

const Logo: React.FC<BanditLogoProps> = ({ visible, atTop = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [logoBase64, setLogoBase64] = React.useState<string | null>(null);
  const [hasTransparentLogo, setHasTransparentLogo] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const brandingData = await brandingService.getBranding();
        if (brandingData) {
          setLogoBase64(brandingData.logoBase64 || null);
          setHasTransparentLogo(brandingData.hasTransparentLogo ?? true);
        }
      } catch (e) {
        debugLogger.error("Failed to load branding from service", { error: e });
      } finally {
        setLoading(false);
      }
    };
    loadBranding();
  }, []);

  return (
    logoBase64 &&
    <>
      {loading ? null : hasTransparentLogo ? (
        <Box
          component="img"
          src={logoBase64}
          alt="Custom Logo"
          className={`logo-container ${visible ? "fade-in" : "fade-out"} logo-animated`}
          sx={{
            width: isMobile ? "80vw" : "60vw",
            maxWidth: 600,
            aspectRatio: "1 / 1",
            margin: "0 auto",
            mt: atTop ? 2 : 6,
          }}
        />
      ) : (
        <Avatar
          src={logoBase64}
          variant="circular"
          className={`logo-container ${visible ? "fade-in" : "fade-out"} logo-animated`}
          sx={{
            width: isMobile ? "50vw" : "400px",
            height: isMobile ? "50vw" : "400px",
            maxWidth: 400,
            maxHeight: 400,
            aspectRatio: "1 / 1",
            bgcolor: theme.palette.background.paper,
            margin: "0 auto",
            mt: atTop ? 2 : 6,
            boxShadow: "0px 8px 24px rgba(0,0,0,0.3)",
            objectFit: "cover",
          }}
        />
      )}
    </>
  );
};

export default Logo;
