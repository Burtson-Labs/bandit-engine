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

// Bandit Engine Watermark: BL-WM-B7CD-C532E1
const __banditFingerprint_examples_projectsintegrationdemotsx = 'BL-FP-8704C5-3596';
const __auditTrail_examples_projectsintegrationdemotsx = 'BL-AU-MGOIKVVD-ZX2H';
// File: projects-integration-demo.tsx | Path: src/examples/projects-integration-demo.tsx | Hash: b7cd3596

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
} from "@mui/material";
import { useProjectStore } from "../store/projectStore";
import { useConversationStore } from "../store/conversationStore";
import QuickAddProjectButton from "../chat/quick-add-project-button";
import ProjectManagementModal from "../chat/project-management-modal";

/**
 * Demo component showing how to integrate the Projects feature
 * This can be used as a reference implementation or for testing
 */
const ProjectsIntegrationDemo: React.FC = () => {
  const { projects, _hasHydrated: projectsHydrated } = useProjectStore();
  const { 
    conversations, 
    getConversationsByProject, 
    moveConversationToProject,
    createNewConversation,
    _hasHydrated: conversationsHydrated 
  } = useConversationStore();

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCreateTestConversation = async (projectId?: string) => {
    try {
      createNewConversation(projectId);
      setStatusMessage(`Created new conversation${projectId ? ' in project' : ''}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleMoveRandomConversation = async () => {
    if (conversations.length === 0 || projects.length === 0) {
      setStatusMessage("Need at least one conversation and one project");
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    try {
      const randomConv = conversations[Math.floor(Math.random() * conversations.length)];
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      
      await moveConversationToProject(randomConv.id, randomProject.id);
      setStatusMessage(`Moved "${randomConv.name}" to "${randomProject.name}"`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  if (!projectsHydrated || !conversationsHydrated) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading projects and conversations...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Projects Feature Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo shows the Projects feature integration. You can create projects,
        move conversations between them, and see how they organize your chats.
      </Typography>

      {statusMessage && (
        <Alert severity={statusMessage.startsWith('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {statusMessage}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <QuickAddProjectButton 
          onProjectCreated={(id) => {
            setStatusMessage(`Project created successfully!`);
            setTimeout(() => setStatusMessage(null), 3000);
          }}
        />
        <Button 
          variant="outlined" 
          onClick={() => setShowProjectModal(true)}
        >
          Manage Projects
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => handleCreateTestConversation()}
        >
          Create Test Conversation
        </Button>
        <Button 
          variant="outlined" 
          onClick={handleMoveRandomConversation}
        >
          Move Random Conversation
        </Button>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {/* Projects Overview */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Projects ({projects.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {projects.length === 0 ? (
              <Typography color="text.secondary">
                No projects yet. Create one to get started!
              </Typography>
            ) : (
              <List dense>
                {projects.map((project) => {
                  const projectConversations = getConversationsByProject(project.id);
                  
                  return (
                    <ListItem key={project.id} sx={{ px: 0 }}>
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: "50%", 
                          bgcolor: project.color,
                          mr: 1,
                          flexShrink: 0,
                        }} 
                      />
                      <ListItemText
                        primary={project.name}
                        secondary={project.description}
                      />
                      <Chip
                        label={projectConversations.length}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Conversations Overview */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Conversations ({conversations.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {conversations.length === 0 ? (
              <Typography color="text.secondary">
                No conversations yet. Create one to test the feature!
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                <List dense>
                  {conversations.map((conversation) => {
                    const project = projects.find(p => p.id === conversation.projectId);
                    
                    return (
                      <ListItem key={conversation.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={conversation.name}
                          secondary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="caption">
                                Model: {conversation.model}
                              </Typography>
                              {project ? (
                                <Chip
                                  label={project.name}
                                  size="small"
                                  sx={{
                                    bgcolor: project.color + "20",
                                    color: project.color,
                                    height: 20,
                                  }}
                                />
                              ) : (
                                <Chip
                                  label="Ungrouped"
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20 }}
                                />
                              )}
                            </Box>
                          }
                        />
                        <Button
                          size="small"
                          onClick={() => handleCreateTestConversation(conversation.projectId)}
                        >
                          + Similar
                        </Button>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Ungrouped Conversations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ungrouped Conversations
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {(() => {
              const ungroupedConversations = getConversationsByProject(null);
              
              return ungroupedConversations.length === 0 ? (
                <Typography color="text.secondary">
                  All conversations are organized in projects!
                </Typography>
              ) : (
                <List dense>
                  {ungroupedConversations.slice(0, 5).map((conversation) => (
                    <ListItem key={conversation.id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={conversation.name}
                        secondary={`Messages: ${conversation.history.length}`}
                      />
                    </ListItem>
                  ))}
                  {ungroupedConversations.length > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      +{ungroupedConversations.length - 5} more...
                    </Typography>
                  )}
                </List>
              );
            })()}
          </CardContent>
        </Card>

        {/* Usage Tips */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Usage Tips
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Project Colors"
                  secondary="Use different colors to visually distinguish projects"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Backward Compatibility"
                  secondary="Existing conversations remain unchanged and functional"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Mobile Support"
                  secondary="Full project management available on mobile devices"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Search & Filter"
                  secondary="Search works across all projects and conversations"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>

      <ProjectManagementModal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
      />
    </Box>
  );
};

export default ProjectsIntegrationDemo;