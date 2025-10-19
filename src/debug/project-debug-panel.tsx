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

// Bandit Engine Watermark: BL-WM-833F-3FBC7F
const __banditFingerprint_debug_projectdebugpaneltsx = 'BL-FP-F5D47A-031A';
const __auditTrail_debug_projectdebugpaneltsx = 'BL-AU-MGOIKVVC-T9TH';
// File: project-debug-panel.tsx | Path: src/debug/project-debug-panel.tsx | Hash: 833f031a

import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Divider,
} from "@mui/material";
import { useProjectStore } from "../store/projectStore";
import { useConversationStore } from "../store/conversationStore";

/**
 * Debug component to help troubleshoot project feature issues
 */
const ProjectDebugPanel: React.FC = () => {
  const {
    projects,
    _hasHydrated: projectsHydrated,
    hydrate: hydrateProjects,
    createProject,
  } = useProjectStore();

  const {
    conversations,
    _hasHydrated: conversationsHydrated,
    getConversationsByProject,
    createNewConversation,
    moveConversationToProject,
  } = useConversationStore();

  const handleCreateTestProject = async () => {
    try {
      await createProject("Test Project", "Created by debug panel", "#2196F3");
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("✅ Test project created successfully");
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("❌ Failed to create test project:", error);
      }
    }
  };

  const handleCreateTestConversation = async () => {
    try {
      if (projects.length > 0) {
        createNewConversation(projects[0].id);
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("✅ Test conversation created in first project");
        }
      } else {
        createNewConversation();
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("✅ Test conversation created without project");
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("❌ Failed to create test conversation:", error);
      }
    }
  };

  const handleForceHydrate = async () => {
    try {
      if (!projectsHydrated) {
        await hydrateProjects();
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("✅ Projects hydrated manually");
        }
      } else {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("ℹ️ Projects already hydrated");
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("❌ Failed to hydrate projects:", error);
      }
    }
  };

  const ungroupedConversations = getConversationsByProject(null);

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        🐛 Project Features Debug Panel
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Use this panel to troubleshoot project features and verify everything is working.
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Status Overview */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Status Overview
          </Typography>
          
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <Chip 
              label={`Projects Hydrated: ${projectsHydrated ? "✅" : "❌"}`}
              color={projectsHydrated ? "success" : "error"}
              variant="outlined"
            />
            <Chip 
              label={`Conversations Hydrated: ${conversationsHydrated ? "✅" : "❌"}`}
              color={conversationsHydrated ? "success" : "error"}
              variant="outlined"
            />
            <Chip 
              label={`Projects: ${projects.length}`}
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={`Conversations: ${conversations.length}`}
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={`Ungrouped: ${ungroupedConversations.length}`}
              color="secondary"
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleCreateTestProject}
            >
              Create Test Project
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleCreateTestConversation}
            >
              Create Test Conversation
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleForceHydrate}
            >
              Force Hydrate Projects
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Projects ({projects.length})
          </Typography>
          
          {projects.length === 0 ? (
            <Alert severity="info">
              No projects found. Click "Create Test Project" above to create one.
            </Alert>
          ) : (
            <List dense>
              {projects.map((project) => {
                const projectConversations = getConversationsByProject(project.id);
                return (
                  <ListItem key={project.id}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        bgcolor: project.color,
                        mr: 2,
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={`${project.name} (${projectConversations.length} conversations)`}
                      secondary={project.description}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Conversations List */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Conversations ({conversations.length})
          </Typography>
          
          {conversations.length === 0 ? (
            <Alert severity="info">
              No conversations found. Click "Create Test Conversation" above to create one.
            </Alert>
          ) : (
            <Box sx={{ maxHeight: 300, overflow: "auto" }}>
              <List dense>
                {conversations.slice(0, 10).map((conversation) => {
                  const project = projects.find(p => p.id === conversation.projectId);
                  return (
                    <ListItem key={conversation.id}>
                      <ListItemText
                        primary={conversation.name}
                        secondary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="caption">
                              Project: {project?.name || "None"}
                            </Typography>
                            <Typography variant="caption">
                              Messages: {conversation.history.length}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
                {conversations.length > 10 && (
                  <Typography variant="caption" color="text.secondary" sx={{ p: 2 }}>
                    ... and {conversations.length - 10} more conversations
                  </Typography>
                )}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Console Instructions */}
      <Alert severity="info">
        <Typography variant="subtitle2" gutterBottom>
          Console Debug Commands:
        </Typography>
        <Typography variant="body2" component="div">
          • Open browser console (F12)<br/>
          • Check for project-related logs<br/>
          • Look for any error messages<br/>
          • Test the buttons above and watch console output
        </Typography>
      </Alert>
    </Box>
  );
};

export default ProjectDebugPanel;
