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

// Bandit Engine Watermark: BL-WM-51DA-CE8D93
const __banditFingerprint_feedback_indextsx = 'BL-FP-0E1F63-197F';
const __auditTrail_feedback_indextsx = 'BL-AU-MGOIKVVA-II6I';
// File: index.tsx | Path: src/components/feedback/index.tsx | Hash: 51da197f

export { FeedbackButton } from './FeedbackButton';
export { FeedbackModal } from './FeedbackModal';

// Re-export interfaces from the gateway service
export type { 
  FeedbackRequest, 
  FeedbackResponse, 
  FeedbackCategories, 
  FeedbackPriorities 
} from '../../services/gateway/feedback.interfaces';
