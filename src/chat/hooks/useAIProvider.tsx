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

// Bandit Engine Watermark: BL-WM-4003-44028A
const __banditFingerprint_hooks_useAIProvidertsx = 'BL-FP-53B7AF-EC0F';
const __auditTrail_hooks_useAIProvidertsx = 'BL-AU-MGOIKVV1-E28V';
// File: useAIProvider.tsx | Path: src/chat/hooks/useAIProvider.tsx | Hash: 4003ec0f

import { debugLogger } from "../../services/logging/debugLogger";
import { useCallback, useRef } from "react";
import type { Subscription } from "rxjs";
import type { KnowledgeDoc } from "../../store/knowledgeStore";
import { useKnowledgeStore } from "../../store/knowledgeStore";
import { useAIProviderStore } from "../../store/aiProviderStore";
import { syncTelemetry, telemetryStartTurn, telemetryEvent, telemetryEndTurn } from "../../services/telemetry";
import { useEngineStore } from "../../store/engineStore";
import { useConversationStore } from "../../store/conversationStore";
import { useMemoryEnhancer } from "./useMemoryEnhancer";
import { useVectorStore } from "../../hooks/useVectorStore";
import { embeddingService } from "../../services/embedding/embeddingService";
import { useMoodEngine, moodPromptMap } from "./useMoodEngine";
import { ComponentStatus, HistoryEntry } from "../../store/aiQueryStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { determineRelevantDocuments, getCurrentDateTimeContext } from "../../services/prompts";
import { AIChatRequest, AIMessage } from "../../services/ai-provider/types/common.types";
import { usePreferencesStore } from "../../store/preferencesStore";
import { getEnabledMCPToolsForAI, isMCPAvailable, executeMCPTool } from "../../services/mcp";
import { useAskUserStore, parseAskUserQuestions } from "../../store/askUserStore";
import type { VectorMemory, VectorMemoryMetadata } from "../../services/vectorDatabase/vectorDatabaseService";

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

type NormalizedVectorMemory = {
  id: string;
  content: string;
  title?: string;
  pinned: boolean;
  source: "auto" | "user";
  score: number;
  tags: string[];
  uploadedAt?: number;
  lastReferencedAt?: number;
  metadata?: VectorMemoryMetadata;
  personalConfidence?: number;
  engagement?: number;
  topic?: string;
};

type RawVectorDocument = {
  id?: string;
  documentId?: string;
  fileId?: string;
  _id?: string;
  metadata?: {
    id?: string;
    _id?: string;
    fileId?: string;
    [key: string]: unknown;
  };
  key?: string;
  filename?: string;
  name?: string;
  content?: string;
  mimeType?: string;
  type?: string;
  uploadedAt?: string | number | Date;
  size?: number;
  uploadedBy?: string;
  userEmail?: string;
  bucket?: string;
  isUserContent?: boolean;
  isTeamContent?: boolean;
  contentSource?: string;
  originalFileName?: string;
  [key: string]: unknown;
};

type KnowledgeSourceDoc = KnowledgeDoc & { _vectorResult?: RawVectorDocument; chunks?: string[] };

type MCPFunctionTool = ReturnType<typeof getEnabledMCPToolsForAI>[number];

type MCPToolParameters = Record<string, unknown>;

type ToolAwareChatRequest = AIChatRequest & { tools?: MCPFunctionTool[] };

interface WebSearchResultItem {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
}

interface WebSearchResponse {
  query?: string;
  answer?: string;
  results?: WebSearchResultItem[];
}

interface WebFetchResult {
  url?: string;
  status?: number;
  contentType?: string;
  content?: string;
  blocked?: boolean;
  error?: string;
}

interface ImageGenerationResult {
  imageUrl?: string;
  revisedPrompt?: string;
}

interface MemorySection {
  title: string;
  lines: string[];
}

interface PreparedMemoryContext {
  sections: MemorySection[];
  stats: {
    totalAvailable: number;
    selectedCount: number;
    pinnedSelected: number;
    personalSelected: number;
    otherSelected: number;
    tokensUsed: number;
    tokensRemaining: number;
    averageScore: number;
    averageConfidence: number;
  };
}

const PERSONAL_TAG_HINTS = [
  "personal",
  "profile",
  "bio",
  "favorite",
  "favourite",
  "likes",
  "dislikes",
  "hobby",
  "habit",
  "goal",
  "interest",
  "family",
  "relationship",
  "background",
  "origin",
  "birthday",
  "anniversary",
  "pet",
  "values",
  "preferences",
  "schedule",
  "team",
  "project",
];

