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

// Bandit Engine Watermark: BL-WM-75D8-51D2DC
const __banditFingerprint_hooks_useConversationNameGeneratortsx = 'BL-FP-10F724-D630';
const __auditTrail_hooks_useConversationNameGeneratortsx = 'BL-AU-MGOIKVV2-5247';
// File: useConversationNameGenerator.tsx | Path: src/chat/hooks/useConversationNameGenerator.tsx | Hash: 75d8d630

import { useAIProviderStore } from "../../store/aiProviderStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { debugLogger } from "../../services/logging/debugLogger";
import { lastValueFrom } from "rxjs";
import { map } from "rxjs/operators";
import { sanitizeConversationName } from "../../store/conversationStore";

export const useConversationNameGenerator = () => {
  const generateName = async (userMessage: string): Promise<string | null> => {
    // Get the provider fresh each time the function is called
    const provider = useAIProviderStore.getState().provider;
    const settings = usePackageSettingsStore.getState().settings;
    const defaultModel = settings?.defaultModel || "bandit-core";
    
    debugLogger.info("ConversationNameGenerator: Starting generation", { 
      hasProvider: !!provider, 
      providerType: provider?.getProviderType?.(),
      defaultModel,
      settingsModel: settings?.defaultModel
    });

    if (!provider) {
      debugLogger.error("No AI provider available for conversation name generation");
      return null;
    }

    // Use the same model selection as conversation starters
    const modelToUse = defaultModel;
    
    debugLogger.info("ConversationNameGenerator: Using model", { modelToUse, fromSettings: settings?.defaultModel });

    const prompt = `
Summarize this user message as a short and descriptive conversation name (max 6 words, title case):
"${userMessage}"

Respond with just the title and nothing else.
    `.trim();

    try {
      const result$ = provider.generate({
        model: modelToUse,
        prompt,
        stream: false,
        options: {
          temperature: 0.5,
          num_predict: 20,
        },
      });

      const title = await lastValueFrom(
        result$.pipe(map((d) => d.response?.trim().replace(/["']/g, "")))
      );

      if (title && title.length > 0) {
        const sanitizedTitle = sanitizeConversationName(title, 60);
        debugLogger.info("Generated conversation name:", { title: sanitizedTitle, userMessage: userMessage.slice(0, 50) });
        return sanitizedTitle;
      }
    } catch (err) {
      debugLogger.error("Conversation name generation failed:", { error: err, userMessage: userMessage.slice(0, 50), modelUsed: modelToUse });
    }

    return null;
  };

  return { generateName };
};
