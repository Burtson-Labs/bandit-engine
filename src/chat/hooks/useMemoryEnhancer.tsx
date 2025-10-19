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

// Bandit Engine Watermark: BL-WM-96A8-211AAB
const __banditFingerprint_hooks_useMemoryEnhancertsx = 'BL-FP-050810-A500';
const __auditTrail_hooks_useMemoryEnhancertsx = 'BL-AU-MGOIKVV2-Y7LR';
// File: useMemoryEnhancer.tsx | Path: src/chat/hooks/useMemoryEnhancer.tsx | Hash: 96a8a500

/**
 * 🧠 Bandit Interest-Focused Memory System (Phase 4)
 *
 * Mission:
 * - Capture meaningful user interests, excitement, and engagement signals
 * - Focus on information that enhances future user experiences
 * - Eliminate noise, creepy data collection, and irrelevant personal details
 * - Build memory that helps provide better, more personalized assistance
 *
 * New Approach - User Interest & Excitement Detection:
 * - Detects when users express passion, enthusiasm, or deep interest
 * - Captures user goals, aspirations, and active projects
 * - Records preferences that affect how AI should respond (format, tone, methods)
 * - Remembers tools, technologies, and workflows users prefer
 * - Tracks learning goals and skill development interests
 * - Ignores casual mentions and demographic trivia
 *
 * Key Improvements:
 * - Interest-based filtering instead of broad "personal information" scanning
 * - Enhanced LLM prompts focused on user engagement and excitement
 * - Stricter validation against generic or meaningless content
 * - Emphasis on actionable memory that improves future interactions
 *
 * Privacy-First Design:
 * - Only captures what users are genuinely excited to share
 * - Avoids invasive collection of routine personal details
 * - Focuses on enhancement, not surveillance
 * - User maintains full control (view, edit, pin, delete)
 *
 * Technical Enhancements:
 * - Improved semantic filtering for meaningful content detection
 * - Enhanced personal text recognition for engagement signals
 * - Stricter memory validation against generic statements
 * - Context-aware memory generation focused on user value
 *
 * - 100% local-first, fully user-controllable memory (view, edit, pin, delete).
 *
 * Technical Enhancements:
 * - Cosine similarity thresholds for echo rejection, divergence detection, and merging.
 * - Combined lightweight semantic filters with micro-LLM calls for max precision.
 * - Early foundations laid for memory token budgeting and relevance-based surfacing.
 * - Private semantic memory embeddings managed entirely client-side.
 *
 * Companionware Vision:
 * - Bandit's memory is no longer just reactive — it is **becoming an active companion**.
 * - Every captured memory moves Bandit closer to true contextual alignment with the user.
 * - Bandit is designed to serve as **Private AI Companionware**: evolving with you, not ahead of you.
 *
 * Future Phases:
 * - Phase 4: Auto-pinning highly important memories based on semantic scoring.
 * - Phase 5: Local RAG memory search — using your memories to enhance real-time chats.
 * - Phase 6: Visual memory timeline and relevance controls.
 *
 * Phase 3 Conclusion:
 * > Bandit is no longer just remembering facts.
 * > Bandit is **growing with you** — as a private, local, true AI Companion.
 */

import { lastValueFrom, map } from "rxjs";
import { useMemoryStore } from "../../store/memoryStore";
import { useAIProviderStore } from "../../store/aiProviderStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import type { AIGenerateResponse } from "../../services/ai-provider/types/common.types";
import { useVectorStore } from "../../hooks/useVectorStore";
import { embeddingService } from "../../services/embedding/embeddingService";
import { detectUserInterestAndExcitement } from "../../services/prompts";
import { debugLogger } from "../../services/logging/debugLogger";
import { useConversationSyncStore } from "../../store/conversationSyncStore";

