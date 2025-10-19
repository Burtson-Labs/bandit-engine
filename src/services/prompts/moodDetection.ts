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

// Bandit Engine Watermark: BL-WM-C82D-3600CB
const __banditFingerprint_prompts_moodDetectionts = 'BL-FP-DC31B2-A7D0';
const __auditTrail_prompts_moodDetectionts = 'BL-AU-MGOIKVVX-475M';
// File: moodDetection.ts | Path: src/services/prompts/moodDetection.ts | Hash: c82da7d0

import { map, toArray } from "rxjs";
import { useAIProviderStore } from "../../store/aiProviderStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { debugLogger } from "../logging/debugLogger";
import { enhancePromptWithContext } from "./promptUtils";

/**
 * Detects the emotional tone of the user's message using the AI provider.
 * This helps drive token budgeting, avatar mood, and reinforcement logic.
 *
 * @param message - The user's message to analyze
 * @returns Promise resolving to emotional tone: "high" | "neutral" | "low"
 */
export const detectMessageMood = async (
  message: string
): Promise<"high" | "neutral" | "low"> => {
  // Get the provider fresh each time the function is called
  const provider = useAIProviderStore.getState().provider;

  if (!provider) {
    debugLogger.error("No AI provider available for mood detection");
    return "neutral";
  }

  const prompt = `
Rate the emotional tone of the user's message. Only respond with "high", "neutral", or "low".

If the message expresses strong enthusiasm, joy, or excitement, respond with "high".
If the message feels calm, polite, or ordinary, respond with "neutral".
If the message feels sad, bored, or frustrated, respond with "low".

Message: "${message}"

Response:`;

  const modelName = usePackageSettingsStore.getState().settings?.defaultModel || "bandit-core";

  try {
    debugLogger.llmDebug("detectMessageMood", { message: message.slice(0, 100) });

    const response$ = provider.generate({
      model: modelName,
      prompt: enhancePromptWithContext(prompt),
      stream: false,
      options: { temperature: 0.3, num_predict: 10 },
    });

    const chunks$ = response$.pipe(
      map((chunk) => chunk.response.trim().toLowerCase()),
      toArray()
    );

    const result = await chunks$.toPromise();
    const finalResult = (result || []).join("").trim();

    debugLogger.llmDebug("detectMessageMood result", { finalResult });

    // Validate the response
    if (finalResult.includes("high")) return "high";
    if (finalResult.includes("low")) return "low";
    return "neutral";
  } catch (error) {
    debugLogger.error("Error detecting mood:", { error });
    return "neutral";
  }
};
