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

// Bandit Engine Watermark: BL-WM-0A5F-162413
const __banditFingerprint_prompts_conversationStartersts = 'BL-FP-AC04B3-EC33';
const __auditTrail_prompts_conversationStartersts = 'BL-AU-MGOIKVVX-L4QX';
// File: conversationStarters.ts | Path: src/services/prompts/conversationStarters.ts | Hash: 0a5fec33

import { lastValueFrom, map } from "rxjs";
import { useAIProviderStore } from "../../store/aiProviderStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { getStableQuestionPrompt, QuestionPromptArgs } from "../../prompts/getStableQuestionPrompt";
import { debugLogger } from "../logging/debugLogger";
import { enhancePromptWithContext } from "./promptUtils";
import { notificationService } from "../notification/notificationService";

/**
 * Generates conversation starter prompts based on topics of interest.
 * 
 * @param parameters - Parameters for generating conversation starters
 * @param parameters.limit - Number of questions to generate (1-10)
 * @param parameters.topicOfInterest - Default topic e.g "sports, travel, being Mark Burtson, technology, coding, .NET, kite flying, etc."
 * @returns A promise that resolves to an array of conversation starters
 */
export const generateConversationStarters = async (args: QuestionPromptArgs): Promise<string[]> => {
  const provider = useAIProviderStore.getState().provider;
  if (!provider) {
    debugLogger.error("No AI provider available for generating conversation starters");
    return [];
  }

  const modelName = usePackageSettingsStore.getState().settings?.defaultModel || "default-model-fallback";
  
  try {
    const data$ = provider.generate({
      model: modelName,
      prompt: enhancePromptWithContext(getStableQuestionPrompt(args)),
      stream: false,
      options: { temperature: 1.5, num_predict: 250 },
    });
    const questions$ = data$.pipe(map((d) => {
      // Split by newlines and filter out empty/meaningless responses
      const lines = d.response.split("\n")
        .map(line => line.trim())
        .filter(line => {
          // Filter out empty lines, very short responses, or common meaningless responses
          return line.length > 10 && 
                 !line.toLowerCase().includes('sorry') &&
                 !line.toLowerCase().includes('i cannot') &&
                 !line.toLowerCase().includes('i can\'t') &&
                 !line.toLowerCase().includes('unable to') &&
                 !line.toLowerCase().startsWith('as an ai') &&
                 line.includes('?'); // Should be a question
        });
      return lines;
    }));
    const starters = await lastValueFrom(questions$);
    
    // Only return meaningful conversation starters
    if (starters.length === 0) {
      debugLogger.warn("No meaningful conversation starters generated");
      return [];
    }
    
    return starters;
  } catch (err) {
    debugLogger.error("❌ Failed to generate conversation starters:", { error: err });
    
    // Show notification to user for conversation starter generation failures
    notificationService.handleHttpError(err);
    
    return [];
  }
};
