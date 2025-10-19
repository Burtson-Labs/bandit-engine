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

// Bandit Engine Watermark: BL-WM-5E11-84C444
const __banditFingerprint_prompts_documentSummarizationts = 'BL-FP-AEED1A-6849';
const __auditTrail_prompts_documentSummarizationts = 'BL-AU-MGOIKVVX-RYY6';
// File: documentSummarization.ts | Path: src/services/prompts/documentSummarization.ts | Hash: 5e116849

import { lastValueFrom, map } from "rxjs";
import { useAIProviderStore } from "../../store/aiProviderStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { debugLogger } from "../logging/debugLogger";

/**
 * Summarizes document content for indexing in the AI knowledge system.
 * 
 * @param name - The filename of the document
 * @param content - The document content to summarize
 * @returns Promise resolving to a concise summary string
 */
export const summarizeDocument = async (name: string, content: string): Promise<string> => {
  // Get the provider fresh each time the function is called
  const provider = useAIProviderStore.getState().provider;

  if (!provider) {
    debugLogger.error("No AI provider available for document summarization");
    return `Summary unavailable for ${name}`;
  }

  const prompt = `
You are an assistant designed to summarize documents for indexing in an AI knowledge system.
Summarize the following document in 1-2 concise sentences.
Only describe the content — do not add commentary, humor, or emojis.
If the file has a specific structure (e.g., C# code, policy, technical reference), mention that in the summary.

Filename: ${name}
Content:
${content.slice(0, 4000)}
`.trim();

  try {
    debugLogger.ragDebug("summarizeDocument", { name, contentLength: content.length });

    const data$ = provider.generate({
      model: usePackageSettingsStore.getState().settings?.defaultModel || "bandit-core",
      prompt,
      stream: false,
      options: { temperature: 0.3, num_predict: 100 },
    });

    const summary$ = data$.pipe(map((d) => d.response.trim()));
    const summary = await lastValueFrom(summary$);

    debugLogger.ragDebug("summarizeDocument result", { name, summary });

    return summary || `Document summary for ${name}`;
  } catch (error) {
    debugLogger.error("Error summarizing document:", { error, name });
    return `Summary error for ${name}`;
  }
};
