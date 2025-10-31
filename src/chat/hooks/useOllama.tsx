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

// Bandit Engine Watermark: BL-WM-341E-6605F5
const __banditFingerprint_hooks_useOllamatsx = 'BL-FP-8A48B1-A3DC';
const __auditTrail_hooks_useOllamatsx = 'BL-AU-MGOIKVV3-TGZH';
// File: useOllama.tsx | Path: src/chat/hooks/useOllama.tsx | Hash: 341ea3dc

import { debugLogger } from "../../services/logging/debugLogger";
import { determineRelevantDocuments, getCurrentDateTimeContext } from "../../services/prompts";
// ==========================================
// 🧠 Bandit RAG + Mood-Aware Context (Phase 4)
//
// Overview:
// - Dynamically retrieves top *semantic* user memories using embeddings.
// - Auto-pins highly similar memories (cosine ≥ 0.98) for long-term relevance.
// - Pinned memories are prioritized and merged with fresh contextual ones.
// - Token budget for memory adapts based on model size and detected user mood.
// - Mood is inferred from each user message and injects tone guidance into the prompt.
// - Memory + Mood content is injected into the system prompt, not messages.
// - Prepares groundwork for full Retrieval-Augmented Generation (RAG).
//
// Token Budget & Mood Boost:
// | Model              | Base Tokens | Mood Boost | Notes                        |
// |--------------------|-------------|------------|------------------------------|
// | bandit-core:4b     | 750         | +250       | ✅ Optimized for efficiency   |
// | bandit-core:12b    | 1250        | +250       | Allows more history/context  |
//
// Developer Notes:
// - Embedding-driven semantic recall powers personalized, relevant responses.
// - Memory enhancer ensures deduplication and validates context alignment.
// - Mood engine enables dynamic tone shifts: high, neutral, or low energy.
// - Optimized for both personality fidelity and token hygiene.
// - Bandit scales seamlessly between quantized and high-capacity models.
// ==========================================
import { useCallback } from "react";
import { useKnowledgeStore, KnowledgeDoc } from "../../store/knowledgeStore";
import { useAIProviderStore } from "../../store/aiProviderStore";
import { useConversationStore } from "../../store/conversationStore";
import { useMemoryEnhancer } from "./useMemoryEnhancer";
import { embeddingService } from "../../services/embedding/embeddingService";
import { useMoodEngine, moodPromptMap } from "./useMoodEngine";
import { ComponentStatus, HistoryEntry } from "../../store/aiQueryStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { AIChatRequest, AIMessage } from "../../services/ai-provider/types/common.types";

// Model budget configuration - provider agnostic
export interface ModelBudget {
  maxTokens: number;
  memoryTokenBudget: number;
  historyMessages: number;
  moodInjection: boolean;
}

export type ModelConfigIdentifier =
  | "bandit-core:4b-it-qat"
  | "bandit-core:12b-it-qat"
  | "bandit-core:27b-it-qat"
  | "gemma3:4b-it-qat"
  | "gemma3:12b-it-qat"
  | "gemma3:27b-it-qat"
  | "gpt-3.5-turbo"
  | "gpt-4"
  | "gpt-4-turbo"
  | string;

const lightBudget: ModelBudget = {
  maxTokens: 2048,
  memoryTokenBudget: 750,
  historyMessages: 2,
  moodInjection: true,
};

const medBudget: ModelBudget = {
  maxTokens: 4096,
  memoryTokenBudget: 1250,
  historyMessages: 6,
  moodInjection: true,
};

const heavyBudget: ModelBudget = {
  maxTokens: 8192,
  memoryTokenBudget: 2000,
  historyMessages: 10,
  moodInjection: true,
};

const modelConfigs: { [key: ModelConfigIdentifier]: ModelBudget } = {
  // Ollama models
  "bandit-core:4b-it-qat": lightBudget,
  "bandit-core:12b-it-qat": medBudget,
  "bandit-core:27b-it-qat": medBudget,
  "gemma3:4b-it-qat": lightBudget,
  "gemma3:12b-it-qat": medBudget,
  "gemma3:27b-it-qat": medBudget,
  // OpenAI models
  "gpt-3.5-turbo": medBudget,
  "gpt-4": heavyBudget,
  "gpt-4-turbo": heavyBudget,
};

