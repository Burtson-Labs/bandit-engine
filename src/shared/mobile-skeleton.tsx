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

// Bandit Engine Watermark: BL-WM-A21D-DF571A
const __banditFingerprint_shared_mobileskeletontsx = 'BL-FP-6C1BDA-B8CD';
const __auditTrail_shared_mobileskeletontsx = 'BL-AU-MGOIKVW2-IACQ';
// File: mobile-skeleton.tsx | Path: src/shared/mobile-skeleton.tsx | Hash: a21db8cd

import React, { useEffect, useState } from "react";
import { Box, Skeleton, useTheme, Typography } from "@mui/material";
import SignalWifi2BarIcon from "@mui/icons-material/SignalWifi2Bar";
import WifiOffIcon from "@mui/icons-material/WifiOff";

interface MobileSkeletonProps {
  isNetworkSlow?: boolean;
  showNetworkStatus?: boolean;
  personalityName?: string;
}

const MobileSkeleton: React.FC<MobileSkeletonProps> = ({ 
  isNetworkSlow = false, 
  showNetworkStatus = true, 
  personalityName
}) => {
  const theme = useTheme();
  const [animationDelay, setAnimationDelay] = useState(0);

  useEffect(() => {
    setAnimationDelay(Math.random() * 0.5);
  }, []);

  const animation = (isNetworkSlow ? "pulse" : "wave") as "pulse" | "wave";

  return (
    <Box 
      sx={{ 
        bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        borderRadius: 2, 
        p: 1.5, // Reduced from 2 to match message padding better
        width: "100%",
        border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
        position: "relative",
        overflow: "hidden",
        minHeight: "60px", // Ensure consistent minimum height
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", // Smooth transitions for container
        opacity: 0.9,
      }}
    >
      {/* Network status indicator */}
      {showNetworkStatus && isNetworkSlow && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "warning.main",
            zIndex: 1,
          }}
        >
          {navigator.onLine ? (
            <SignalWifi2BarIcon sx={{ fontSize: 16 }} />
          ) : (
            <WifiOffIcon sx={{ fontSize: 16 }} />
          )}
          <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
            {navigator.onLine ? "Slow" : "Offline"}
          </Typography>
        </Box>
      )}

      {/* Simulate a real response structure - AI Avatar + Name + "thinking" feedback */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center",
        gap: 1, 
        mb: 1,
        transition: "all 0.3s ease-out"
      }}>
        <Skeleton 
          variant="circular" 
          width={24} 
          height={24}
          animation={animation}
          sx={{ 
            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            flexShrink: 0,
            animationDelay: `${animationDelay}s`,
            animationDuration: isNetworkSlow ? "2s" : "1.5s",
            transition: "all 0.3s ease-out",
          }} 
        />
        <Box>
          <Skeleton 
            variant="text" 
            width="60px" 
            height={18}
            animation={animation}
            sx={{ 
              bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              animationDelay: `${animationDelay}s`,
              animationDuration: isNetworkSlow ? "2s" : "1.5s",
              transition: "all 0.3s ease-out",
              mb: 0.2
            }} 
          />
          {personalityName && (
            <Typography variant="caption" sx={{ 
              color: "primary.main", 
              fontStyle: "italic", 
              fontWeight: 600, 
              display: "flex", 
              alignItems: "center", 
              gap: 0.5,
              fontSize: "0.8rem"
            }}>
              <span style={{ 
                display: "inline-block", 
                animation: "fadeInOut 1.5s infinite alternate",
                color: theme.palette.mode === "dark" ? "#90CAF9" : "#1976D2"
              }}>
                {personalityName} is thinking
                <span 
                  className="thinking-dots" 
                  style={{ 
                    animation: "blinkDots 1.2s infinite steps(3, end)",
                    marginLeft: "2px"
                  }}
                >
                  ...
                </span>
              </span>
            </Typography>
          )}
        </Box>
      </Box>
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @keyframes blinkDots {
          0%, 20% { opacity: 0; }
          25%, 45% { opacity: 1; }
          50%, 70% { opacity: 0; }
          75%, 95% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      
      {/* Content lines that look more realistic - varies by network */}
      <Box sx={{ 
        pl: 3.5,
        transition: "all 0.3s ease-out"
      }}> {/* Reduced padding left from 4 to 3.5 */}
        {/* First paragraph */}
        <Skeleton 
          variant="text" 
          width="95%" 
          height={16} // Reduced from 18 to 16
          animation={animation}
          sx={{ 
            mb: 0.5,
            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            animationDelay: `${animationDelay + 0.1}s`,
            animationDuration: isNetworkSlow ? "2s" : "1.5s",
          }} 
        />
        <Skeleton 
          variant="text" 
          width="88%" 
          height={16} // Reduced from 18 to 16
          animation={animation}
          sx={{ 
            mb: 0.5,
            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            animationDelay: `${animationDelay + 0.2}s`,
            animationDuration: isNetworkSlow ? "2s" : "1.5s",
          }} 
        />
        <Skeleton 
          variant="text" 
          width="92%" 
          height={16} // Reduced from 18 to 16
          animation={animation}
          sx={{ 
            mb: 0.5, // Reduced margin bottom
            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            animationDelay: `${animationDelay + 0.3}s`,
            animationDuration: isNetworkSlow ? "2s" : "1.5s",
          }} 
        />
        
        {/* Second paragraph - only show if not slow network */}
        {!isNetworkSlow && (
          <>
            <Skeleton 
              variant="text" 
              width="75%" 
              height={18}
              animation={animation}
              sx={{ 
                mb: 0.5,
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                animationDelay: `${animationDelay + 0.4}s`,
                animationDuration: "1.5s",
              }} 
            />
            <Skeleton 
              variant="text" 
              width="82%" 
              height={18}
              animation={animation}
              sx={{ 
                mb: 1,
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                animationDelay: `${animationDelay + 0.5}s`,
                animationDuration: "1.5s",
              }} 
            />
          </>
        )}

        {/* Thinking indicator for slow networks */}
        {isNetworkSlow && (
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1, 
              mt: 1,
              color: "text.secondary" 
            }}
          >
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: "text.secondary",
                    opacity: 0.6,
                    animation: "bounce 1.5s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                    "@keyframes bounce": {
                      "0%, 60%, 100%": { transform: "translateY(0)" },
                      "30%": { transform: "translateY(-4px)" },
                    },
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" sx={{ fontStyle: "italic" }}>
              Thinking...
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Action bar placeholder - only show if not slow network */}
      {!isNetworkSlow && (
        <Box sx={{ display: "flex", gap: 1, mt: 2, pl: 4 }}>
          <Skeleton 
            variant="circular" 
            width={28} 
            height={28}
            animation={animation}
            sx={{ 
              bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              animationDelay: `${animationDelay + 0.6}s`,
              animationDuration: "1.5s",
            }} 
          />
          <Skeleton 
            variant="circular" 
            width={28} 
            height={28}
            animation={animation}
            sx={{ 
              bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              animationDelay: `${animationDelay + 0.7}s`,
              animationDuration: "1.5s",
            }} 
          />
          <Skeleton 
            variant="circular" 
            width={28} 
            height={28}
            animation={animation}
            sx={{ 
              bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              animationDelay: `${animationDelay + 0.8}s`,
              animationDuration: "1.5s",
            }} 
          />
        </Box>
      )}
    </Box>
  );
};

export default MobileSkeleton;
