/*
  (c) 2025 Burtson Labs - Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  AI NOTICE: This file contains visible and invisible watermarks.
  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-6B2D-4F1A09
const __banditFingerprint_components_KnowledgeHubTabtsx = "BL-FP-83E1A4-7C2B";
const __auditTrail_components_KnowledgeHubTabtsx = "BL-AU-MGOIKVWZ-RU6M";
// File: KnowledgeHubTab.tsx | Path: src/management/components/KnowledgeHubTab.tsx | Hash: 6b2d7c2b

import React, { useEffect, useState } from "react";
import { Box, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import KnowledgeTab from "./KnowledgeTab";
import SeedPacksTab from "./SeedPacksTab";
import { AutoStoriesIcon, DescriptionIcon } from "../../icons/lucide-icons";

type KnowledgeHubTabProps = React.ComponentProps<typeof KnowledgeTab> & {
  seedPacksEnabled?: boolean;
};

const KnowledgeHubTab: React.FC<KnowledgeHubTabProps> = (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { seedPacksEnabled = false } = props;
  const [tabIndex, setTabIndex] = useState(0);
  const effectiveTabIndex = seedPacksEnabled ? tabIndex : 0;

  useEffect(() => {
    if (!seedPacksEnabled && tabIndex !== 0) {
      setTabIndex(0);
    }
  }, [seedPacksEnabled, tabIndex]);

  return (
    <Box>
      <Box sx={{ px: { xs: 1.5, sm: 3, md: 4 }, pt: { xs: 1.5, md: 2 } }}>
        <Tabs
          value={effectiveTabIndex}
          onChange={(_, newValue) => setTabIndex(newValue)}
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              minWidth: { xs: "auto", md: 160 },
              px: { xs: 1.2, sm: 1.5 },
            },
          }}
        >
          <Tab
            icon={<DescriptionIcon fontSize={isMobile ? "small" : "medium"} />}
            iconPosition={isMobile ? "top" : "start"}
            label="Documents"
          />
          {seedPacksEnabled && (
            <Tab
              icon={<AutoStoriesIcon fontSize={isMobile ? "small" : "medium"} />}
              iconPosition={isMobile ? "top" : "start"}
              label="Seed Packs"
            />
          )}
        </Tabs>
      </Box>
      <Box sx={{ display: effectiveTabIndex === 0 ? "block" : "none" }}>
        <KnowledgeTab {...props} />
      </Box>
      {seedPacksEnabled && (
        <Box sx={{ display: effectiveTabIndex === 1 ? "block" : "none" }}>
          <SeedPacksTab />
        </Box>
      )}
    </Box>
  );
};

export default KnowledgeHubTab;