const PERSONAL_TOPIC_HINTS = new Set([
  "personal",
  "preferences",
  "preference",
  "relationship",
  "family",
  "friends",
  "hobby",
  "travel",
  "learning",
  "education",
  "goal",
  "goals",
  "health",
  "wellness",
  "project",
  "work",
  "career",
]);

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const parseDateToEpoch = (value?: string | number): number | undefined => {
  if (!value && value !== 0) {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

const normalizeVectorMemory = (memory: VectorMemory): NormalizedVectorMemory | null => {
  const content = memory?.content?.trim();
  if (!content) {
    return null;
  }

  const metadata = memory.metadata;

  const tagSet = new Set<string>();
  (memory.tags || []).forEach((tag) => {
    if (typeof tag === "string") {
      tagSet.add(tag.toLowerCase().trim());
    }
  });
  (metadata?.tags || []).forEach((tag) => {
    if (typeof tag === "string") {
      tagSet.add(tag.toLowerCase().trim());
    }
  });

  const personalConfidence = metadata?.personalConfidence;
  const engagement = metadata?.engagement;
  const topic = metadata?.topic?.toLowerCase().trim();

  return {
    id: memory.id,
    content,
    title: memory.title,
    pinned: Boolean(memory.pinned),
    source: memory.source === "user" ? "user" : "auto",
    score: typeof memory.score === "number" ? memory.score : personalConfidence ?? 0,
    tags: Array.from(tagSet),
    uploadedAt: parseDateToEpoch(memory.uploadedAt),
    lastReferencedAt: parseDateToEpoch(memory.lastReferencedAt),
    metadata,
    personalConfidence: typeof personalConfidence === "number" ? clamp(personalConfidence) : undefined,
    engagement: typeof engagement === "number" ? clamp(engagement) : undefined,
    topic: topic,
  };
};

const isPersonalMemory = (memory: NormalizedVectorMemory): boolean => {
  if (memory.pinned || memory.source === "user") {
    return true;
  }

  if ((memory.personalConfidence ?? 0) >= 0.55) {
    return true;
  }

  if (memory.topic && PERSONAL_TOPIC_HINTS.has(memory.topic)) {
    return true;
  }

  const title = memory.title?.toLowerCase() || "";
  if (PERSONAL_TAG_HINTS.some((hint) => title.includes(hint))) {
    return true;
  }

  if (memory.tags.some((tag) => PERSONAL_TAG_HINTS.some((hint) => tag.includes(hint)))) {
    return true;
  }

  const metadataTags = (memory.metadata?.tags || []).map((tag) => tag.toLowerCase());
  if (metadataTags.some((tag) => PERSONAL_TAG_HINTS.some((hint) => tag.includes(hint)))) {
    return true;
  }

  const additionalValues = memory.metadata?.additionalProperties
    ? Object.values(memory.metadata.additionalProperties)
    : [];
  if (
    additionalValues.some(
      (value) =>
        typeof value === "string" &&
        PERSONAL_TAG_HINTS.some((hint) => value.toLowerCase().includes(hint))
    )
  ) {
    return true;
  }

  return false;
};

const computeRecencyBoost = (memory: NormalizedVectorMemory): number => {
  const reference = memory.lastReferencedAt ?? memory.uploadedAt;
  if (!reference) {
    return 0;
  }

  const ageDays = (Date.now() - reference) / (1000 * 60 * 60 * 24);
  if (ageDays <= 1) return 0.2;
  if (ageDays <= 7) return 0.15;
  if (ageDays <= 30) return 0.1;
  if (ageDays <= 90) return 0.05;
  return 0;
};

const computeBoostedScore = (memory: NormalizedVectorMemory): number => {
  const baseScore =
    typeof memory.score === "number" && memory.score > 0
      ? memory.score
      : memory.pinned
      ? 0.75
      : 0.2;
  const recencyBoost = computeRecencyBoost(memory);
  const personalBoost = memory.personalConfidence ? memory.personalConfidence * 0.25 : 0;
  const engagementBoost = memory.engagement ? memory.engagement * 0.15 : 0;
  const topicBoost = memory.topic && PERSONAL_TOPIC_HINTS.has(memory.topic) ? 0.08 : 0;
  const pinnedBoost = memory.pinned ? 0.25 : 0;
  return baseScore + recencyBoost + personalBoost + engagementBoost + topicBoost + pinnedBoost;
};

const formatMemoryLine = (memory: NormalizedVectorMemory): string => {
  const topicDescriptor = !memory.pinned && memory.topic ? `[${memory.topic}] ` : "";
  return memory.title ? `${topicDescriptor}${memory.title}: ${memory.content}` : `${topicDescriptor}${memory.content}`;
};

const prepareAdvancedMemoryContext = (
  memories: VectorMemory[],
  tokenBudget: number,
  estimateTokens: (text: string) => number
): PreparedMemoryContext => {
  const normalized = memories
    .map((memory) => normalizeVectorMemory(memory))
    .filter((memory): memory is NormalizedVectorMemory => Boolean(memory));

  if (normalized.length === 0) {
    return {
      sections: [],
      stats: {
        totalAvailable: 0,
        selectedCount: 0,
        pinnedSelected: 0,
        personalSelected: 0,
        otherSelected: 0,
        tokensUsed: 0,
        tokensRemaining: tokenBudget,
        averageScore: 0,
        averageConfidence: 0,
      },
    };
  }

  const deduped = new Map<string, NormalizedVectorMemory>();
  for (const memory of normalized) {
    const key = memory.id || memory.content.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, memory);
      continue;
    }

    const existing = deduped.get(key)!;
    if (computeBoostedScore(memory) > computeBoostedScore(existing)) {
      deduped.set(key, memory);
    }
  }

  const memoriesToConsider = Array.from(deduped.values());
  const sortByPriority = (a: NormalizedVectorMemory, b: NormalizedVectorMemory) =>
    computeBoostedScore(b) - computeBoostedScore(a);

  const pinned = memoriesToConsider.filter((memory) => memory.pinned).sort(sortByPriority);
  const personal = memoriesToConsider
    .filter((memory) => !memory.pinned && isPersonalMemory(memory))
    .sort(sortByPriority);
  const other = memoriesToConsider
    .filter((memory) => !memory.pinned && !isPersonalMemory(memory))
    .sort(sortByPriority);

  const selected: NormalizedVectorMemory[] = [];
  let tokensUsed = 0;

  const tryAddMemory = (memory: NormalizedVectorMemory) => {
    if (selected.some((existing) => existing.id === memory.id)) {
      return;
    }

    const tokensNeeded = estimateTokens(memory.content);
    if (tokensNeeded <= 0 || tokensUsed + tokensNeeded > tokenBudget) {
      return;
    }

    selected.push(memory);
    tokensUsed += tokensNeeded;
  };

  pinned.forEach(tryAddMemory);
  personal.forEach(tryAddMemory);

  if (selected.length === 0 && personal.length > 0) {
    tryAddMemory(personal[0]);
  }

  other.forEach(tryAddMemory);

  if (selected.length === 0 && other.length > 0) {
    tryAddMemory(other[0]);
  }

  const pinnedSelected = selected.filter((memory) => memory.pinned);
  const personalSelected = selected.filter((memory) => !memory.pinned && isPersonalMemory(memory));
  const otherSelected = selected.filter((memory) => !memory.pinned && !isPersonalMemory(memory));

  const sections: MemorySection[] = [];
  if (pinnedSelected.length) {
    sections.push({ title: "Pinned reminders", lines: pinnedSelected.map(formatMemoryLine) });
  }
  if (personalSelected.length) {
    sections.push({ title: "Personal details", lines: personalSelected.map(formatMemoryLine) });
  }
  if (otherSelected.length) {
    sections.push({ title: "Helpful context", lines: otherSelected.map(formatMemoryLine) });
  }

  const averageScore = selected.length
    ? Number((selected.reduce((acc, memory) => acc + (memory.score || 0), 0) / selected.length).toFixed(3))
    : 0;

  const averageConfidence = selected.length
    ? Number(
        (
          selected.reduce((acc, memory) => acc + (memory.personalConfidence ?? 0), 0) /
          selected.length
        ).toFixed(3)
      )
    : 0;

  return {
    sections,
    stats: {
      totalAvailable: memoriesToConsider.length,
      selectedCount: selected.length,
      pinnedSelected: pinnedSelected.length,
      personalSelected: personalSelected.length,
      otherSelected: otherSelected.length,
      tokensUsed,
      tokensRemaining: Math.max(tokenBudget - tokensUsed, 0),
      averageScore,
      averageConfidence,
    },
  };
};

export interface UseAIProviderProps {
  isMobile: boolean;
  setStreamBuffer: React.Dispatch<React.SetStateAction<string>>;
  setIsSubmitting: (val: boolean) => void;
  setResponseStarted: (val: boolean) => void;
  setIsStreaming: (val: boolean) => void;
  setIsThinking?: (val: boolean) => void;
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
  onError?: (error: unknown) => void;
}

export type AIProviderExecutor = ((
  systemPrompt: string,
  question: string,
  images: string[]
) => Promise<void>) & {
  cancel: () => void;
};

