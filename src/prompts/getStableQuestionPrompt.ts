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
}

/**
 * @param limit - Number of questions to generate (1-10)
 * @param topicOfInterest - Default topic e.g "sports, travel, being Mark Burtson, technology, coding, .NET, kite flying, etc." 
 * @returns A prompt string for generating questions
 */
export const getStableQuestionPrompt = (args: QuestionPromptArgs): string => {
  const { limit, topicOfInterest, modelSystemPrompt } = args;
  if (limit < 1 || limit > 10) {
    throw new Error("Limit must be between 1 and 10");
  }
  const seed = generateSeed();
  
  // Build the base prompt
  let prompt = `You are a helpful assistant.

The following seed uniquely identifies the topic: "${seed}"`;

  // Add model-specific context if available
  if (modelSystemPrompt && modelSystemPrompt.trim()) {
    prompt += `

Based on this specialized assistant profile: "${modelSystemPrompt.trim()}"`;
  }

  prompt += `

Generate ${limit} concise (5–20 words, try to use this entire range), natural-sounding questions a user might ask${modelSystemPrompt ? ' this specialized assistant' : ' an AI assistant'}. These should be:

- Relevant to ${topicOfInterest}`;

  // Add model-specific relevance if we have a system prompt
  if (modelSystemPrompt && modelSystemPrompt.trim()) {
    prompt += `
- Aligned with the assistant's specialized capabilities and knowledge area`;
  }

  prompt += `
- Specific enough to be practical
- Easy to understand and not abstract

Do not:
- Refer to yourself or use phrases like "As an AI..."
- Include greetings, explanations, or personality
- Include jokes, fiction, or quotes

Output only ${limit} questions — one per line.`;

  return prompt.trim();
}