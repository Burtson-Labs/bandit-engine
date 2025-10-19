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

// Bandit Engine Watermark: BL-WM-37EB-889E8F
const __banditFingerprint_prompts_documentRelevancets = 'BL-FP-678FBC-87EF';
const __auditTrail_prompts_documentRelevancets = 'BL-AU-MGOIKVVX-8TXA';
// File: documentRelevance.ts | Path: src/services/prompts/documentRelevance.ts | Hash: 37eb87ef

import { lastValueFrom, map, toArray } from "rxjs";
import { useAIProviderStore } from "../../store/aiProviderStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { debugLogger } from "../logging/debugLogger";

/**
 * Determines which documents are relevant to the user's question for RAG (Retrieval-Augmented Generation).
 * 
 * @param question - The user's question or prompt
 * @param docs - Array of documents with name and chunk content
 * @returns Promise resolving to array of relevant document indices
 */
export const determineRelevantDocuments = async (
  question: string,
  docs: { name: string; chunks: string[] }[]
): Promise<number[]> => {
  const provider = useAIProviderStore.getState().provider;
  if (!provider) {
    debugLogger.error("No AI provider available for knowledge relevance vetting");
    return [];
  }

  const vetPrompt = `
You are a context-aware assistant. The user is asking:

"${question}"

Here are some documents:
${docs
  .map(
    (d, i) =>
      `Doc ${i + 1} - "${d.name}":\n${d.chunks.slice(0, 2).join("\n").slice(0, 1000)}\n`
  )
  .join("\n")}

Only include documents if the user's question explicitly relates to their contents.

Reply with a comma-separated list of document numbers (e.g., "1,3,5") or "none" if no documents are relevant.

Response:`;

  const modelName = usePackageSettingsStore.getState().settings?.defaultModel || "bandit-core";

  try {
    debugLogger.ragDebug("determineRelevantDocuments", {
      question: question.slice(0, 100),
      docCount: docs.length,
      docNames: docs.map(d => d.name)
    });

    const response$ = provider.generate({
      model: modelName,
      prompt: vetPrompt,
      stream: false,
      options: { temperature: 0.2, num_predict: 50 },
    });

    const chunks$ = response$.pipe(
      map((chunk) => chunk.response.trim()),
      toArray()
    );

    const result = await lastValueFrom(chunks$);
    const vetResult = result.join("").trim().toLowerCase();

    debugLogger.ragDebug("determineRelevantDocuments result", { vetResult });

    if (vetResult.includes("none") || !vetResult) {
      return [];
    }

    // Parse comma-separated numbers
    const relevantIndices = vetResult
      .split(",")
      .map((s) => parseInt(s.trim()) - 1) // Convert to 0-based index
      .filter((i) => !isNaN(i) && i >= 0 && i < docs.length);

    debugLogger.ragDebug("determineRelevantDocuments parsed", { relevantIndices });

    return relevantIndices;
  } catch (error) {
    debugLogger.error("Error determining relevant documents:", { error });
    return [];
  }
};
