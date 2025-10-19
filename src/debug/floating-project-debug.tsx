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

// Bandit Engine Watermark: BL-WM-CDA7-21215C
const __banditFingerprint_debug_floatingprojectdebugtsx = 'BL-FP-4B2FA1-0F24';
const __auditTrail_debug_floatingprojectdebugtsx = 'BL-AU-MGOIKVVB-SNK3';
// File: floating-project-debug.tsx | Path: src/debug/floating-project-debug.tsx | Hash: cda70f24

import React, { useState } from "react";
import {
  Fab,
  Dialog,
  Box,
  Typography,
  Button,
  Alert,
  Chip,
} from "@mui/material";
import {
  BugReport as BugIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useProjectStore } from "../store/projectStore";
import { useConversationStore } from "../store/conversationStore";
import ProjectDebugPanel from "./project-debug-panel";

/**
 * Floating debug button to quickly test project features
 * Remove this component once projects are working properly
 */
const FloatingProjectDebug: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { projects, createProject } = useProjectStore();
  const { createNewConversation } = useConversationStore();

  const handleQuickTest = async () => {
    try {
      // Create a test project if none exist
      if (projects.length === 0) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("🧪 Creating test project...");
        }
        const testProject = await createProject(
          "Test Project", 
          "Auto-created for testing", 
          "#4CAF50"
        );
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("✅ Test project created:", testProject);
        }
        
        // Create a conversation in the project
        createNewConversation(testProject.id);
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("✅ Test conversation created in project");
        }
      } else {
        // Create conversation in existing project
        createNewConversation(projects[0].id);
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("✅ Test conversation created in existing project");
        }
      }
      
      alert("Test completed! Check the conversation drawer to see your project.");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("❌ Test failed:", error);
      }
      alert("Test failed - check console for details");
    }
  };

  // Only show in development or if there's an issue
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="secondary"
        aria-label="debug projects"
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          bgcolor: "#FF9800",
          "&:hover": {
            bgcolor: "#F57C00",
          },
        }}
        onClick={() => setOpen(true)}
      >
        <BugIcon />
      </Fab>

      {/* Debug Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            backgroundImage: "none",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">
              🐛 Projects Debug & Quick Test
            </Typography>
            <Button
              onClick={() => setOpen(false)}
              startIcon={<CloseIcon />}
              size="small"
            >
              Close
            </Button>
          </Box>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Project Test
            </Typography>
            <Typography variant="body2" gutterBottom>
              If you don't see project features, click "Quick Test" below.
              This will create a test project and conversation.
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Button
                variant="contained"
                color="warning"
                onClick={handleQuickTest}
                size="small"
              >
                🚀 Quick Test
              </Button>
            </Box>
          </Alert>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>How to see projects:</strong><br/>
              1. Click the ☰ menu icon in the top-left corner<br/>
              2. Look for the ⚙️ settings icon in the conversation drawer<br/>
              3. Click "Manage Projects" to create/edit projects<br/>
              4. Use "Select" mode to move conversations between projects
            </Typography>
          </Alert>

          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip label={`Projects: ${projects.length}`} color="primary" />
            <Chip 
              label="Enhanced Drawer Active" 
              color="success" 
              variant="outlined" 
            />
          </Box>

          <ProjectDebugPanel />
        </Box>
      </Dialog>
    </>
  );
};

export default FloatingProjectDebug;