const MEMORY_LIMIT = 100;
const MIN_MEMORY_WORDS = 3;
const MERGE_THRESHOLD = 0.9;
const REJECT_ECHO_THRESHOLD = 0.98;
const REJECT_DUPLICATE_THRESHOLD = 0.985;
const DIVERGENCE_REJECTION_THRESHOLD = 0.65;
const CONTEXTUAL_DIVERGENCE_THRESHOLD = 0.75;

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isStructurallyDuplicate = (a: string, b: string) => {
  const tokensA = new Set(normalizeText(a).split(" "));
  const tokensB = new Set(normalizeText(b).split(" "));
  const shared = [...tokensA].filter((t) => tokensB.has(t));
  const ratio = shared.length / Math.min(tokensA.size, tokensB.size);
  return ratio > 0.8;
};

const isAboutBandit = (text: string) => {
  const lc = text.toLowerCase();
  
  // Allow business/usage context even if it mentions Bandit AI
  const hasBusinessContext = lc.includes("business") || lc.includes("help my") || 
    lc.includes("use for") || lc.includes("using for") || lc.includes("work with") ||
    lc.includes("building with") || lc.includes("vector db") || lc.includes("setup");
  
  if (hasBusinessContext) {
    return false; // Don't reject business context memories
  }
  
  // Only reject purely self-referential content about Bandit itself
  return (lc.includes("bandit ai") && (lc.includes("you are") || lc.includes("what are you") || 
    lc.includes("who are you") || lc.includes("describe yourself"))) || 
    lc.includes("you are bandit");
};

const hasEngagementValue = (text: string) => {
  const lc = text.toLowerCase();
  
  // Strong signals for AI/building enthusiasm - always valuable
  const aiEnthusiasm = [
    "enjoys building with ai", "loves building with", "building with ai",
    "so much fun", "really fun", "fun to", "exciting to",
    "passionate about building", "excited about", "love working with ai",
    "ai is fun", "found it fun", "having fun with"
  ];
  
  if (aiEnthusiasm.some(signal => lc.includes(signal))) {
    return true; // Always accept AI building enthusiasm
  }
  
  // Look for signals that this memory could enhance future interactions
  const valuableSignals = [
    "enjoys", "loves", "passionate about", "excited about",
    "interested in", "working on", "focusing on", "struggling with",
    "needs help with", "wants to learn", "trying to", "hoping to",
    "prefers", "works best with", "uses", "specializes in",
    "is passionate about", "is excited about", "is working on",
    "wants to learn", "goals include", "aspires to", "dreams of",
    "finds helpful", "effective approach", "preferred method",
    "learning", "developing", "building", "creating", "studying",
    // Add business and enthusiasm signals
    "pumped to use", "excited to use", "love how", "business",
    "help my business", "for my business", "using for work",
    "plans to use", "wants to use for",
    // Add AI/building enthusiasm patterns
    "love building", "building with", "so much fun", "really fun",
    "enjoy working", "love working", "passionate about building",
    "excited about", "fun to", "love using", "love how",
    "thanks for helping", "appreciate help", "helpful for",
    "setup", "vector db", "database setup", "ai setup"
  ];
  
  return valuableSignals.some(signal => lc.includes(signal));
};

const isMemoryTooShortOrGeneric = (text: string) => {
  const words = text.trim().split(/\s+/);
  return words.length < MIN_MEMORY_WORDS;
};

const isPersonalText = (text: string) => {
  const lc = text.toLowerCase();
  
  // Look for expressions of interest, excitement, or engagement
  const interestSignals = [
    "i love", "i'm excited", "i'm passionate about", "i'm interested in",
    "i really enjoy", "i'm working on", "i'm learning", "i want to",
    "my goal", "i dream", "i hope to", "i plan to", "i aspire",
    "i'm trying to", "i need help with", "i prefer", "i use",
    "my favorite approach", "i find it helpful", "works best for me",
    // Add business enthusiasm signals
    "i'm so pumped", "pumped to use", "excited to use", "love how easy",
    // Add AI/building enthusiasm patterns
    "love building", "building with ai", "so much fun", "really fun",
    "thanks for helping", "appreciate the help", "helpful with",
    "with my", "for my", "help me with"
  ];
  
  // Look for project/work engagement
  const engagementSignals = [
    "i'm building", "i'm developing", "working on a project",
    "i'm studying", "i'm focusing on", "i specialize in",
    // Add business context signals
    "help my business", "for my business", "business needs",
    // Add setup/technical enthusiasm
    "vector db setup", "database setup", "ai setup", "setup process"
  ];
  
  // Look for preference expressions that could improve responses
  const preferenceSignals = [
    "i like when", "i prefer", "it helps when", "i find it easier",
    "i work better with", "i understand better when"
  ];
  
  return [...interestSignals, ...engagementSignals, ...preferenceSignals]
    .some(signal => lc.includes(signal));
};

