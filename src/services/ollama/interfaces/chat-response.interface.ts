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

// Bandit Engine Watermark: BL-WM-660D-906297
const __banditFingerprint_interfaces_chatresponseinterfacets = 'BL-FP-1B8427-A83B';
const __auditTrail_interfaces_chatresponseinterfacets = 'BL-AU-MGOIKVVW-DOGR';
// File: chat-response.interface.ts | Path: src/services/ollama/interfaces/chat-response.interface.ts | Hash: 660da83b

import { ChatMessage } from "./chat-message.interface";

export interface ChatResponse {
    model: string;
    created_at: string;
    message: ChatMessage;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

