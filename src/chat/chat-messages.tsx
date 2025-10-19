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

// Bandit Engine Watermark: BL-WM-0913-A560CB
const __banditFingerprint_chat_chatmessagestsx = 'BL-FP-2C7887-6AEC';
const __auditTrail_chat_chatmessagestsx = 'BL-AU-MGOIKVUX-4EHG';
// File: chat-messages.tsx | Path: src/chat/chat-messages.tsx | Hash: 09136aec

import React from "react";
import { Box } from "@mui/material";
import AIResponseTextField from "../modals/chat-modal/ai-response-text-field";
import StreamingMarkdown from "../components/StreamingMarkdown";
import { KnowledgeDoc } from "../store/knowledgeStore";
import { HistoryEntry } from "../store/aiQueryStore";
import { useConversationStore } from "../store/conversationStore";
import type { BanditPersonality } from "../store/modelStore";

interface ChatMessagesProps {
  history: HistoryEntry[];
  pendingMessage: {
    question: string;
    images?: string[];
  } | null;
  streamBuffer: string;
  isMobile: boolean;
  scrollTargetRef: React.RefObject<HTMLDivElement>;
  responseStarted: boolean;
  isStreaming: boolean;
  isNetworkSlow?: boolean;
  showInstantFeedback?: boolean;
  selectedModel?: string;
  availableModels?: BanditPersonality[];
}

type SourceFileCandidate = KnowledgeDoc & { chunks?: string[] } & Record<string, unknown>;

const ChatMessages: React.FC<ChatMessagesProps> = ({
  pendingMessage,
  streamBuffer,
  isMobile,
  scrollTargetRef,
  responseStarted,
  isStreaming,
  isNetworkSlow = false,
  showInstantFeedback = true,
  selectedModel,
  availableModels,
}) => {
  void availableModels;
  const { currentId, conversations } = useConversationStore();
  const history = conversations.find((c) => c.id === currentId)?.history ?? [];

  const lastIndex = history.length - 1;
  const hasActivePlaceholder = lastIndex >= 0 && history[lastIndex]?.answer === "...";

  if (!responseStarted && !pendingMessage && history.length === 0) return null;

  return (
    <Box sx={{ px: isMobile ? 0 : 0, pt: "100px", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Instant feedback disabled - was interfering with loading indicator */}

      {history.map((entry, index) => {
        const isLast = index === lastIndex;
        const isPlaceholder = entry.answer === "...";

        const showLoader = isLast && isStreaming && streamBuffer.trim() === "";
        const content = isLast
          ? (isStreaming ? (streamBuffer || "") : (isPlaceholder ? "" : entry.answer))
          : entry.answer;

        const rawSources = entry.sourceFiles as SourceFileCandidate[] | undefined;
        const sourceSummaries = rawSources
          ? rawSources
              .filter((doc) => doc && typeof doc.name === "string" && doc.name.trim())
              .map((doc) => ({ id: doc.id || doc.name, name: doc.name.trim() }))
          : undefined;

        const responseNode = (
          <Box
            sx={{
              minHeight: isLast ? (isMobile ? "80px" : "60px") : undefined,
              position: "relative",
              overflow: "hidden",
              transition: "min-height 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Loader stays mounted but only visible for the last item during pre-first-token */}
            <Box
              sx={{
                position: showLoader ? "static" : "absolute",
                top: 0,
                left: 0,
                right: 0,
                opacity: showLoader ? 1 : 0,
                transform: showLoader ? "translateY(0)" : "translateY(-6px)",
                transition: "all 220ms cubic-bezier(0.4, 0, 0.2, 1)",
                pointerEvents: showLoader ? "auto" : "none",
                zIndex: showLoader ? 1 : 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", minHeight: "40px", pl: 2 }}>
                <div className="typing-only">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </Box>
            </Box>

            {/* Streaming or final content, same component for all entries to avoid swaps */}
            <Box
              sx={{
                position: showLoader ? "absolute" : "static",
                top: 0,
                left: 0,
                right: 0,
                opacity: showLoader ? 0 : 1,
                transform: showLoader ? "translateY(6px)" : "translateY(0)",
                transition: "all 220ms cubic-bezier(0.4, 0, 0.2, 1)",
                pointerEvents: showLoader ? "none" : "auto",
                zIndex: 1,
              }}
            >
              <StreamingMarkdown
                content={content}
                isStreaming={isStreaming && isLast}
                sources={sourceSummaries}
              />
            </Box>
          </Box>
        );

        return (
          <Box key={index}>
            <AIResponseTextField
              question={entry.question}
              response={responseNode}
              responseText={isLast ? (isStreaming ? (streamBuffer || "") : (isPlaceholder ? "" : entry.answer)) : entry.answer}
              backgroundColor="#444"
              images={entry.images}
              memoryUpdated={entry.memoryUpdated && !isPlaceholder}
              sourceFiles={rawSources}
              isMobile={isMobile}
              cancelled={entry.cancelled}
            />
          </Box>
        );
      })}

      <div style={{ height: "1px" }} ref={scrollTargetRef} />
    </Box>
  );
};

export default ChatMessages;