export const useAIProvider = ({
  isMobile,
  setStreamBuffer,
  setIsSubmitting,
  setResponseStarted,
  setIsStreaming,
  setIsThinking,
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
  onError,
}: UseAIProviderProps): AIProviderExecutor => {
    // Stable references for stream and partial content
    const currentSubRef = useRef<Subscription | null>(null);
    const lastPartialRef = useRef<{ text: string; images: string[]; usedDocs: KnowledgeSourceDoc[]; question: string }>({
      text: "",
      images: [],
      usedDocs: [],
      question: "",
    });
    const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Pull current provider and settings from stores
    const { provider } = useAIProviderStore.getState();
    const { preferences } = usePreferencesStore.getState();
    const { docs } = useKnowledgeStore.getState();

    // Feature helpers
    const { analyzeMood, moodTokenBoost } = useMoodEngine();
    const { runMemoryScan } = useMemoryEnhancer();
    const { isVectorEnabled, searchMemories, searchDocuments, getUserMemories } = useVectorStore();

    const pinnedVectorCacheRef = useRef<{ fetchedAt: number; memories: VectorMemory[] }>({
      fetchedAt: 0,
      memories: [],
    });

    const getPinnedVectorMemories = useCallback(async (): Promise<VectorMemory[]> => {
      if (!isVectorEnabled) {
        return [];
      }

      const now = Date.now();
      const cache = pinnedVectorCacheRef.current;
      if (cache.memories.length && now - cache.fetchedAt < 60_000) {
        return cache.memories;
      }

      try {
        const userMemories = (await getUserMemories(0, 200)) as VectorMemory[];
        const pinned = userMemories.filter((memory) => memory.pinned);
        pinnedVectorCacheRef.current = { fetchedAt: now, memories: pinned };
        return pinned;
      } catch (error) {
        debugLogger.warn("Pinned memory refresh failed", { error });
        return cache.memories;
      }
    }, [getUserMemories, isVectorEnabled]);

    const clearFlushTimer = () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };

    const runAIProvider = useCallback(
      async (systemPrompt: string, question: string, images: string[]) => {
        if (!provider) {
          debugLogger.error("No AI provider configured");
          overrideComponentStatus("Error");
          if (onError) onError(new Error("No AI provider configured"));
          return;
        }
      // Get user preferences from the store
      const userPreferences = preferences;

      const isLowIntent = question.trim().toLowerCase().match(/^(hi|hello|hey|yo|what'?s up|how are you)\??$/i);

      overrideComponentStatus("Loading");
      setIsSubmitting(true);
      setResponseStarted(true);
      setIsStreaming(true);
      setResponse("");
      setStreamBuffer("");
      clearFlushTimer();
      const imageList = Array.isArray(images) ? [...images] : [];
      const conversationStoreState = useConversationStore.getState();
      const { addToCurrent, replaceLastAnswer, conversations, currentId } = conversationStoreState;
      const currentConv = conversations.find((c) => c.id === currentId);
      const lastEntry = currentConv?.history.at(-1);
      const lastWasPlaceholder =
        !!lastEntry &&
        lastEntry.answer === "..." &&
        (lastEntry.placeholder === true ||
          lastEntry.rawQuestion === question ||
          lastEntry.question === question);

      // Keep the pending message in sync with the visible placeholder card
      const pendingQuestion = lastWasPlaceholder ? lastEntry?.question ?? question : question;
      const pendingImagesRaw =
        lastWasPlaceholder && Array.isArray(lastEntry?.images) && lastEntry.images.length > 0
          ? lastEntry.images
          : imageList;
      const pendingImages =
        Array.isArray(pendingImagesRaw) && pendingImagesRaw.length > 0
          ? [...pendingImagesRaw]
          : undefined;
      setPendingMessage({
        question: pendingQuestion,
        images: pendingImages,
      });

      // Get current model and config
      // The selected base model ("Engine") — falls back to the package default
      // when the user hasn't picked one. Personas (modelStore) are a separate axis.
      const modelName = useEngineStore.getState().getSelectedEngine();
      const CONFIG = modelConfigs[modelName] ?? modelConfigs["bandit-core:4b-it-qat"];

      const base64Images = imageList.map((img) => img.split(",")[1]);

      const latestEntries = history.slice(-CONFIG.historyMessages);
      const contextMessages: AIMessage[] = latestEntries.flatMap((entry) => [
        { role: "user", content: entry.question },
        { role: "assistant", content: entry.answer },
      ]);

      let tokenLimit = CONFIG.memoryTokenBudget;
      let moodText = "";

      // Only process mood if enabled in preferences and model supports it
      if (userPreferences.moodEnabled && CONFIG.moodInjection) {
        try {
          const currentMood = await analyzeMood(question);
          tokenLimit += moodTokenBoost; // moodTokenBoost is a number
          moodText = moodPromptMap[currentMood] || "";
        } catch (error) {
          debugLogger.warn("Failed to analyze mood:", { error: error instanceof Error ? error.message : String(error) });
        }
      } else if (!userPreferences.moodEnabled) {
        debugLogger.info("Mood processing skipped - disabled in preferences");
      }

      let memoryText = "";
      let usedDocs: KnowledgeSourceDoc[] = [];

      // Only process memory and knowledge documents if enabled in preferences
      if (!isLowIntent && (userPreferences.memoryEnabled || userPreferences.knowledgeDocsEnabled)) {
        try {
          let memoryContent = "";
          let docContent = "";

          // Process memory if enabled
          if (userPreferences.memoryEnabled) {
            if (isVectorEnabled) {
              debugLogger.info('Searching vector memories (advanced search enabled)', {
                memoryLimit: 18,
                scoreThreshold: 0.45,
              });

              try {
                const mergedResults = (await searchMemories(question, {
                  memoryLimit: 18,
                  scoreThreshold: 0.45,
                  // Ask backend to append pinned memories so we don't overfetch separately
                  filters: { includePinned: true },
                })) as VectorMemory[];

                const prepared = prepareAdvancedMemoryContext(
                  mergedResults,
                  tokenLimit,
                  (text) => embeddingService.estimateTokens(text)
                );

                if (prepared.sections.length > 0) {
                  const sectionText = prepared.sections
                    .map((section) => `${section.title}\n- ${section.lines.join("\n- ")}`)
                    .join("\n\n");

                  memoryContent = `Use the following long-term context when it helps personalize your response:\n\n${sectionText}\n\nReference these details only when they genuinely support the user's latest request.`;
                } else {
                  memoryContent = "";
                }

                debugLogger.memoryDebug("Vector memory selection", {
                  tokenLimit,
                  totalReturned: mergedResults.length,
                  sections: prepared.sections.map((section) => ({
                    title: section.title,
                    itemCount: section.lines.length,
                  })),
                  stats: prepared.stats,
                });
              } catch (error) {
                debugLogger.error("Vector memory search failed", { error });
                memoryContent = "";
              }
            } else {
              debugLogger.info('Searching local memories (advanced search disabled)');

              const memoryList = await embeddingService.selectRelevantMemories(question, tokenLimit);
              debugLogger.memoryDebug("Local memory selection", {
                tokenLimit,
                memoryCount: memoryList.length,
                searchMode: 'local'
              });

              memoryContent =
                memoryList.length > 0
                  ? `The user has shared the following background information:\n\n- ${memoryList.join(
                      "\n- "
                    )}\n\nUse this information to personalize your responses whenever relevant.`
                  : "";
            }
          } else {
            debugLogger.info("Memory processing skipped - disabled in preferences");
          }

          // Process knowledge documents if enabled
          if (userPreferences.knowledgeDocsEnabled) {
            if (isVectorEnabled) {
              // VECTOR MODE: Use vector database exclusively for document search
              debugLogger.info('Searching vector knowledge documents (advanced search enabled)', { 
                query: question.slice(0, 100), 
                limit: 5, 
                scoreThreshold: 0.50 
              });
              
              try {
                const vectorDocs = (await searchDocuments(question, { 
                  documentLimit: 5, 
                  scoreThreshold: 0.50 
                })) as RawVectorDocument[];
                
                debugLogger.info('Vector document search completed', { 
                  resultsCount: vectorDocs.length,
                  docNames: vectorDocs.map((doc) => doc.filename || doc.name || 'Unknown')
                });

                // Convert vector search results to expected format
                const candidateDocs: KnowledgeSourceDoc[] = vectorDocs.map((result, index) => {
                  const docId =
                    result?.id ||
                    result?.documentId ||
                    result?.fileId ||
                    result?._id ||
                    result?.metadata?.id ||
                    result?.metadata?._id ||
                    result?.metadata?.fileId;
                  const fallbackId = result?.key || result?.filename || result?.name;
                  const resolvedId = docId || (fallbackId ? String(fallbackId) : `vector-doc-${index}`);

                  if (!docId && !fallbackId) {
                    debugLogger.warn("Vector document result missing identifier", {
                      availableKeys: result ? Object.keys(result) : [],
                      sample: (result?.filename || result?.name || "unknown").toString(),
                    });
                  }

                  return {
                    id: resolvedId,
                    name: result.filename || result.name || 'Unknown Document',
                    content: result.content || 'No content available',
                    mimeType: result.mimeType || result.type,
                    addedDate: result.uploadedAt ? new Date(result.uploadedAt) : undefined,
                    size: result.size,
                    uploadedBy: result.uploadedBy,
                    userEmail: result.userEmail,
                    bucket: result.bucket,
                    key: result.key || resolvedId,
                    s3Url: resolvedId,
                    isUserContent: result.isUserContent,
                    isTeamContent: result.isTeamContent,
                    contentSource: result.contentSource,
                    originalFileName: result.originalFileName || result.filename || result.name,
                    // Preserve original data for downstream checks (e.g. vector modal detection)
                    _vectorResult: result
                  };
                });

                // Debug log the actual content received from vector DB
                debugLogger.ragDebug("Vector DB content received", {
                  docsCount: candidateDocs.length,
                  docs: candidateDocs.map(doc => ({
                    name: doc.name,
                    hasContent: !!doc.content,
                    contentLength: doc.content?.length || 0,
                    contentPreview: doc.content?.substring(0, 100) + "..." || "NO CONTENT"
                  }))
                });

                let approvedIndexes: number[] = [];
                if (!isLowIntent && candidateDocs.length > 0) {
                  debugLogger.ragDebug("Starting LLM vetting process for vector docs", {
                    candidateCount: candidateDocs.length,
                    candidateNames: candidateDocs.map(d => d.name),
                    question: question.substring(0, 150) + "..."
                  });
                  
                  // Transform docs to expected format for relevance determination
                  const docsForRelevance = candidateDocs.map(doc => ({
                    name: doc.name,
                    chunks: [doc.content] // Convert single content to chunks array
                  }));
                  approvedIndexes = await determineRelevantDocuments(question, docsForRelevance);
                  
                  debugLogger.ragDebug("LLM vetting completed for vector docs", {
                    approvedCount: approvedIndexes.length,
                    approvedNames: approvedIndexes.map(i => candidateDocs[i]?.name).filter(Boolean),
                    rejectedNames: candidateDocs.filter((_, i) => !approvedIndexes.includes(i)).map(d => d.name)
                  });
                } else if (isLowIntent) {
                  debugLogger.info("Skipping knowledge/doc scan for low-intent input");
                } else {
                  debugLogger.info("No candidate vector docs available for vetting");
                }
                
                usedDocs = approvedIndexes
                  .map((i) => candidateDocs[i])
                  .filter((doc): doc is KnowledgeSourceDoc => Boolean(doc));

                debugLogger.ragDebug("Final vector document usage", {
                  usedDocsCount: usedDocs.length,
                  docNames: usedDocs.map(d => d.name),
                  searchMode: 'vector'
                });

              } catch (error) {
                debugLogger.error("Vector document search failed", { error });
                // NO FALLBACK - fail cleanly in vector mode
                usedDocs = [];
              }
            } else {
              // LOCAL MODE: Use local IndexedDB documents exclusively  
              debugLogger.info('Searching local knowledge documents (advanced search disabled)', { 
                totalDocs: docs.length
              });

              const queryEmbedding = await embeddingService.generate(question);
              const validDocs = docs.filter(doc => doc.embedding && doc.embedding.length > 0);
              
              debugLogger.ragDebug("Local document search initialization", {
                totalDocs: docs.length,
                validDocsCount: validDocs.length,
                question: question.substring(0, 100) + "...",
                docNames: docs.map(d => d.name),
                validDocNames: validDocs.map(d => d.name),
                searchMode: 'local'
              });

              if (docs.length === 0) {
                debugLogger.warn("No documents available in local knowledge store");
              } else if (validDocs.length === 0) {
                debugLogger.warn("No documents have embeddings - they may need to be reprocessed", {
                  docsWithoutEmbeddings: docs.filter(d => !d.embedding || d.embedding.length === 0).map(d => d.name)
                });
              }

              const scoredDocs = validDocs
                .map((doc) => {
                  const score = doc.embedding ? embeddingService.cosineSimilarity(queryEmbedding, doc.embedding) : 0;
                  
                  // Log detailed scoring info for each document
                  debugLogger.ragDebug("Local document scoring details", { 
                    docName: doc.name, 
                    hasEmbedding: !!doc.embedding,
                    score: score.toFixed(4),
                    hasContent: !!doc.content,
                    contentLength: doc.content?.length || 0,
                    strategy: 'low-threshold-llm-vetting'
                  });
                  
                  return { doc, score };
                });

              const candidateDocs: KnowledgeSourceDoc[] = scoredDocs
                .filter(entry => entry.score >= 0.50) // Lower threshold, let LLM decide relevance
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map(entry => entry.doc);

              if (candidateDocs.length === 0) {
                debugLogger.warn("No documents passed cosine threshold - skipping vetting", {
                  allScores: scoredDocs.map(d => ({ name: d.doc.name, score: d.score.toFixed(3) })),
                  threshold: "0.50"
                });
              }

              let approvedIndexes: number[] = [];
              if (!isLowIntent && candidateDocs.length > 0) {
                debugLogger.ragDebug("Starting LLM vetting process for local docs", {
                  candidateCount: candidateDocs.length,
                  candidateNames: candidateDocs.map(d => d.name),
                  question: question.substring(0, 150) + "..."
                });
                
                // Transform docs to expected format for relevance determination
                const docsForRelevance = candidateDocs.map(doc => ({
                  name: doc.name,
                  chunks: [doc.content] // Convert single content to chunks array
                }));
                approvedIndexes = await determineRelevantDocuments(question, docsForRelevance);
                
                debugLogger.ragDebug("LLM vetting completed for local docs", {
                  approvedCount: approvedIndexes.length,
                  approvedNames: approvedIndexes.map(i => candidateDocs[i]?.name).filter(Boolean),
                  rejectedNames: candidateDocs.filter((_, i) => !approvedIndexes.includes(i)).map(d => d.name)
                });
              } else if (isLowIntent) {
                debugLogger.info("Skipping knowledge/doc scan for low-intent input");
              } else {
                debugLogger.info("No candidate local docs available for vetting");
              }
              
              usedDocs = approvedIndexes
                .map((i) => candidateDocs[i])
                .filter((doc): doc is KnowledgeSourceDoc => Boolean(doc));

              debugLogger.ragDebug("Final local document selection (trusting LLM vetting)", {
                selectedDocsCount: usedDocs.length,
                finalSelectedDocs: usedDocs.map(d => d.name),
                searchMode: 'local'
              });
            }

            // Generate document content for the prompt
            docContent =
              usedDocs.length > 0
                ? `IMPORTANT CONTEXT - The user has uploaded the following documents that directly relate to their question. You MUST use this information to provide a comprehensive answer. Do NOT say you cannot help or that you need more information when relevant content is provided below.\n\n${usedDocs
                    .map((doc) => {
                      const content = doc.chunks ? doc.chunks.join("\n\n") : doc.content || 'No content available';
                      debugLogger.ragDebug("Document content usage", {
                        docName: doc.name,
                        usingChunks: !!doc.chunks,
                        contentLength: content.length,
                        preview: content.substring(0, 100) + "...",
                        searchMode: isVectorEnabled ? 'vector' : 'local',
                        actualContent: content // Log full content for debugging
                      });
                      return `📄 **${doc.name}**\n${content}`;
                    })
                    .join("\n\n")}\n\nUSE THE ABOVE CONTENT to answer the user's question. Reference specific information from these documents.`
                : "";

            debugLogger.ragDebug("Final document usage", {
              usedDocsCount: usedDocs.length,
              docNames: usedDocs.map(d => d.name),
              docContentLength: docContent.length,
              searchMode: isVectorEnabled ? 'vector' : 'local',
              docContent: docContent.substring(0, 500) + "...", // Log more content
              hasDocContent: docContent.length > 0,
              actualDocContents: usedDocs.map(d => ({
                name: d.name,
                contentLength: d.content?.length || 0,
                contentPreview: d.content?.substring(0, 200) || "EMPTY"
              }))
            });
          } else {
            debugLogger.info("Knowledge document processing skipped - disabled in preferences");
          }

          // Combine memory and document content
          memoryText = `${memoryContent ? memoryContent : ""}${docContent ? "\n\n" + docContent : ""}`;

        } catch (error) {
          debugLogger.warn("Failed to process knowledge documents:", { error: error instanceof Error ? error.message : String(error) });
        }
      } else if (!userPreferences.memoryEnabled && !userPreferences.knowledgeDocsEnabled) {
        debugLogger.info("Memory and knowledge document processing skipped - both disabled in preferences");
      }

  // Build the complete system prompt with current date/time context
      const dateTimeContext = getCurrentDateTimeContext();
  let enhancedSystemPrompt = `${systemPrompt}${moodText}${memoryText}${dateTimeContext}`;

  // RAG-first guidance so the model confidently uses provided context
  const ragGuidance = `\n\n🎯 CONTEXT USAGE DIRECTIVE:\n- The documents and background information above contain VERIFIED, RELEVANT content for this request\n- Answer confidently using this provided context - do NOT apologize or claim insufficient information\n- When documents are provided, they contain the information needed to answer the question\n- Quote specific details from the documents and cite them as [Doc: NAME]\n- Combine the provided context with your knowledge to give comprehensive answers\n- Only use tools for live data (news, weather, sports scores) when specifically requested\n- Trust and utilize the provided context without hesitation`;
  enhancedSystemPrompt += ragGuidance;

  // Captured BEFORE the tool list/protocol is appended below. The post-tool
  // summarization pass re-prompts the model with this tool-free prompt so it
  // writes a natural answer instead of being tempted to call tools again.
  const systemPromptForSummary = enhancedSystemPrompt;

      // Add MCP tools information to system prompt if available
      const mcpToolsAvailable = isMCPAvailable();
      if (mcpToolsAvailable) {
        const enabledTools = getEnabledMCPToolsForAI();
        if (enabledTools.length > 0) {
          const toolList = enabledTools
            .map((tool) => {
              const parameterProps = tool.function?.parameters?.properties ?? {};
              const params = Object.keys(parameterProps);
              const paramSuffix = params.length ? ` (parameters: ${params.join(", ")})` : "";
              return `- ${tool.function.name}: ${tool.function.description}${paramSuffix}`;
            })
            .join("\n");
  const protocol = `\n\nTOOL USAGE PROTOCOL (conservative approach)\n- PRIORITIZE your built-in knowledge and the provided context ABOVE to answer questions first.\n- Use your training data and general knowledge confidently for common topics, concepts, and questions.\n- Only call tools for SPECIFIC, CURRENT information that requires real-time data or a source you don't already have:\n  * web_search() - when asked about recent/current events, breaking news, live information (weather, prices, sports scores), or when you need to look up documentation, libraries, APIs, error messages, or verify a specific fact\n  * web_fetch() - to read the FULL contents of a specific URL you already have. Reach for this when the user wants to "tell me more", "go deeper", "read/open that article", or asks for details about a specific source, link, or article from an EARLIER answer: take that item's URL from the previous Sources list in this conversation and fetch it, then answer from the page's actual content (not just the prior summary)\n  * image_generation() - ONLY when explicitly asked to create or generate an image\n  * create_file({"content": "...", "filename": "report.docx", "format": "docx"}) - when the user asks for a downloadable FILE (a document, spreadsheet, slides, markdown, code, etc.) or to "export"/"download"/"save" something. Formats: md, txt, csv, json, html, xml, yaml, docx, pptx. For docx/pptx write well-structured Markdown (use "## " headings to start each slide for pptx). It returns a temporary download link — ALWAYS tell the user the file expires (~1 hour). If it is unclear whether they want it shown inline vs. as a downloadable file, use ask_user first.\n  * ask_user({"questions": [{"question": "...", "header": "Format", "options": [{"label": "Inline (Recommended)"}, {"label": "Download a file"}]}]}) - when you are genuinely BLOCKED on a decision that is the USER's to make and cannot resolve from the request, context, or sensible defaults (e.g. show content inline vs. let them download it, which format/option they want). Renders clickable options the user answers in one step — better than asking in prose and ending your turn. Give 1-4 questions, each with 2-4 options; if one is clearly best, list it first and append " (Recommended)". The user may also type their own answer; act on it directly.\n- For general questions about concepts, definitions, explanations, or how-to topics, use your built-in knowledge WITHOUT calling tools.\n- Examples of what NOT to use tools for: "who are you?", "what is React?", "explain machine learning", "how does X work?", general programming questions.\n- When a tool is truly needed, call exactly ONE tool that best matches the request.\n- Begin tool usage with a fenced code block: \`\`\`tool_code\nfunctionName({"param": "value"})\n\`\`\`\n- If you cannot answer with your knowledge and context, and no suitable tool exists, ask a clarifying question.\n\nExamples of appropriate tool usage:\n\n\`\`\`tool_code\nweb_search({"query": "latest AI developments 2026", "count": 5})\n\`\`\`\n\n\`\`\`tool_code\nweb_fetch({"url": "https://example.com/changelog"})\n\`\`\`\n`;
          enhancedSystemPrompt += `\n\nYou have access to the following tools that can help you provide better responses. Use them when appropriate:\n\n${toolList}\n${protocol}`;
          
          debugLogger.info("MCP tools added to system prompt", { 
            toolCount: enabledTools.length,
            toolNames: enabledTools.map(t => t.function.name)
          });
        }
      }

      // Prepare messages for AI provider
      const messages: AIMessage[] = [
        { role: "system", content: enhancedSystemPrompt },
        ...contextMessages,
        { role: "user", content: question }
      ];

      // Prepare request
      const request: ToolAwareChatRequest = {
        model: modelName,
        messages,
        stream: true,
        images: base64Images.length > 0 ? base64Images : undefined,
        options: { num_predict: tokenLimit + 250 }
      };

      // Attach native tools so native-tool models (e.g. the Kimi cloud engines)
      // can call them. Native tool_calls are bridged into the ```tool_code```
      // execution path in the completion handler below, so there's ONE tool
      // path; text-only models keep using the system-prompt text protocol.
      // (Text-based tool prompting is being phased out in favor of native.)
      if (mcpToolsAvailable) {
        const enabledTools = getEnabledMCPToolsForAI();
        if (enabledTools.length > 0) {
          request.tools = enabledTools;
          debugLogger.info("MCP tools added to AI request", { toolCount: enabledTools.length });
        }
      }

      let fullMessage = "";
      let latestDisplayMessage = "";
      let sawToolBlock = false;
      // Native tool_calls (from native-tool models) — bridged to tool_code below.
      const nativeToolCalls: unknown[] = [];

      // Strip <think>...</think> blocks from text before displaying.
      // Hides in-progress thinking (unclosed tag) and removes completed blocks.
      const stripThinking = (text: string): string => {
        // Remove completed think blocks
        let result = text.replace(/<think>[\s\S]*?<\/think>/g, '');
        // If an unclosed think block remains, hide everything from it onwards
        const openIdx = result.indexOf('<think>');
        if (openIdx !== -1) result = result.slice(0, openIdx);
        return result.trimStart();
      };

      // Strip fenced tool_code blocks — used when echoing the assistant's
      // first turn back into the summarization pass so the transcript reads
      // naturally (assistant said "let me look that up", then results arrive).
      const stripToolBlocks = (text: string): string =>
        text.replace(/```(?:tool_code|TOOL_CODE)\s*\n[\s\S]*?\n```/gi, "").trim();

      const flushNow = () => {
        clearFlushTimer();
        if (!sawToolBlock) {
          lastPartialRef.current.text = latestDisplayMessage;
          setStreamBuffer(latestDisplayMessage);
        }
      };

      const scheduleFlush = (delay = 150) => {
        if (flushTimerRef.current || sawToolBlock) return;
        flushTimerRef.current = setTimeout(() => {
          flushTimerRef.current = null;
          lastPartialRef.current.text = latestDisplayMessage;
          setStreamBuffer(latestDisplayMessage);
        }, delay);
      };

      // Telemetry (opt-in; every call is a no-op when disabled): one OTLP
      // trace per turn — agent.turn → llm.generate + tool.* spans.
      syncTelemetry();
      telemetryStartTurn(question, modelName);
      telemetryEvent("tool_loop:llm_start");

      const stream = provider.chat(request);
      const initialPlaceholderQuestion = lastEntry?.question;

  // Initialize last-partial tracking for graceful cancel
  lastPartialRef.current = { text: "", images: [...imageList], usedDocs, question };

      // If a previous stream is still active, cancel it first
      if (currentSubRef.current) {
        try { currentSubRef.current.unsubscribe(); } catch {}
        currentSubRef.current = null;
      }

      const sub = stream.subscribe({
        next: (data) => {
          if (!data?.message?.content && !data?.message?.tool_calls) return;
          if (Array.isArray(data.message.tool_calls) && data.message.tool_calls.length > 0) {
            nativeToolCalls.push(...(data.message.tool_calls as unknown[]));
            sawToolBlock = true;
            clearFlushTimer();
          }
          if (data.message.content) {
            fullMessage += data.message.content;
            telemetryEvent("tool_loop:llm_chunk", { chunk: data.message.content });
          }
          // Track whether we're currently inside a <think> block
          const inThinkBlock = /<think>/.test(fullMessage) && !/<think>[\s\S]*<\/think>/.test(fullMessage);
          setIsThinking?.(inThinkBlock);
          // Detect tool call block in visible (non-thinking) content only
          const visibleMessage = stripThinking(fullMessage);
          if (/```(?:tool_code|TOOL_CODE)/.test(visibleMessage)) {
            sawToolBlock = true;
            clearFlushTimer();
          }
          latestDisplayMessage = visibleMessage;
          if (!sawToolBlock) {
            scheduleFlush();
          }
        },
        error: (err: Error) => {
          debugLogger.error("Stream error:", err);
          overrideComponentStatus("Idle");
          setIsSubmitting(false);
          setIsStreaming(false);

          // Finalize with the partial content on error/abort
          flushNow();
          let partial = lastPartialRef.current.text || latestDisplayMessage || fullMessage;
          if (partial && !partial.trim().endsWith("…") && !partial.trim().endsWith("...")) {
            partial = partial.trimEnd() + " …"; // append ellipsis to indicate truncation
          }
          if (partial) {
            const { replaceLastAnswer } = useConversationStore.getState();
            replaceLastAnswer(partial, lastPartialRef.current.images, false, lastPartialRef.current.usedDocs, true);
            setResponse(partial);
          }
          setStreamBuffer("");
          setIsThinking?.(false);
          setPendingMessage(null);
          setLogoVisible(false);
          telemetryEndTurn({ error: err?.message || "stream error" });

          // Call the error handler if provided
          if (onError) {
            onError(err);
          }
        },
        complete: async () => {
          try {
            setIsThinking?.(false);
            telemetryEvent("tool_loop:llm_response", { responseLength: fullMessage.length });
            latestDisplayMessage = stripThinking(fullMessage);
            if (!sawToolBlock) {
              flushNow();
            }

            // Bridge native tool_calls (emitted by native-tool models like the
            // Kimi engines) into the ```tool_code``` protocol the loop below
            // executes, so there's ONE execution path. Only synthesize when the
            // model didn't already produce tool_code text.
            if (nativeToolCalls.length > 0 && !/```(?:tool_code|TOOL_CODE)/.test(fullMessage)) {
              for (const raw of nativeToolCalls) {
                const tc = raw as {
                  function?: { name?: string; arguments?: unknown };
                  name?: string;
                  arguments?: unknown;
                };
                const fn = tc.function?.name ?? tc.name;
                if (!fn) continue;
                const rawArgs = tc.function?.arguments ?? tc.arguments ?? {};
                const argStr = typeof rawArgs === "string" ? rawArgs : JSON.stringify(rawArgs ?? {});
                fullMessage += `\n\n\`\`\`tool_code\n${fn}(${argStr})\n\`\`\``;
              }
            }

            // Check for tool calls in the response and execute them
            const toolCallMatches = fullMessage.match(/```(?:tool_code|TOOL_CODE)\s*\n([^`]+)\n```/gi);
            let enhancedMessage = fullMessage;
            // Informational tool outputs get fed back to the model for a
            // natural-language summary; image outputs are surfaced as-is.
            const summarizableResults: Array<{ name: string; output: string }> = [];
            const inlineImageBlocks: string[] = [];
            const collectedSources: Array<{ title: string; url: string }> = [];

            if (toolCallMatches && toolCallMatches.length > 0 && mcpToolsAvailable) {
              debugLogger.info("Detected tool calls in AI response", {
                toolCallCount: toolCallMatches.length,
                toolCalls: toolCallMatches,
              });

              for (const match of toolCallMatches) {
                const toolCallCode = match.replace(/```(?:tool_code|TOOL_CODE)\s*\n|\n```/gi, "").trim();
                const functionCallMatch = toolCallCode.match(/^(\w+)\(\s*(.*?)\s*\)$/);
                if (!functionCallMatch) continue;
                const [, functionName, params] = functionCallMatch;

                try {
                  // Parse parameters if any
                  let parsedParams: MCPToolParameters = {};
                  const raw = params.trim();
                  if (raw.length > 0) {
                    if (raw.startsWith("{")) {
                      parsedParams = JSON.parse(raw);
                    } else {
                      try {
                        parsedParams = JSON.parse(`{${raw}}`);
                      } catch (innerErr) {
                        debugLogger.warn("Failed to parse tool parameters, defaulting to empty object", {
                          raw,
                          error: innerErr instanceof Error ? innerErr.message : String(innerErr),
                        });
                        parsedParams = {};
                      }
                    }
                  }

                  debugLogger.info("Executing MCP tool from AI response", {
                    functionName,
                    parameters: parsedParams,
                  });

                  // ask_user is handled CLIENT-SIDE: render an interactive card and
                  // await the user's choice instead of calling a backend tool. The
                  // answer is fed back through the same summary pass.
                  if (functionName === "ask_user" || functionName === "ask-user") {
                    enhancedMessage = enhancedMessage.replace(match, "");
                    clearFlushTimer();
                    const askPreamble = stripToolBlocks(fullMessage).trim();
                    setStreamBuffer(askPreamble || "_Waiting for your answer…_");
                    const questions = parseAskUserQuestions(
                      (parsedParams as Record<string, unknown>).questions ?? parsedParams,
                    );
                    if (questions.length === 0) {
                      summarizableResults.push({
                        name: functionName,
                        output:
                          "ask_user failed: `questions` must be a JSON array of {question, options} objects. Ask the user in plain text instead.",
                      });
                      continue;
                    }
                    telemetryEvent("tool_loop:ask_user", { count: questions.length });
                    const answers = await useAskUserStore.getState().ask(questions);
                    const answerText = answers
                      ? "The user answered:\n\n" +
                        questions
                          .map((q) => `Q: ${q.question}\nA: ${(answers[q.id] || "").trim() || "(no answer)"}`)
                          .join("\n\n")
                      : "The user dismissed the question(s) without answering. Proceed with your best judgment; do not immediately re-ask.";
                    summarizableResults.push({ name: functionName, output: answerText });
                    continue;
                  }

                  // Insert a neutral loading placeholder while executing
                  const placeholderToken = `<<TOOL_LOADING_${functionName}_${Math.random()
                    .toString(36)
                    .slice(2)}>>`;
                  // Replace the fenced block with an invisible placeholder token. Do not update UI yet.
                  enhancedMessage = enhancedMessage.replace(match, placeholderToken);

                  // Surface a clear "working" status while the tool runs, so the
                  // bubble never looks frozen during the fetch + summary.
                  clearFlushTimer();
                  const toolStatus =
                    functionName === "web_search" || functionName === "web-search"
                      ? "Searching the web…"
                      : functionName === "web_fetch" || functionName === "web-fetch"
                        ? "Reading the page…"
                        : functionName === "image_generation" || functionName === "image-generation"
                          ? "Generating the image…"
                          : "Working on it…";
                  const toolPreamble = stripToolBlocks(fullMessage).trim();
                  setStreamBuffer(toolPreamble ? `${toolPreamble}\n\n_${toolStatus}_` : `_${toolStatus}_`);

                  // Execute the tool
                  telemetryEvent("tool_loop:tool_execute", { name: functionName, params: parsedParams });
                  const result = await executeMCPTool({
                    toolName: functionName,
                    parameters: parsedParams,
                  });
                  telemetryEvent(result.success ? "tool_loop:tool_result" : "tool_loop:tool_error", {
                    name: functionName,
                    isError: !result.success,
                  });

                  // Summarize result (no raw JSON, no tool names)
                  let resultText = "";
                  if (result.success) {
                    if (functionName === "web_search" || functionName === "web-search") {
                      const search = (result.data ?? {}) as WebSearchResponse;
                      const items = Array.isArray(search.results) ? search.results : [];
                      const blocks: string[] = [];
                      if (typeof search.answer === "string" && search.answer.trim().length > 0) {
                        blocks.push(search.answer.trim());
                      }
                      if (items.length > 0) {
                        blocks.push(
                          items
                            .slice(0, 6)
                            .map((item, index) => {
                              const title = item.title?.trim() || "Untitled";
                              const url = item.url?.trim() || "";
                              const snippet = item.content?.trim();
                              if (url) collectedSources.push({ title, url });
                              let line = url ? `${index + 1}. [${title}](${url})` : `${index + 1}. ${title}`;
                              if (snippet) {
                                const truncated =
                                  snippet.length > 300 ? `${snippet.slice(0, 300)}…` : snippet;
                                line += ` — ${truncated}`;
                              }
                              return line;
                            })
                            .join("\n")
                        );
                      }
                      resultText = blocks.length
                        ? blocks.join("\n\n")
                        : `No results found${search.query ? ` for "${search.query}"` : ""}.`;
                    } else if (functionName === "web_fetch" || functionName === "web-fetch") {
                      const fetched = (result.data ?? {}) as WebFetchResult;
                      if (fetched.blocked || (fetched.error && !fetched.content)) {
                        resultText = fetched.error || "Unable to fetch that URL.";
                      } else {
                        const body = (fetched.content ?? "").trim();
                        const preview = body.length > 2000 ? `${body.slice(0, 2000)}…` : body;
                        const source = fetched.url ? `**Source:** ${fetched.url}\n\n` : "";
                        resultText = preview ? `${source}${preview}` : `${source}No readable content found.`;
                      }
                    } else if (
                      functionName === "image_generation" ||
                      functionName === "image-generation"
                    ) {
                      const imageData = (result.data ?? {}) as ImageGenerationResult;
                      const { imageUrl, revisedPrompt } = imageData;
                      resultText = imageUrl
                        ? `Here you go!\n\n![Generated image](${imageUrl})\n\n${
                            revisedPrompt ? `Prompt refinement: “${revisedPrompt}”\n` : ""
                          }Note: the image link may expire in ~2 hours.`
                        : "Image generated successfully.";
                    } else if (functionName === "create_file" || functionName === "create-file") {
                      const fileData = (result.data ?? {}) as {
                        url?: string;
                        filename?: string;
                        expiresInMinutes?: number;
                      };
                      if (fileData.url) {
                        const mins = fileData.expiresInMinutes ?? 60;
                        const name = fileData.filename || "your file";
                        resultText = `📄 **[${name}](${fileData.url})** — ready to download.\n\n_This link is temporary and expires in about ${mins} minutes._`;
                      } else {
                        resultText = "The file was created.";
                      }
                    } else if (typeof result.data === "string") {
                      resultText = result.data;
                    } else if (result.data) {
                      resultText = JSON.stringify(result.data, null, 2).slice(0, 1000);
                    } else {
                      resultText = "Here are the latest results.";
                    }
                  } else {
                    const data = (result.data ?? {}) as Record<string, unknown>;
                    const informative = [data.message, data.details, data.error, result.error]
                      .map((value) => (typeof value === "string" ? value.trim() : undefined))
                      .filter((value): value is string => Boolean(value) && value.toLowerCase() !== "n/a");
                    resultText = informative.length
                      ? informative.join(" — ")
                      : `I couldn't complete that request: ${result.error || "Unknown error"}.`;
                  }

                  enhancedMessage = enhancedMessage.replace(placeholderToken, resultText);

                  if (result.success) {
                    if (
                      functionName === "image_generation" ||
                      functionName === "image-generation" ||
                      functionName === "create_file" ||
                      functionName === "create-file"
                    ) {
                      // Surface images + download links VERBATIM so the summary
                      // pass can't paraphrase or drop the URL.
                      inlineImageBlocks.push(resultText);
                    } else if (functionName !== "check_gateway_health") {
                      summarizableResults.push({ name: functionName, output: resultText });
                    }
                  }

                  debugLogger.info("Tool execution completed", {
                    functionName,
                    success: result.success,
                    resultPreview:
                      JSON.stringify(result).substring(0, 100) + "...",
                  });
                } catch (error) {
                  debugLogger.error("Failed to execute tool call", {
                    functionName,
                    error:
                      error instanceof Error ? error.message : String(error),
                  });

                  const friendly = error instanceof Error ? error.message : String(error);
                  const errorText = `I ran into an issue completing that step: ${friendly}.`;
                  if (enhancedMessage.includes("<<TOOL_LOADING_")) {
                    enhancedMessage = enhancedMessage.replace(
                      /<<TOOL_LOADING_[^>]+>>/,
                      errorText
                    );
                  } else {
                    enhancedMessage = enhancedMessage.replace(match, errorText);
                  }
                }
              }

              // ── Summarization pass ────────────────────────────────────
              // Instead of dumping raw tool output into the chat, feed the
              // results back to the model and stream its natural-language
              // answer. No tools are offered on this pass (and the prompt
              // forbids tool_code) to prevent a tool-call loop.
              if (summarizableResults.length > 0) {
                try {
                  const toolResultsText = summarizableResults
                    .map((r) => `## ${r.name}\n${r.output}`)
                    .join("\n\n");

                  // Tool-ENABLED continuation loop. Feed the tool results back WITH
                  // tools still available so the model can chain another action
                  // (e.g. create_file right after an ask_user answer) before its
                  // final answer. Bounded to avoid a runaway tool loop. The common
                  // case — one tool, then a text answer — exits after one round.
                  const MAX_CHAIN_ROUNDS = 4;
                  const enabledToolsForChain = getEnabledMCPToolsForAI();
                  const convo: AIMessage[] = [
                    { role: "system", content: enhancedSystemPrompt },
                    ...contextMessages,
                    { role: "user", content: question },
                    { role: "assistant", content: stripToolBlocks(fullMessage) || "Let me work on that." },
                    {
                      role: "user",
                      content: `Here are the results of the tool(s) so far:\n\n${toolResultsText}\n\nUse them to fully complete my original request. If you still need to take an action I asked for (for example, actually create a file I want to download), call the appropriate tool now with a \`\`\`tool_code\`\`\` block. Otherwise give your final answer. Do NOT add a "Sources"/"References"/"Citations" list — one is appended automatically.`,
                    },
                  ];

                  // Stream one model turn → its text + any native tool_calls.
                  const streamTurn = (req: ToolAwareChatRequest) =>
                    new Promise<{ text: string; native: unknown[] }>((resolve) => {
                      let acc = "";
                      const native: unknown[] = [];
                      let settled = false;
                      let timer: ReturnType<typeof setTimeout> | undefined;
                      const finish = (value: { text: string; native: unknown[] }) => {
                        if (settled) return;
                        settled = true;
                        if (timer) clearTimeout(timer);
                        resolve(value);
                      };
                      const sub = provider.chat(req).subscribe({
                        next: (data) => {
                          if (Array.isArray(data?.message?.tool_calls) && data.message.tool_calls.length) {
                            native.push(...(data.message.tool_calls as unknown[]));
                          }
                          if (data?.message?.content) {
                            acc += data.message.content;
                            const visible = stripThinking(acc);
                            latestDisplayMessage = visible;
                            lastPartialRef.current.text = visible;
                            if (visible) setIsThinking?.(false);
                            setStreamBuffer(visible);
                          }
                        },
                        error: () => finish({ text: stripThinking(acc).trim(), native }),
                        complete: () => finish({ text: stripThinking(acc).trim(), native }),
                      });
                      currentSubRef.current = sub;
                      timer = setTimeout(() => {
                        try { sub.unsubscribe(); } catch { /* noop */ }
                        finish({ text: stripThinking(acc).trim(), native });
                      }, 30000);
                    });

                  // Execute one chained tool call and return a short result for the
                  // model. Download links / images are pushed to inlineImageBlocks so
                  // they survive verbatim into the final message.
                  const runChainedTool = async (fn: string, params: MCPToolParameters): Promise<string> => {
                    if (fn === "ask_user" || fn === "ask-user") {
                      const qs = parseAskUserQuestions((params as Record<string, unknown>).questions ?? params);
                      if (!qs.length) return "ask_user failed: it needs a questions array.";
                      const ans = await useAskUserStore.getState().ask(qs);
                      return ans
                        ? "The user answered:\n\n" +
                            qs.map((q) => `Q: ${q.question}\nA: ${(ans[q.id] || "").trim() || "(no answer)"}`).join("\n\n")
                        : "The user dismissed the question(s). Proceed with your best judgment.";
                    }
                    const status =
                      fn === "create_file" || fn === "create-file" ? "Creating the file…"
                      : fn === "web_search" || fn === "web-search" ? "Searching the web…"
                      : fn === "web_fetch" || fn === "web-fetch" ? "Reading the page…"
                      : fn === "image_generation" || fn === "image-generation" ? "Generating the image…"
                      : "Working on it…";
                    setStreamBuffer(`_${status}_`);
                    const result = await executeMCPTool({ toolName: fn, parameters: params });
                    if (!result.success) return `That step failed: ${result.error || "unknown error"}.`;
                    if (fn === "create_file" || fn === "create-file") {
                      const f = (result.data ?? {}) as { url?: string; filename?: string; expiresInMinutes?: number };
                      if (f.url) {
                        const mins = f.expiresInMinutes ?? 60;
                        const name = f.filename || "your file";
                        inlineImageBlocks.push(`📄 **[${name}](${f.url})** — ready to download.\n\n_This link is temporary and expires in about ${mins} minutes._`);
                        return `File created and its download link is now shown to the user. Briefly confirm it's ready and that it expires in ~${mins} minutes.`;
                      }
                      return "The file was created.";
                    }
                    if (fn === "image_generation" || fn === "image-generation") {
                      const img = (result.data ?? {}) as { imageUrl?: string };
                      if (img.imageUrl) {
                        inlineImageBlocks.push(`![Generated image](${img.imageUrl})`);
                        return "Image generated and shown to the user.";
                      }
                    }
                    if (typeof result.data === "string") return result.data.slice(0, 2000);
                    if (result.data) return JSON.stringify(result.data).slice(0, 1500);
                    return "Done.";
                  };

                  clearFlushTimer();
                  let finalText = "";
                  let lastTurnText = "";
                  for (let round = 0; round < MAX_CHAIN_ROUNDS; round++) {
                    setStreamBuffer("");
                    setIsThinking?.(true);
                    const turnRequest: ToolAwareChatRequest = {
                      model: modelName,
                      messages: convo,
                      stream: true,
                      tools: enabledToolsForChain.length ? enabledToolsForChain : undefined,
                      options: { num_predict: tokenLimit + 250 },
                    };
                    const { text: turnText, native: turnNative } = await streamTurn(turnRequest);
                    setIsThinking?.(false);
                    if (turnText.trim()) lastTurnText = turnText;

                    // Did the model ask for another tool (text tool_code or native)?
                    let toolText = turnText;
                    if (turnNative.length && !/```(?:tool_code|TOOL_CODE)/.test(toolText)) {
                      for (const raw of turnNative) {
                        const tc = raw as { function?: { name?: string; arguments?: unknown }; name?: string; arguments?: unknown };
                        const fnName = tc.function?.name ?? tc.name;
                        if (!fnName) continue;
                        const a = tc.function?.arguments ?? tc.arguments ?? {};
                        toolText += `\n\n\`\`\`tool_code\n${fnName}(${typeof a === "string" ? a : JSON.stringify(a ?? {})})\n\`\`\``;
                      }
                    }
                    const chainMatches = toolText.match(/```(?:tool_code|TOOL_CODE)\s*\n([^`]+)\n```/gi);
                    if (!chainMatches || !chainMatches.length) {
                      finalText = turnText;
                      break;
                    }

                    const roundOut: string[] = [];
                    for (const m of chainMatches) {
                      const code = m.replace(/```(?:tool_code|TOOL_CODE)\s*\n|\n```/gi, "").trim();
                      const fm = code.match(/^(\w+)\(\s*(.*?)\s*\)$/);
                      if (!fm) continue;
                      const [, fnName, rawParams] = fm;
                      let parsed: MCPToolParameters = {};
                      const rp = rawParams.trim();
                      if (rp) {
                        try { parsed = JSON.parse(rp.startsWith("{") ? rp : `{${rp}}`); } catch { parsed = {}; }
                      }
                      try {
                        roundOut.push(`## ${fnName}\n${await runChainedTool(fnName, parsed)}`);
                      } catch (e) {
                        roundOut.push(`## ${fnName}\nThat step failed: ${e instanceof Error ? e.message : String(e)}`);
                      }
                    }
                    convo.push({ role: "assistant", content: stripToolBlocks(turnText) || "(using a tool)" });
                    convo.push({
                      role: "user",
                      content: `Tool results:\n\n${roundOut.join("\n\n")}\n\nNow give your final answer to my original request, or call another tool if you still genuinely need to. Do NOT add a "Sources" list.`,
                    });
                  }
                  setIsThinking?.(false);

                  const answerText = finalText.trim() ? finalText : lastTurnText;
                  if (answerText.trim() || inlineImageBlocks.length) {
                    // Belt-and-suspenders: strip any model-authored trailing
                    // Sources/References list — we append a single clickable one.
                    const cleanedSummary = answerText
                      .replace(
                        /\n{1,}\s*(?:[*_#>\s]*)(?:sources?|references?|citations?|further reading)(?:\s*:)?\s*(?:[*_]*)\s*\n[\s\S]*$/i,
                        "",
                      )
                      .trimEnd();
                    const sourcesMd = collectedSources.length
                      ? `\n\n**Sources**\n${collectedSources
                          .slice(0, 6)
                          .map((s) => {
                            let domain = s.url;
                            try {
                              domain = new URL(s.url).hostname.replace(/^www\./, "");
                            } catch {
                              /* keep the raw url as the label */
                            }
                            return `- [${s.title || domain}](${s.url}) — ${domain}`;
                          })
                          .join("\n")}`
                      : "";
                    enhancedMessage =
                      cleanedSummary +
                      sourcesMd +
                      (inlineImageBlocks.length ? `\n\n${inlineImageBlocks.join("\n\n")}` : "");
                  }
                } catch (summaryError) {
                  debugLogger.error("Summarization pass threw", {
                    error: summaryError instanceof Error ? summaryError.message : String(summaryError),
                  });
                  // Fall back to the inline-spliced enhancedMessage.
                }
              }
            }

            // Wrap up and update UI/history
            overrideComponentStatus("Idle");
            setIsSubmitting(false);
            setPreviousQuestion(question);

            if (!enhancedMessage.trim()) {
              enhancedMessage =
                "Sorry, I got a bit tongue-tied there. Mind asking that again? 😅";
            }

            clearFlushTimer();
            latestDisplayMessage = enhancedMessage;
            lastPartialRef.current.text = enhancedMessage;
            setResponse(enhancedMessage);
            setStreamBuffer(enhancedMessage);

            // Only run memory scan if memory is enabled in preferences
            let memoryUpdated = false;
            if (userPreferences.memoryEnabled) {
              memoryUpdated = await runMemoryScan(question, enhancedMessage);
            } else {
              debugLogger.info("Memory scan skipped - disabled in preferences");
            }
            // Update history, then smoothly transition UI state
            const currentState = useConversationStore.getState();
            const conv = currentState.conversations.find((c) => c.id === currentState.currentId);
            const last = conv?.history.at(-1);
            const lastIsPlaceholder =
              !!last && last.answer === "..." && last.placeholder !== false;

            const preservedImagesSource =
              imageList.length > 0
                ? imageList
                : lastPartialRef.current.images.length > 0
                  ? lastPartialRef.current.images
                  : last?.images;
            const preservedImages =
              Array.isArray(preservedImagesSource) && preservedImagesSource.length > 0
                ? [...preservedImagesSource]
                : undefined;

            if (lastIsPlaceholder) {
              // Replace the temporary entry (if any)
              replaceLastAnswer(enhancedMessage, preservedImages, memoryUpdated, usedDocs);
            } else {
              // Fallback: record a fresh entry and preserve any display question if available
              const historyQuestion =
                (last && last.answer === "..." && last.question) ||
                initialPlaceholderQuestion ||
                question;
              addToCurrent({
                question: historyQuestion,
                answer: enhancedMessage,
                images: preservedImages,
                memoryUpdated,
                sourceFiles: usedDocs,
                rawQuestion: question,
              });
            }

            setInputValue("");
            setPastedImages([]);
            telemetryEndTurn();
            // Keep buffer visible briefly so the last frame matches final markdown
            setTimeout(() => {
              clearFlushTimer();
              setPendingMessage(null);
              setStreamBuffer("");
              setIsStreaming(false);
              setLogoVisible(false);
              inputRef.current?.focus();
            }, 320);
          } catch (e) {
            debugLogger.error("Completion handler failed", {
              error: e instanceof Error ? e.message : String(e),
            });
            overrideComponentStatus("Idle");
            setIsSubmitting(false);
            setIsStreaming(false);
            telemetryEndTurn({ error: e instanceof Error ? e.message : String(e) });
          }
        },
      });
      currentSubRef.current = sub;
    },
    [
      provider,
      history,
      setResponse,
      overrideComponentStatus,
      setPreviousQuestion,
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
      preferences,
      isVectorEnabled,
      searchMemories,
      searchDocuments,
      onError,
    ]
  );

  const cancel = () => {
    if (currentSubRef.current) {
      try { currentSubRef.current.unsubscribe(); } catch {}
      currentSubRef.current = null;
      // Finalize with the latest partial so user sees what was generated up to stop point
      let partial = lastPartialRef.current.text;
      if (partial && !partial.trim().endsWith("…") && !partial.trim().endsWith("...")) {
        partial = partial.trimEnd() + " …";
      }
      overrideComponentStatus("Idle");
      setIsSubmitting(false);
      setIsStreaming(false);
      if (partial) {
        const { replaceLastAnswer } = useConversationStore.getState();
        replaceLastAnswer(partial, lastPartialRef.current.images, false, lastPartialRef.current.usedDocs, true);
        setResponse(partial);
      }
      clearFlushTimer();
      setStreamBuffer("");
      setPendingMessage(null);
      setLogoVisible(false);
    }
  };

  return Object.assign(runAIProvider, { cancel }) as AIProviderExecutor;
};
