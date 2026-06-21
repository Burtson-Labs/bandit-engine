/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.
*/

import { create } from "zustand";

export interface AskUserOption {
  label: string;
  description?: string;
}

export interface AskUserQuestion {
  id: string;
  question: string;
  header?: string;
  options?: AskUserOption[];
  allowFreeform?: boolean;
}

type Resolver = (answers: Record<string, string> | null) => void;

interface AskUserStore {
  /** The question set currently awaiting an answer, or null when idle. */
  pending: { questions: AskUserQuestion[] } | null;
  resolver: Resolver | null;
  /**
   * Pose questions to the user and resolve once they answer (or null if they
   * dismiss). The chat tool loop awaits this in place of an HTTP tool call.
   */
  ask: (questions: AskUserQuestion[]) => Promise<Record<string, string> | null>;
  submit: (answers: Record<string, string>) => void;
  cancel: () => void;
}

export const useAskUserStore = create<AskUserStore>((set, get) => ({
  pending: null,
  resolver: null,
  ask: (questions) =>
    new Promise<Record<string, string> | null>((resolve) => {
      // If a prior prompt is somehow still open, dismiss it first so we never
      // leak a dangling resolver.
      const prev = get().resolver;
      if (prev) prev(null);
      set({ pending: { questions }, resolver: resolve });
    }),
  submit: (answers) => {
    const r = get().resolver;
    set({ pending: null, resolver: null });
    if (r) r(answers);
  },
  cancel: () => {
    const r = get().resolver;
    set({ pending: null, resolver: null });
    if (r) r(null);
  },
}));

/**
 * Parse the model-supplied `questions` JSON into validated question specs.
 * Tolerant (mirrors the bandit-agent-framework ask_user tool): accepts a single
 * object instead of an array, string options, and question/text/prompt aliases.
 */
export const parseAskUserQuestions = (rawJson: unknown): AskUserQuestion[] => {
  let parsed: unknown = rawJson;
  if (typeof rawJson === "string") {
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return [];
    }
  }

  const coerceOption = (raw: unknown): AskUserOption | null => {
    if (typeof raw === "string") return raw.trim() ? { label: raw.trim() } : null;
    if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      const label =
        typeof o.label === "string"
          ? o.label
          : typeof o.value === "string"
            ? o.value
            : typeof o.text === "string"
              ? o.text
              : "";
      if (!label.trim()) return null;
      return {
        label: label.trim(),
        description: typeof o.description === "string" ? o.description : undefined,
      };
    }
    return null;
  };

  const list = Array.isArray(parsed) ? parsed : [parsed];
  const questions: AskUserQuestion[] = [];
  list.forEach((raw, i) => {
    if (!raw || typeof raw !== "object") return;
    const r = raw as Record<string, unknown>;
    const text =
      typeof r.question === "string"
        ? r.question
        : typeof r.text === "string"
          ? r.text
          : typeof r.prompt === "string"
            ? r.prompt
            : "";
    if (!text.trim()) return;
    const options = (Array.isArray(r.options) ? r.options : [])
      .map(coerceOption)
      .filter((o): o is AskUserOption => o !== null);
    questions.push({
      id: typeof r.id === "string" && r.id.trim() ? r.id.trim() : `q${i + 1}`,
      question: text.trim(),
      header: typeof r.header === "string" && r.header.trim() ? r.header.trim() : undefined,
      options: options.length > 0 ? options : undefined,
      allowFreeform: r.allowFreeform === false ? false : true,
    });
  });
  return questions;
};