const mergeMemory = (existing: string, incoming: string) => {
  const sanitizedIncoming = sanitizeMemoryText(incoming);
  const sanitizedExisting = sanitizeMemoryText(existing);
  if (
    sanitizedIncoming === "NO_UPDATE" ||
    sanitizedExisting.includes(sanitizedIncoming)
  ) {
    return existing;
  }
  return sanitizedExisting.endsWith(".")
    ? `${sanitizedExisting} ${sanitizedIncoming}`
    : `${sanitizedExisting}. ${sanitizedIncoming}`;
};

const isVoiceShifted = (text: string) => {
  const lower = text.toLowerCase();
  return (
    lower.includes("for me") || lower.includes("they are") || lower.includes("he/she")
  );
};

const sanitizeMemory = (text: string) =>
  text
    .replace(/^_(.*?)_$/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/<\/?endofturn>/gi, "")  // Remove any remaining end of turn tokens
    .replace(/\n+/g, " ")  // Convert newlines to spaces
    .replace(/\s+/g, " ")  // Normalize whitespace
    .trim();

const sanitizeMemoryText = (text: string) =>
  text
    .replace(/[_*~`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

const shouldAcceptMemory = async (
  newMemory: string,
  userInput: string,
  shouldUseVectorForMemories: boolean = false,
  forceAccept: boolean = false
): Promise<boolean> => {
  const { entries } = useMemoryStore.getState();

  debugLogger.memoryDebug("Memory acceptance validation start", {
    newMemory: newMemory.slice(0, 150),
    userInput: userInput.slice(0, 100),
    entriesCount: entries.length,
    storageMode: shouldUseVectorForMemories ? 'vector' : 'indexeddb'
  });

  if (!newMemory.trim()) {
    debugLogger.memoryDebug("Memory rejected - empty or whitespace", {});
    return false;
  }

  if (isAboutBandit(newMemory)) {
    debugLogger.memoryDebug("Memory rejected - about Bandit", { 
      memory: newMemory.slice(0, 100) 
    });
    return false;
  }

  if (forceAccept) {
    debugLogger.memoryDebug("Memory force-accepted due to user request", {
      memory: newMemory.slice(0, 150),
    });
    return true;
  }

  if (isMemoryTooShortOrGeneric(newMemory)) {
    debugLogger.memoryDebug("Memory rejected - too short or generic", { 
      memory: newMemory.slice(0, 100),
      wordCount: newMemory.trim().split(/\s+/).length
    });
    return false;
  }

  if (!hasEngagementValue(newMemory)) {
    debugLogger.memoryDebug("Memory lacks engagement value but accepted", {
      memory: newMemory.slice(0, 100),
    });
  }

  debugLogger.memoryDebug("Memory passed basic validation checks", {
    memory: newMemory.slice(0, 100)
  });

  const newEmbedding = await embeddingService.generate(newMemory);
  const inputEmbedding = await embeddingService.generate(userInput);

  const echoSim = embeddingService.cosineSimilarity(newEmbedding, inputEmbedding);
  if (
    echoSim >= REJECT_ECHO_THRESHOLD &&
    normalizeText(newMemory) === normalizeText(userInput)
  ) {
    debugLogger.memoryDebug("Memory rejected - exact input duplication", { 
      echoSim, 
      newMemory: newMemory.slice(0, 100) 
    });
    return false;
  }

  const divergenceSim = embeddingService.cosineSimilarity(newEmbedding, inputEmbedding);
  // Accept memories that are related but not identical
  // Reject if too similar (echo) or completely unrelated
  if (divergenceSim >= REJECT_ECHO_THRESHOLD) {
    debugLogger.memoryDebug("Memory rejected - too similar to input (echo)", {
      divergenceSim: divergenceSim.toFixed(2),
      threshold: REJECT_ECHO_THRESHOLD
    });
    return false;
  }
  
  // Allow memories that are somewhat related - don't require high similarity
  // This was previously rejecting good memories for being "divergent"
  if (divergenceSim < 0.3) {
    debugLogger.memoryDebug("Memory loosely related but accepted", {
      divergenceSim: divergenceSim.toFixed(2),
      threshold: 0.3,
    });
  }

  // Only check for duplicates within the same storage system
  if (shouldUseVectorForMemories) {
    // For vector storage, we rely on the vector database's semantic deduplication
    // We don't check against local IndexedDB memories since they're in a different system
    debugLogger.memoryDebug("Skipping local duplicate check for vector storage", {
      memory: newMemory.slice(0, 100)
    });
  } else {
    // For IndexedDB storage, check against existing local memories
    for (const entry of entries) {
      if (!entry.embedding) continue;
      const sim = embeddingService.cosineSimilarity(newEmbedding, entry.embedding);
      if (sim >= REJECT_DUPLICATE_THRESHOLD) {
        debugLogger.memoryDebug("Memory rejected - duplicate detected", {
          similarity: sim.toFixed(2),
          existingContent: entry.content.slice(0, 100)
        });
        return false;
      }
      if (isStructurallyDuplicate(entry.content, newMemory)) {
        debugLogger.memoryDebug("Memory rejected - structurally duplicate", { 
          existingContent: entry.content.slice(0, 100) 
        });
        return false;
      }
    }
  }

  return true;
};

const isContextuallyDivergent = async (
  existing: string,
  incoming: string
): Promise<boolean> => {
  const existingEmbedding = await embeddingService.generate(existing);
  const incomingEmbedding = await embeddingService.generate(incoming);
  const sim = embeddingService.cosineSimilarity(existingEmbedding, incomingEmbedding);
  return sim < CONTEXTUAL_DIVERGENCE_THRESHOLD;
};

export const useMemoryEnhancer = () => {
  const { isVectorEnabled, addMemory: addVectorMemory } = useVectorStore();
  const isAdvancedVectorFeaturesEnabled = useConversationSyncStore(
    (state) => state.isAdvancedVectorFeaturesEnabled
  );
  
  const runMemoryScan = async (question: string, response: string) => {
    if (!question.trim() || !response.trim()) return false;
    if (response.length < 20) return false;

    const rememberPatterns = [
      /\bplease\s+remember\b/i,
      /\bcan\s+you\s+remember\b/i,
      /\bcould\s+you\s+remember\b/i,
      /\bremember\s+(?:this|that|it|these|my|for\s+me)\b/i,
      /\bsave\s+(?:this|that|it|these)\s+for\s+later\b/i,
      /\bremember\s+to\s+call\b/i,
      /\badd\s+(?:this|that|it|these)\s+to\s+memories?\b/i,
      /\bwill\s+you\s+remember\s+(?:this|that|it|these|for\s+me)?\b/i,
      /\bplease\s+save\s+(?:this|that|it|these)\s+as\s+(?:a\s+)?memory\b/i,
      /\bremember\s+this\s+later\b/i,
      /\bdon't\s+forget\s+(?:this|that|it|these)\b/i,
      /\bkeep\s+(?:this|that|it|these)\s+in\s+mind\b/i,
    ];

    const userRequestedMemory =
      rememberPatterns.some((pattern) => pattern.test(question)) ||
      rememberPatterns.some((pattern) => pattern.test(response));

    const personalQuestion = isPersonalText(question);
    const personalResponse = isPersonalText(response);
    const engagementQuestion = hasEngagementValue(question);
    const engagementResponse = hasEngagementValue(response);
    const heuristicPersonalSignals =
      personalQuestion || personalResponse || engagementQuestion || engagementResponse;

    // Get the provider fresh each time the function is called
    const provider = useAIProviderStore.getState().provider;
    const settings = usePackageSettingsStore.getState().settings;
    const model = settings?.defaultModel || "bandit-core";

    if (!provider) {
      debugLogger.error("No AI provider available for memory scanning");
      return false;
    }

    // Check if advanced memories are specifically enabled for memory storage
    const shouldUseVectorForMemories = isVectorEnabled && isAdvancedVectorFeaturesEnabled;

    debugLogger.memoryDebug("Memory storage mode check", {
      isVectorEnabled,
      isAdvancedVectorFeaturesEnabled,
      shouldUseVectorForMemories,
      questionPreview: question.slice(0, 100)
    });

    debugLogger.memoryDebug("Memory enhancer start", {
      questionLength: question.length,
      responseLength: response.length,
      questionPreview: question.slice(0, 150),
      responsePreview: response.slice(0, 150),
    });

    debugLogger.memoryDebug("Interest and engagement check", {
      personalQuestion,
      personalResponse,
      engagementQuestion,
      engagementResponse,
      heuristicPersonalSignals,
      question: question.slice(0, 100),
      response: response.slice(0, 100),
    });

    let looksPersonal = false;
    let detectionSource: "user_request" | "heuristics" | "llm" = "llm";

    if (userRequestedMemory) {
      looksPersonal = true;
      detectionSource = "user_request";
      debugLogger.memoryDebug("Memory scan proceeding due to explicit user request", {
        questionPreview: question.slice(0, 120),
      });
    } else if (heuristicPersonalSignals) {
      looksPersonal = true;
      detectionSource = "heuristics";
      debugLogger.memoryDebug("Memory scan proceeding due to heuristic signals", {
        personalQuestion,
        personalResponse,
        engagementQuestion,
        engagementResponse,
      });
    } else {
      looksPersonal = await detectUserInterestAndExcitement(question, response);
      debugLogger.memoryDebug("Personal interest detection result", {
        looksPersonal,
        questionPreview: question.slice(0, 100),
      });
    }

    if (!looksPersonal) {
      debugLogger.info("No user interest or excitement detected - skipping memory scan", {
        questionPreview: question.slice(0, 100),
        detectionSource,
        userRequestedMemory,
        heuristicPersonalSignals,
      });
      return false;
    }

    const requestMemorySuggestion = async (
      promptText: string,
      attempt: "primary" | "forced"
    ): Promise<string | null> => {
      try {
        const result$ = provider.generate({
          model,
          prompt: promptText,
          stream: false,
          options: { temperature: 0.1, num_predict: 150 },
        });

        const suggestion = await lastValueFrom(
          result$.pipe(map((chunk: AIGenerateResponse) => chunk.response))
        );

        debugLogger.memoryDebug(`LLM memory suggestion received (${attempt})`, {
          suggestion: typeof suggestion === "string" ? suggestion.slice(0, 200) : suggestion,
          suggestionType: typeof suggestion,
        });

        if (!suggestion || typeof suggestion !== "string") {
          debugLogger.warn(`Invalid memory suggestion from LLM (${attempt})`, { suggestion });
          return null;
        }

        const cleaned = suggestion
          .replace(/```json|```/g, "")
          .replace(/<\/?endofturn>/gi, "")
          .replace(/\n+/g, " ")
          .trim();
        const finalMemory = sanitizeMemory(
          cleaned.replace(/^(Bandit AI:|Note:|Suggestion:|Summary:|Memory:)\s*/i, "").trim()
        );

        debugLogger.memoryDebug(`Memory cleaned and sanitized (${attempt})`, {
          originalSuggestion: suggestion.slice(0, 200),
          cleaned: cleaned.slice(0, 200),
          finalMemory: finalMemory.slice(0, 200),
        });

        return finalMemory;
      } catch (error) {
        debugLogger.error(`Memory suggestion generation failed (${attempt})`, { error });
        return null;
      }
    };

    const prompt = `Extract a short personal memory strictly based on what the user explicitly shared.
- Summarize clearly and naturally using "the user" phrasing.
- Do not invent, infer, or guess additional details.
- Only state what the user explicitly said, reworded naturally.
- Speak in the third person ("the user"), without addressing the user.
- Do not add emojis, opinions, or assumptions.
- Only include background, preferences, or activities.
${userRequestedMemory ? "- The user explicitly asked you to remember this; capture the detail they want saved.\n" : ""}- If no clear personal fact is found, respond exactly with "NO_UPDATE".

User: "${question}"
Assistant: "${response}"

Respond with:
- A clean, short memory statement (strictly factual).
- Or "NO_UPDATE".`.trim();

    try {
      let finalMemory = await requestMemorySuggestion(prompt, "primary");

      if (!finalMemory) {
        return false;
      }

      if (finalMemory === "NO_UPDATE" && userRequestedMemory) {
        debugLogger.memoryDebug("Retrying memory extraction due to explicit user request", {
          questionPreview: question.slice(0, 120),
        });

        const forcedPrompt = `${prompt}\n\nThe user explicitly asked you to remember this. Respond with a short third-person memory sentence and do not reply with "NO_UPDATE".`;
        const forcedMemory = await requestMemorySuggestion(forcedPrompt, "forced");
        if (forcedMemory) {
          finalMemory = forcedMemory;
        }
      }

      if (
        finalMemory === "NO_UPDATE" ||
        finalMemory.length < 10 ||
        finalMemory.startsWith("{") ||
        finalMemory.startsWith("[")
      ) {
        debugLogger.info("Memory rejected - NO_UPDATE or invalid format", {
          finalMemory,
          reason: finalMemory === "NO_UPDATE" ? "NO_UPDATE" : 
                  finalMemory.length < 10 ? "too short" : "invalid format"
        });
        return false;
      }

      const memoryAccepted = await shouldAcceptMemory(
        finalMemory,
        question,
        shouldUseVectorForMemories,
        userRequestedMemory
      );
      debugLogger.memoryDebug("Memory validation result", {
        memoryAccepted,
        finalMemory: finalMemory.slice(0, 150),
        questionPreview: question.slice(0, 100),
        storageMode: shouldUseVectorForMemories ? 'vector' : 'indexeddb'
      });
      
      if (!memoryAccepted) {
        debugLogger.info("Memory rejected after validation checks", {
          finalMemory: finalMemory.slice(0, 150),
          questionPreview: question.slice(0, 100)
        });
        return false;
      }

      // Use vector store if both vector is enabled AND advanced memories are specifically enabled
      if (shouldUseVectorForMemories) {
        // For vector store, we don't need to manage merging/duplicates manually
        // as the vector database will handle semantic search and relevance
        try {
          const result = await addVectorMemory(finalMemory, [], 'auto'); // Pass source as 'auto' for automatically detected memories
          if (result.success) {
            debugLogger.info("Memory successfully added to vector store", {
              contentPreview: finalMemory.slice(0, 100),
              source: 'auto'
            });
            return true;
          } else {
            debugLogger.warn("Vector memory save failed, falling back to local store", { 
              error: result.error,
              contentPreview: finalMemory.slice(0, 100)
            });
            // Continue with local store logic as fallback
          }
        } catch (error) {
          debugLogger.error("Failed to add memory to vector store, falling back to local", { error });
          // Continue with local store logic as fallback
        }
      }

      // Local store logic (original implementation)
      const { entries, addMemory } = useMemoryStore.getState();
      if (entries.length >= MEMORY_LIMIT) {
        debugLogger.warn("Memory limit reached - skipping save", { 
          currentCount: entries.length, 
          limit: MEMORY_LIMIT 
        });
        return false;
      }

      const newEmbedding = await embeddingService.generate(finalMemory);

      let merged = false;
      for (const entry of entries) {
        if (entry.embedding) {
          const sim = embeddingService.cosineSimilarity(entry.embedding, newEmbedding);
          if (
            isStructurallyDuplicate(entry.content, finalMemory) ||
            (sim >= MERGE_THRESHOLD &&
              !isVoiceShifted(finalMemory) &&
              !(await isContextuallyDivergent(entry.content, finalMemory)))
          ) {
            useMemoryStore.setState((state) => ({
              entries: state.entries.map((e) =>
                e.id === entry.id
                  ? { ...e, content: mergeMemory(e.content, finalMemory) }
                  : e
              ),
            }));
            merged = true;
            break;
          }
        }
      }

      if (!merged) {
        addMemory(finalMemory, [], "auto", newEmbedding);
      }

      return true;
    } catch (err) {
      debugLogger.error("Memory scan failed", { error: err });
      return false;
    }
  };

  return { runMemoryScan };
};
