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

// Bandit Engine Watermark: BL-WM-9F14-407F4C
const __banditFingerprint_prompts_personalContentDetectionts = 'BL-FP-211453-BF82';
const __auditTrail_prompts_personalContentDetectionts = 'BL-AU-MGOIKVVX-Q4LY';
// File: personalContentDetection.ts | Path: src/services/prompts/personalContentDetection.ts | Hash: 9f14bf82

import { lastValueFrom, map, toArray } from "rxjs";
import { useAIProviderStore } from "../../store/aiProviderStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { debugLogger } from "../logging/debugLogger";

/**
 * Determines if user input contains meaningful information that shows their interests, 
 * excitement, or engagement - focusing on what could enhance their experience.
 * 
 * This replaces the old "personal information" approach which was too broad and intrusive.
 * Now we focus on user interest signals and engagement rather than demographic collection.
 * 
 * @param question - The user's input message
 * @param response - The AI's response (currently unused but available for context)
 * @returns Promise resolving to true if user interest/excitement is detected
 */
export const detectUserInterestAndExcitement = async (question: string, response: string): Promise<boolean> => {
  // Get the provider fresh each time the function is called
  const provider = useAIProviderStore.getState().provider;

  if (!provider) {
    debugLogger.error("No AI provider available for personal content detection");
    return false;
  }

  const prompt = `
  Detect if the user shared something meaningful that shows their interests, excitement, or personal connection.

  Look for USER INTEREST & EXCITEMENT signals:
  - User expressing enthusiasm, excitement, or passion about something
  - User sharing goals, dreams, or aspirations they care about
  - User mentioning preferences that affect their experience (tools, formats, workflows)
  - User revealing meaningful life experiences or achievements
  - User discussing plans, projects, or activities they're invested in
  - User sharing challenges they want to overcome or skills they want to develop

  IGNORE routine mentions:
  - Simple factual statements without emotional investment
  - Casual location references without context
  - Generic preferences without personal significance
  - Basic demographic info (age, location) without meaningful context
  - Complaints or negative experiences without constructive elements

  Focus on what could enhance their experience or help me serve them better.
  
  Reply "YES" only if the user shared something they care about or are excited about.
  Reply "NO" for routine information or casual mentions.
  
  User input:
  "${question}"
  
  Response:`;

  const modelName = usePackageSettingsStore.getState().settings?.defaultModel || "bandit-core";

  try {
    debugLogger.llmDebug("detectUserInterestAndExcitement", { question: question.slice(0, 100) });

    const response$ = provider.generate({
      model: modelName,
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 5 },
    });

    const chunks$ = response$.pipe(
      map((chunk) => chunk.response.trim().toUpperCase()),
      toArray()
    );

    const result = await lastValueFrom(chunks$);
    const decision = result.join("").trim();

    debugLogger.llmDebug("detectUserInterestAndExcitement result", { decision });

    return decision.includes("YES");
  } catch (error) {
    debugLogger.error("Error detecting personal content:", { error });
    return false;
  }
};
