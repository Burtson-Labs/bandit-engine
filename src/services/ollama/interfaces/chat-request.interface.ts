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

// Bandit Engine Watermark: BL-WM-4193-8FA438
const __banditFingerprint_interfaces_chatrequestinterfacets = 'BL-FP-C92389-4263';
const __auditTrail_interfaces_chatrequestinterfacets = 'BL-AU-MGOIKVVW-V98B';
// File: chat-request.interface.ts | Path: src/services/ollama/interfaces/chat-request.interface.ts | Hash: 41934263

import { ChatMessage } from "./chat-message.interface";

export interface ChatRequest {
    model: string;
    messages: ChatMessage[];
    options?: Record<string, unknown>;
    stream?: boolean;
    image?: string;
    images?: string[];
}
