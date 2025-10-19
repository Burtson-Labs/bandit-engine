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

// Bandit Engine Watermark: BL-WM-9A8D-D59FA3
const __banditFingerprint_examples_addconversationsexampletsx = 'BL-FP-62373F-B478';
const __auditTrail_examples_addconversationsexampletsx = 'BL-AU-MGOIKVVD-CV5A';
// File: add-conversations-example.tsx | Path: src/examples/add-conversations-example.tsx | Hash: 9a8db478

// Example React component showing how to add conversations to projects

import { useState } from 'react';
import { Button, Box, Alert } from '@mui/material';
import { useProjectStore } from '../store/projectStore';
import { useConversationStore } from '../store/conversationStore';
import QuickAddProjectButton from '../chat/quick-add-project-button';

export const AddConversationsExample = () => {
  const { projects } = useProjectStore();
  const { conversations, createNewConversation, moveConversationToProject } = useConversationStore();
  const [status, setStatus] = useState('');

  const handleCreateConversationInProject = async () => {
    if (projects.length === 0) {
      setStatus('Create a project first!');
      return;
    }

    try {
      // Create conversation in the first project
      const firstProject = projects[0];
      createNewConversation(firstProject.id);
      setStatus(`Created conversation in "${firstProject.name}"`);
    } catch (error) {
      setStatus('Error creating conversation');
    }
  };

  const handleMoveLastConversationToProject = async () => {
    if (conversations.length === 0 || projects.length === 0) {
      setStatus('Need at least one conversation and one project');
      return;
    }

    try {
      const lastConversation = conversations[conversations.length - 1];
      const firstProject = projects[0];
      
      await moveConversationToProject(lastConversation.id, firstProject.id);
      setStatus(`Moved "${lastConversation.name}" to "${firstProject.name}"`);
    } catch (error) {
      setStatus('Error moving conversation');
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 400 }}>
      <h3>Add Conversations to Projects</h3>
      
      {status && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {status}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Step 1: Create a project */}
        <QuickAddProjectButton 
          onProjectCreated={(projectId) => {
            setStatus('Project created! Now you can add conversations to it.');
          }}
        />

        {/* Step 2: Create conversation in project */}
        <Button 
          variant="contained" 
          onClick={handleCreateConversationInProject}
          disabled={projects.length === 0}
        >
          Create Conversation in Project
        </Button>

        {/* Step 3: Move existing conversation to project */}
        <Button 
          variant="outlined"
          onClick={handleMoveLastConversationToProject}
          disabled={conversations.length === 0 || projects.length === 0}
        >
          Move Last Conversation to Project
        </Button>

        {/* Status */}
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          Projects: {projects.length} | Conversations: {conversations.length}
        </Box>
      </Box>
    </Box>
  );
};