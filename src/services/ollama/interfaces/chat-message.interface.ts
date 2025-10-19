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

// Bandit Engine Watermark: BL-WM-4133-6F4B68
const __banditFingerprint_interfaces_chatmessageinterfacets = 'BL-FP-1612F6-C02D';
const __auditTrail_interfaces_chatmessageinterfacets = 'BL-AU-MGOIKVVW-7EKE';
// File: chat-message.interface.ts | Path: src/services/ollama/interfaces/chat-message.interface.ts | Hash: 4133c02d

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
}
