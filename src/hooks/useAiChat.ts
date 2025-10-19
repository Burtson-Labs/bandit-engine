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

// Bandit Engine Watermark: BL-WM-1263-9357C5
const __banditFingerprint_hooks_useAiChatts = 'BL-FP-37C953-1858';
const __auditTrail_hooks_useAiChatts = 'BL-AU-MGOIKVVD-YXTI';
// File: useAiChat.ts | Path: src/hooks/useAiChat.ts | Hash: 12631858

import { useState, useEffect } from "react";
import { useMediaQuery, Theme } from "@mui/material";
import { useAIQueryStore } from "../store/aiQueryStore";
import { useAIProviderStore } from "../store/aiProviderStore";
import { useModelStore } from "../store/modelStore";
import { usePackageSettingsStore } from "../store/packageSettingsStore";
import { debugLogger } from "../services/logging/debugLogger";

//TODO: This file can likely be removed and solely use the useAIProvider hook the same way Chat.tsx does
/**
 * @deprecated This hook will likely be removed in a future version.
 * Please use the new useAIProvider hook instead, which provides better RAG integration,
 * unified provider support, and improved error handling.
 * 
 * The Chat component already uses useAIProvider successfully.
 */

const useAIChat = () => {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const provider = useAIProviderStore((state) => state.provider);
  const SYSTEM_PROMPT = useModelStore((state) => state.systemPrompt);
  const OLLAMA_MODEL = usePackageSettingsStore((state) => state.settings?.defaultModel || "");
  const [fullScreen, setFullScreen] = useState(isMobile);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [, setAutoFullscreenTriggered] = useState(false);

  const {
    apiKey,
    inputValue,
    setApiKey,
    setInputValue,
    setResponse,
    setPreviousQuestion,
    setComponentStatus,
    addHistory,
  } = useAIQueryStore();

  const sendWithAIProvider = () => {
    if (!provider) {
      debugLogger.error("No AI provider available for chat");
      setComponentStatus("Error");
      return;
    }

    let message = "";
    setComponentStatus("Loading");

    const stream = provider.chat({
      model: OLLAMA_MODEL,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: inputValue },
      ],
    });

    stream.subscribe({
      next: (data) => {
        message += data.message.content;
        setResponse(message);
      },
      error: (err: unknown) => {
        debugLogger.error("Stream error in AI chat", { error: err });
        setComponentStatus("Idle");
      },
      complete: () => {
        setComponentStatus("Idle");
        setPreviousQuestion(inputValue);
        setResponse(message);
        addHistory({ question: inputValue, answer: message });
        setInputValue("");
      },
    });
  };

  const sendWithOpenAI = async () => {
    setComponentStatus("Loading");
    setResponse("");
    setAutoFullscreenTriggered(false);

    const history = useAIQueryStore.getState().history;
    const contextMessages = history.slice(-5).flatMap((entry) => [
      { role: "user", content: entry.question },
      { role: "assistant", content: entry.answer },
    ]);

    const payload = {
      model: "gpt-3.5-turbo",
      messages: [...contextMessages, { role: "user", content: inputValue }],
      temperature: 0.7,
    };

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const stubbedAnswer = data.choices[0].message.content;
      setComponentStatus("Idle");
      setPreviousQuestion(inputValue);
      setResponse(stubbedAnswer);
      addHistory({ question: inputValue, answer: stubbedAnswer });
      setInputValue("");
    } catch (err) {
      debugLogger.error("Failed to handle AI chat query", { error: err });
      setComponentStatus("Idle");
    }
  };

  const handleSend = () => {
    if (inputValue.trim() === "") return;
    if (apiKey) {
      void sendWithOpenAI();
      return;
    }

    sendWithAIProvider();
  };

  useEffect(() => {
    setFullScreen(isMobile);
  }, [isMobile]);

  return {
    fullScreen,
    setFullScreen,
    drawerOpen,
    setDrawerOpen,
    showSettings,
    setShowSettings,
    handleSend,
  };
};

export default useAIChat;
