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
 * @param parameters.topicOfInterest - Default topic e.g "sports, travel, technology, coding, .NET, kite flying, etc."
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
      const sanitizeLine = (line: string): string => {
        const withoutNumbering = line
          .replace(/^[0-9]+[.)\-\s:]+/, "")
          .replace(/^[•*+-]\s+/, "");
        const withoutQuotes = withoutNumbering.replace(/^[“"']+/, "").replace(/[”"']+$/, "");
        const withoutEmoji = withoutQuotes.replace(/\p{Extended_Pictographic}/gu, "");
        return withoutEmoji.trim().replace(/\s+/g, " ");
      };

      // Split by newlines and filter out empty/meaningless responses
      const sanitized = d.response
        .split("\n")
        .map((line) => sanitizeLine(line.trim()))
        .filter((line) => {
          const lower = line.toLowerCase();
          return (
            line.length > 10 &&
            line.includes("?") &&
            !lower.includes("sorry") &&
            !lower.includes("i cannot") &&
            !lower.includes("i can't") &&
            !lower.includes("unable to") &&
            !lower.startsWith("as an ai")
          );
        })
        .filter((line) => line.length > 0);

      // Deduplicate while preserving order
      const unique: string[] = [];
      const seen = new Set<string>();
      sanitized.forEach((line) => {
        const key = line
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, " ")
          .trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          unique.push(line);
        }
      });
      return unique;
    }));
    const starters = await lastValueFrom(questions$);
    
    // Only return meaningful conversation starters
    if (starters.length === 0) {
      debugLogger.warn("No meaningful conversation starters generated");
      return [];
    }
    
    return starters.slice(0, args.limit);
  } catch (err) {
    debugLogger.error("❌ Failed to generate conversation starters:", { error: err });
    
    // Show notification to user for conversation starter generation failures
    notificationService.handleHttpError(err);
    
    return [];
  }
};
