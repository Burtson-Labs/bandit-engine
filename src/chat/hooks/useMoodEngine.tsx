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

// Bandit Engine Watermark: BL-WM-BA71-78AB05
const __banditFingerprint_hooks_useMoodEnginetsx = 'BL-FP-E2C2A9-C9A6';
const __auditTrail_hooks_useMoodEnginetsx = 'BL-AU-MGOIKVV2-TYFB';
// File: useMoodEngine.tsx | Path: src/chat/hooks/useMoodEngine.tsx | Hash: ba71c9a6

import { useState } from "react";
import { detectMessageMood } from "../../services/prompts";
import { debugLogger } from "../../services/logging/debugLogger";

export type UserMood = "high" | "neutral" | "low";

/**
 *   useMoodEngine
 *
 * Centralized hook for detecting and managing user mood.
 * - Uses Bandit's micro-LLM for emotional tone classification.
 * - Persists latest mood in memory for companion awareness.
 * - Can be used to drive UI styling, voice tone, or model behavior.
 */
export const useMoodEngine = () => {
  const [mood, setMood] = useState<UserMood>("neutral");

  /**
   * Analyze user message and update mood.
   * Optionally logs response for debugging.
   */
  const analyzeMood = async (message: string): Promise<UserMood> => {
    try {
      const detected = await detectMessageMood(message);
      setMood(detected);
      debugLogger.debug("🧠 Mood Engine: updated mood to", { mood: detected });
      return detected;
    } catch (err) {
      debugLogger.warn("⚠️ Mood Engine fallback to neutral due to error:", { error: err });
      setMood("neutral");
      return "neutral";
    }
  };

  // Reward-based token boost for excited users
  const moodTokenBoost = mood === "high" ? 250 : 0;

  return {
    mood,
    setMood,
    analyzeMood,
    moodTokenBoost,
  };
};

export const moodPromptMap = {
    high: "The user is highly energized and excited. Respond with enthusiasm, creativity, and momentum.",
    neutral: "Respond in your usual helpful, clear, and personable tone.",
    low: "The user may be feeling a bit off. Respond gently, with encouragement and calm support.",
  };
