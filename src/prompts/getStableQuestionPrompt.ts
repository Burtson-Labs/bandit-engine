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

// Bandit Engine Watermark: BL-WM-426C-2EC0F0
const __banditFingerprint_prompts_getStableQuestionPromptts = 'BL-FP-1BF51B-C535';
const __auditTrail_prompts_getStableQuestionPromptts = 'BL-AU-MGOIKVVP-0EFF';
// File: getStableQuestionPrompt.ts | Path: src/prompts/getStableQuestionPrompt.ts | Hash: 426cc535

import { generateSeed, randomRange } from "../util";
export type GeneralTopicOfInterest = typeof TOPICS[number];
export const TOPICS = ["everyday life", "finance", "sports", "travel", "technology", "politics", "health", "food", "entertainment", "education", "science", "history", "art", "music", "literature", "philosophy", "psychology", "sociology", "environmental issues", "current events"] as const;

export const getRandomTopicOfInterest = (): GeneralTopicOfInterest => {
  const minIndex = 0;
  // Use length - 1 to get the last index because `randomRange` is inclusive
  const maxIndex = TOPICS.length - 1;
  const randomIndex = randomRange(minIndex, maxIndex);
  const randomTopic = TOPICS[randomIndex];
  return randomTopic;
}

/**
 * Pick `count` DISTINCT random topics. Used to spread a starter set across
 * several topics so it never clusters on one — the root cause of "every set
 * looks the same".
 */
export const pickDistinctRandomTopics = (count: number): GeneralTopicOfInterest[] => {
  const pool: GeneralTopicOfInterest[] = [...TOPICS];
  const picked: GeneralTopicOfInterest[] = [];
  const n = Math.min(Math.max(count, 0), pool.length);
  for (let i = 0; i < n; i++) {
    const idx = randomRange(0, pool.length - 1);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
};


export interface QuestionPromptArgs {
  /**
   * Number of questions to generate (1-10)
   * Values outside this range will throw an error
   */
  limit: number;
  /**
   * Must be a string containing a topic of interest, prepositions, conjuctions, adverbs, and adjectives will produce undesirable results.
   * GOOD EXAMPLE: "sports, travel, Mark Burtson, Bandit Labs, technology, coding, .NET, kite flying"
   * BAD EXMAPLE: "in, and, quickly, beautiful" do not make sense as a topic of interest.
   */
  topicOfInterest: string;
  /**
   * Optional system prompt from the selected model to tailor suggestions
   */
  modelSystemPrompt?: string;
  /**
   * The user's saved interest categories (from their profile). Starters lean
   * toward these without clustering on a single one.
   */
  interests?: string[];
  /**
   * Titles/topics from the user's knowledge library — included only when the
   * user has opted in to knowledge-aware starters.
   */
  knowledgeTopics?: string[];
  /**
   * When true, the assistant can search the web, so some starters should invite
   * current / up-to-date answers.
   */
  webSearchAvailable?: boolean;
}

/**
 * @param limit - Number of questions to generate (1-10)
 * @param topicOfInterest - Default topic e.g "sports, travel, being Mark Burtson, technology, coding, .NET, kite flying, etc." 
 * @returns A prompt string for generating questions
 */
export const getStableQuestionPrompt = (args: QuestionPromptArgs): string => {
  const { limit, topicOfInterest, modelSystemPrompt, interests, knowledgeTopics, webSearchAvailable } = args;
  if (limit < 1 || limit > 10) {
    throw new Error("Limit must be between 1 and 10");
  }
  const seed = generateSeed();

  const lines: string[] = [
    `You are crafting fresh, engaging conversation starters for a chat app's home screen.`,
    ``,
    `Variation seed (make this set different from any previous set): "${seed}"`,
  ];

  if (modelSystemPrompt && modelSystemPrompt.trim()) {
    lines.push(``, `Tailor the questions to this assistant's role and expertise: "${modelSystemPrompt.trim()}"`);
  }

  if (interests && interests.length) {
    lines.push(
      ``,
      `The user is especially interested in: ${interests.join(", ")}. Lean toward these, but do NOT make every question about the same one.`,
    );
  }

  if (knowledgeTopics && knowledgeTopics.length) {
    lines.push(
      ``,
      `The user keeps these documents in their library: ${knowledgeTopics.join("; ")}. Include one or two questions that draw on this material.`,
    );
  }

  lines.push(
    ``,
    `Spread the set across a VARIETY of these topics so it never feels repetitive (do not cluster on one): ${topicOfInterest}.`,
  );

  if (webSearchAvailable) {
    lines.push(
      ``,
      `This assistant can search the web for live information. Include 2–3 questions that invite current, up-to-date answers (latest news, recent developments, "today" / "this week") so the user discovers that capability.`,
    );
  }

  lines.push(
    ``,
    `Generate ${limit} concise (5–20 words), natural-sounding questions a user might ask${modelSystemPrompt ? " this specialized assistant" : " an AI assistant"}. Requirements:`,
    `- Each question must explore a DISTINCT topic or angle — no two may be similar or rephrasings of each other.`,
    `- Vary the type across the set: practical how-to, curious exploration, current/topical, creative, and learning.`,
    `- Specific and concrete, easy to understand, not abstract.`,
    ``,
    `Do not refer to yourself, say "As an AI", add greetings, explanations, jokes, fiction, quotes, or number/bullet the lines.`,
    ``,
    `Output only ${limit} questions — one per line, with no leading numbers, bullets, or prefixes.`,
  );

  return lines.join("\n").trim();
}