type DocumentWithChunks = KnowledgeDoc & { chunks: string[] };

export interface UseOllamaProps {
  isMobile: boolean;
  setStreamBuffer: React.Dispatch<React.SetStateAction<string>>;
  setIsSubmitting: (val: boolean) => void;
  setResponseStarted: (val: boolean) => void;
  setIsStreaming: (val: boolean) => void;
  setResponse: (response: string) => void;
  setPastedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setPendingMessage: React.Dispatch<
    React.SetStateAction<{ question: string; images?: string[] } | null>
  >;
  setLogoVisible: (val: boolean) => void;
  overrideComponentStatus: (status: ComponentStatus) => void;
  setPreviousQuestion: (val: string) => void;
  setInputValue: (value: string) => void;
  history: HistoryEntry[];
  addHistory: (entry: {
    question: string;
    answer: string;
    images?: string[];
    memoryUpdated?: boolean;
  }) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please use the new useAIProvider hook instead, which provides unified access to all AI providers.
 * 
 * Migration guide:
 * - Replace useOllama with useAIProvider
 * - The new hook includes built-in RAG features (memories, knowledge search, mood detection)
 * - Authentication and provider switching is handled automatically
 * 
 * Example migration:
 * ```typescript
 * // Old way:
 * const { chatStream } = useOllama({ ... });
 * 
 * // New way:
 * const { chatStream } = useAIProvider({ ... });
 * ```
 */
export const useOllama = ({
  isMobile,
  setStreamBuffer,
  setIsSubmitting,
  setResponseStarted,
  setIsStreaming,
  setResponse,
  setPastedImages,
  setPendingMessage,
  setLogoVisible,
  overrideComponentStatus,
  setPreviousQuestion,
  setInputValue,
  history,
  addHistory,
  inputRef,
}: UseOllamaProps) => {
  const provider = useAIProviderStore((state) => state.provider);
  const { runMemoryScan } = useMemoryEnhancer();
  const { moodTokenBoost, analyzeMood } = useMoodEngine();
  const { docs } = useKnowledgeStore();

  const runOllama = useCallback(
    async (systemPrompt: string, question: string, images: string[]) => {
      // Fallback to error if no provider is configured
      if (!provider) {
        debugLogger.error("No AI provider configured. Please initialize an AI provider.");
        overrideComponentStatus("Error");
        return;
      }

      const isLowIntent = question.trim().toLowerCase().match(/^(hi|hello|hey|yo|what'?s up|how are you)\??$/i);

      overrideComponentStatus("Loading");
      setIsSubmitting(true);
      setResponseStarted(true);
      setIsStreaming(true);
      setResponse("");
      setStreamBuffer("");

      // Get current model and config
      const modelName = usePackageSettingsStore.getState().settings?.defaultModel || "bandit-core:4b-it-qat";
      const CONFIG = modelConfigs[modelName] ?? modelConfigs["bandit-core:4b-it-qat"];

      const imageList = Array.isArray(images) ? [...images] : [];
      const base64Images = imageList.map((img) => img.split(",")[1]);

      const latestEntries = history.slice(-CONFIG.historyMessages);
      const contextMessages: AIMessage[] = latestEntries.flatMap((entry) => [
        { role: "user", content: entry.question },
        { role: "assistant", content: entry.answer },
      ]);

      let tokenLimit = CONFIG.memoryTokenBudget;
      let moodText = "";

      if (CONFIG.moodInjection) {
        try {
          const currentMood = await analyzeMood(question);
          tokenLimit += moodTokenBoost; // moodTokenBoost is a number
          moodText = moodPromptMap[currentMood] || "";
        } catch (error) {
          debugLogger.warn("Failed to analyze mood:", { error: error instanceof Error ? error.message : String(error) });
        }
      }

      let memoryText = "";
      let usedDocs: DocumentWithChunks[] = [];

      if (!isLowIntent) {
        try {
          // Get memory content
          const memoryList = await embeddingService.selectRelevantMemories(
            question,
            tokenLimit
          );
          debugLogger.memoryDebug("Memory selection", {
            tokenLimit,
            memoryCount: memoryList.length,
          });

          const memoryContent =
            memoryList.length > 0
              ? `The user has shared the following background information:\n\n- ${memoryList.join(
                  "\n- "
                )}\n\nUse this information to personalize your responses whenever relevant.`
              : "";

          // Search for knowledge documents relevant to the question
          const queryEmbedding = await embeddingService.generate(question);
          const validDocs = docs.filter(doc => doc.embedding && doc.embedding.length > 0);
          const scoredDocs = validDocs
            .map((doc) => {
              const score = doc.embedding ? embeddingService.cosineSimilarity(queryEmbedding, doc.embedding) : 0;
              // Log cosine scores for this doc
              debugLogger.ragDebug("Document cosine similarity scores", { 
                docName: doc.name, 
                score: score.toFixed(4) 
              });
              return { doc, score };
            });

          const strongMatches = scoredDocs.filter(entry => entry.score >= 0.82);
          const borderlineMatches = scoredDocs.filter(entry => entry.score >= 0.74 && entry.score < 0.82);

          const docScoreMap = new Map(
            scoredDocs.map(({ doc, score }) => [doc.id, score] as const)
          );

          const candidateDocs: DocumentWithChunks[] = [...strongMatches, ...borderlineMatches]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(({ doc }) => {
              const maybeChunks = (doc as unknown as { chunks?: unknown }).chunks;
              const normalizedChunks =
                Array.isArray(maybeChunks) && maybeChunks.length > 0
                  ? (maybeChunks as string[])
                  : doc.content
                  ? [doc.content]
                  : [];

              return {
                ...doc,
                chunks: normalizedChunks,
              };
            });

          // Debug: show doc scores and count
          debugLogger.ragDebug("Document validation summary", { 
            validDocsCount: validDocs.length 
          });
          debugLogger.table(
            scoredDocs.map((d) => ({
              name: d.doc.name,
              score: d.score.toFixed(3),
            })),
            "Document similarity scores"
          );

          if (candidateDocs.length === 0) {
            debugLogger.warn("No documents passed cosine threshold - skipping vetting");
          }

          let approvedIndexes: number[] = [];
          if (!isLowIntent && candidateDocs.length > 0) {
            // Transform docs to expected format for relevance determination
            const docsForRelevance = candidateDocs.map(doc => ({
              name: doc.name,
              chunks: doc.chunks.length > 0 ? doc.chunks : [doc.content || ""],
            }));
            approvedIndexes = await determineRelevantDocuments(question, docsForRelevance);
          } else if (isLowIntent) {
            debugLogger.info("Skipping knowledge/doc scan for low-intent input");
          }
          
          debugLogger.llmDebug("Document vetting results", { 
            approvedIndexes, 
            candidateDocNames: candidateDocs.map(d => d.name) 
          });

          usedDocs = approvedIndexes
            .map((i) => candidateDocs[i])
            .filter((doc): doc is DocumentWithChunks => Boolean(doc));

          // Further filter by cosine score
          usedDocs = usedDocs.filter((doc) => {
            const docScore = docScoreMap.get(doc.id) ?? 0;
            return docScore >= 0.80;
          });

          const docContent =
            usedDocs.length > 0
              ? `The user has also uploaded documents relevant to this question:\n\n${usedDocs
                  .map((doc) => `📄 ${doc.name}\n${doc.chunks.join("\n\n")}`)
                  .join("\n\n")}`
              : "";

          // Combine memory and document content
          memoryText = `${memoryContent ? memoryContent : ""}${docContent ? "\n\n" + docContent : ""}`;

        } catch (error) {
          debugLogger.warn("Failed to process knowledge documents:", { error: error instanceof Error ? error.message : String(error) });
        }
      }

      // Build the complete system prompt with current date/time context
      const dateTimeContext = getCurrentDateTimeContext();
      const enhancedSystemPrompt = `${systemPrompt}${moodText}${memoryText}${dateTimeContext}`;

      // Prepare messages for AI provider
      const messages: AIMessage[] = [
        { role: "system", content: enhancedSystemPrompt },
        ...contextMessages,
        { role: "user", content: question }
      ];

      // Prepare request
      const request: AIChatRequest = {
        model: modelName,
        messages,
        stream: true,
        images: base64Images.length > 0 ? base64Images : undefined,
        options: { num_predict: tokenLimit + 250 }
      };

      let fullMessage = "";
      const stream = provider.chat(request);

      const conversationStoreState = useConversationStore.getState();
      const { addToCurrent, replaceLastAnswer, conversations, currentId } = conversationStoreState;
      const currentConv = conversations.find((c) => c.id === currentId);
      const lastEntry = currentConv?.history.at(-1);
      const lastWasPlaceholder =
        !!lastEntry && lastEntry.answer === "..." && lastEntry.placeholder !== false;

      if (!lastWasPlaceholder) {
        addHistory({ question, answer: "...", images: imageList.length > 0 ? [...imageList] : undefined });
        addToCurrent({
          question,
          answer: "...",
          images: imageList.length > 0 ? [...imageList] : undefined,
          sourceFiles: usedDocs,
          placeholder: true,
          rawQuestion: question,
        });
      }

      stream.subscribe({
        next: (data) => {
          if (!data?.message?.content) return;
          fullMessage += data.message.content;
          if (!isMobile) setStreamBuffer((prev) => prev + data.message.content);
        },
        error: (err: Error) => {
          debugLogger.error("Stream error:", err);
          overrideComponentStatus("Idle");
          setIsSubmitting(false);
        },
        complete: async () => {
          overrideComponentStatus("Idle");
          setIsSubmitting(false);
          setPreviousQuestion(question);
          setResponse(fullMessage);

          if (!fullMessage.trim()) {
            fullMessage =
              "Sorry, I got a bit tongue-tied there. Mind asking that again? 😅";
          }

          const memoryUpdated = await runMemoryScan(question, fullMessage);
          addHistory({
            question,
            answer: fullMessage,
            images: imageList.length > 0 ? [...imageList] : undefined,
            memoryUpdated,
          });
          const currentState = useConversationStore.getState();
          const conv = currentState.conversations.find((c) => c.id === currentState.currentId);
          const latest = conv?.history.at(-1);
          const latestIsPlaceholder =
            !!latest && latest.answer === "..." && latest.placeholder !== false;
          const preservedImagesSource =
            imageList.length > 0
              ? imageList
              : (latest && Array.isArray(latest.images) && latest.images.length > 0)
                ? latest.images
                : undefined;
          const preservedImages =
            Array.isArray(preservedImagesSource) && preservedImagesSource.length > 0
              ? [...preservedImagesSource]
              : undefined;

          if (latestIsPlaceholder) {
            replaceLastAnswer(fullMessage, preservedImages, memoryUpdated, usedDocs);
          } else {
            addToCurrent({
              question: latest?.question || question,
              answer: fullMessage,
              images: preservedImages,
              memoryUpdated,
              sourceFiles: usedDocs,
              rawQuestion: question,
            });
          }

          setInputValue("");
          setPastedImages([]);
          setPendingMessage(null);
          setStreamBuffer("");
          setIsStreaming(false);
          setLogoVisible(false);
          inputRef.current?.focus();
        },
      });
    },
    [
      isMobile,
      provider,
      history,
      setResponse,
      overrideComponentStatus,
      setPreviousQuestion,
      addHistory,
      setInputValue,
      setPastedImages,
      setPendingMessage,
      setStreamBuffer,
      setIsSubmitting,
      setResponseStarted,
      setLogoVisible,
      inputRef,
      moodTokenBoost,
      analyzeMood,
      runMemoryScan,
      docs,
      setIsStreaming,
    ]
  );

  return runOllama;
};
