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

// Bandit Engine Watermark: BL-WM-525E-C46D2E
const __banditFingerprint_gateway_feedbackinterfacests = 'BL-FP-D3626B-29B5';
const __auditTrail_gateway_feedbackinterfacests = 'BL-AU-MGOIKVVT-IKOM';
// File: feedback.interfaces.ts | Path: src/services/gateway/feedback.interfaces.ts | Hash: 525e29b5

export interface FeedbackRequest {
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'improvement' | 'question' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  annoyanceLevel?: number; // 1-5 scale (1 = not annoying, 5 = very annoying)
  images?: string[]; // Base64 encoded images
  userAgent?: string;
  browserInfo?: {
    name: string;
    version: string;
    platform: string;
  };
  sessionInfo?: {
    currentModel?: string;
    currentProvider?: string;
    conversationId?: string;
    timestamp: string;
  };
  contactEmail?: string;
  attachments?: {
    name: string;
    content: string; // Base64 encoded
    type: string; // MIME type
    size: number;
  }[];
}

export interface FeedbackResponse {
  id: string;
  status: 'submitted' | 'acknowledged' | 'in-progress' | 'resolved' | 'rejected';
  message: string;
  ticketNumber?: string;
  estimatedResponse?: string; // ISO date string
  mailtoUrl?: string; // Fallback email URL
}

export interface FeedbackCategories {
  bug: {
    label: 'Bug Report';
    description: 'Something isn\'t working as expected';
    icon: 'BugReport';
    color: '#f44336';
  };
  feature: {
    label: 'Feature Request';
    description: 'Suggest a new feature or enhancement';
    icon: 'Lightbulb';
    color: '#2196f3';
  };
  improvement: {
    label: 'Improvement';
    description: 'Suggest improvements to existing features';
    icon: 'TrendingUp';
    color: '#ff9800';
  };
  question: {
    label: 'Question';
    description: 'Ask a question about usage or functionality';
    icon: 'Help';
    color: '#9c27b0';
  };
  other: {
    label: 'Other';
    description: 'General feedback or other topics';
    icon: 'Message';
    color: '#607d8b';
  };
}

export interface FeedbackPriorities {
  low: {
    label: 'Low';
    description: 'Minor issue, can wait';
    color: '#4caf50';
  };
  medium: {
    label: 'Medium';
    description: 'Normal priority';
    color: '#ff9800';
  };
  high: {
    label: 'High';
    description: 'Important, needs attention soon';
    color: '#f44336';
  };
  critical: {
    label: 'Critical';
    description: 'Urgent, blocks usage';
    color: '#d32f2f';
  };
}
