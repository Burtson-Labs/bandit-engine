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

// Bandit Engine Watermark: BL-WM-55CF-A7B3C5
const __banditFingerprint_examples_projectconversationhelperstsx = 'BL-FP-7D46DD-70DD';
const __auditTrail_examples_projectconversationhelperstsx = 'BL-AU-MGOIKVVD-U6W8';
// File: project-conversation-helpers.tsx | Path: src/examples/project-conversation-helpers.tsx | Hash: 55cf70dd

// Example: How to create a project and add conversations to it

import { useProjectStore } from '../store/projectStore';
import { useConversationStore } from '../store/conversationStore';

export function useProjectConversations() {
  const { createProject } = useProjectStore();
  const { createNewConversation, moveConversationToProject } = useConversationStore();

  // Method 1: Create a project and immediately add new conversations
  const createProjectWithConversation = async (projectName: string, projectDescription?: string) => {
    try {
      // Create the project
      const newProject = await createProject(projectName, projectDescription);
      
      // Create a new conversation in this project
      createNewConversation(newProject.id);
      
      return newProject;
    } catch (error) {
      console.error('Failed to create project with conversation:', error);
      throw error;
    }
  };

  // Method 2: Move existing conversations to a project
  const moveConversationsToProject = async (conversationIds: string[], projectId: string) => {
    try {
      await Promise.all(
        conversationIds.map(id => moveConversationToProject(id, projectId))
      );
    } catch (error) {
      console.error('Failed to move conversations:', error);
      throw error;
    }
  };

  return {
    createProjectWithConversation,
    moveConversationsToProject,
  };
}