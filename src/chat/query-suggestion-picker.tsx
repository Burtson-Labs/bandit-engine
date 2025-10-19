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

// Bandit Engine Watermark: BL-WM-5238-C1AF86
const __banditFingerprint_chat_querysuggestionpickertsx = 'BL-FP-4174A5-AFBE';
const __auditTrail_chat_querysuggestionpickertsx = 'BL-AU-MGOIKVV5-AD62';
// File: query-suggestion-picker.tsx | Path: src/chat/query-suggestion-picker.tsx | Hash: 5238afbe

import React, { useEffect, useRef, useState } from "react";
import { Box, useMediaQuery, Theme } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { generateConversationStarters } from "../services/prompts";
import {
  getRandomTopicOfInterest,
  QuestionPromptArgs,
} from "../prompts/getStableQuestionPrompt";
import { useModelStore } from "../store/modelStore";

interface QuerySuggestionPickerProps {
  onSend: (prompt: string, images: string[]) => void;
  inputHeight: number;
}

const markdownComponents: Components = {
  p: ({ node, ...props }) => <span {...props} />,
  mark: ({ node, children, ...props }) => (
    <mark {...props}>{children}</mark>
  ),
  code: ({ node, children, ...props }) => {
    const { inline, ...rest } = props as (typeof props) & { inline?: boolean };
    return inline ? <code {...rest}>{children}</code> : <code {...rest}>{children}</code>;
  },
};

export const QuerySuggestionPicker: React.FC<QuerySuggestionPickerProps> = ({
  onSend,
  inputHeight,
}) => {
  const hasGenerated = useRef(false);
  const [hasSentPrompt, setHasSentPrompt] = useState(false);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [visiblePrompts, setVisiblePrompts] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const { background, text, border, hoverBackground, hoverBorder } =
    theme.palette.chat.suggestion;
  
  const { getCurrentModel, isLoading } = useModelStore();

  useEffect(() => {
    if (hasGenerated.current || isLoading) return;
    hasGenerated.current = true;

    const currentModel = getCurrentModel();
    const args: QuestionPromptArgs = {
      // keep responses quick and snappy, server may be handling concurrent requests adjust as needed
      limit: 9,
      // pick a random topic of interest from the list, consider using the users preference topics dynamically, otherwise get a random one
      topicOfInterest: getRandomTopicOfInterest(),
      // Pass the current model's system prompt to tailor suggestions
      modelSystemPrompt: currentModel?.systemPrompt,
    };
    generateConversationStarters(args)
      .then((prompts) => {
        // Only set prompts if we have meaningful conversation starters
        if (prompts.length > 0) {
          setExamplePrompts(prompts);
          setVisiblePrompts(prompts.slice(0, 3));
        } else {
          // No meaningful conversation starters generated - don't show component
          setExamplePrompts([]);
          setVisiblePrompts([]);
          hasGenerated.current = false;
        }
      })
      .catch((error) => {
        // Error handling is already done in the generateConversationStarters function
        // Just ensure we don't render any prompts if generation fails
        setExamplePrompts([]);
        setVisiblePrompts([]);
        hasGenerated.current = false;
      });
  }, [getCurrentModel, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      hasGenerated.current = false;
    }
  }, [isLoading]);

  useEffect(() => {
    if (hasSentPrompt || examplePrompts.length === 0) return; // Don't shuffle if no prompts
    const interval = setInterval(() => {
      setExamplePrompts((prev) => {
        if (prev.length < 3) return prev; // Need at least 3 prompts to shuffle meaningfully
        const shuffled = [...prev].sort(() => 0.5 - Math.random());
        setVisiblePrompts((current) => [shuffled[0], current[1], current[2]]);
        setTimeout(() => {
          setVisiblePrompts((current) => [shuffled[0], shuffled[1], current[2]]);
        }, 400);
        setTimeout(() => {
          setVisiblePrompts(shuffled.slice(0, 3));
        }, 800);
        return shuffled;
      });
    }, 12000);
    return () => clearInterval(interval);
  }, [hasSentPrompt, examplePrompts.length]);

  const displayPrompts = isMobile
    ? visiblePrompts.slice(0, Math.min(visiblePrompts.length, 6))
    : visiblePrompts;

  return (
    displayPrompts.length > 0 && (
      <>
        <Box
          ref={scrollRef}
          sx={{
            zIndex: 1200,
            width: "100%",
            display: "flex",
            flexDirection: "row",
            gap: isMobile ? 0.8 : 1,
            px: isMobile ? 1.5 : 2,
            overflowX: isMobile ? "auto" : "visible",
            scrollSnapType: isMobile ? "x mandatory" : "none",
            WebkitOverflowScrolling: "touch",
            pb: isMobile ? 0.4 : 0,
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {displayPrompts.map((prompt, i) => (
            <Box
              key={`${i}-${prompt}`}
              sx={{
                px: isMobile ? 1.4 : 2,
                py: isMobile ? 1.2 : 2,
                flex: isMobile ? "0 0 85%" : 1,
                minWidth: isMobile ? "85%" : "auto",
                display: "flex",
                alignItems: "flex-start",
                gap: isMobile ? 0.9 : 1,
                backgroundColor: background,
                borderRadius: 2,
                fontSize: isMobile ? "0.875rem" : "0.9rem",
                color: text,
                userSelect: "none",
                cursor: "pointer",
                border: `1px solid ${border || alpha(text, 0.12)}`,
                boxShadow: theme.palette.mode === "dark"
                  ? "0 4px 18px rgba(0,0,0,0.25)"
                  : "0 6px 20px rgba(15,23,42,0.12)",
                scrollSnapAlign: isMobile ? "start" : "none",
                transition: "transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease",
                "&:hover": {
                  backgroundColor: hoverBackground,
                  borderColor: hoverBorder,
                  transform: "translateY(-2px)",
                  boxShadow: theme.palette.mode === "dark"
                    ? "0 6px 22px rgba(0,0,0,0.28)"
                    : "0 8px 24px rgba(15,23,42,0.14)",
                },
                "&:active": {
                  transform: "translateY(0) scale(0.98)",
                },
              }}
              onClick={() => {
                onSend(prompt, []);
                setHasSentPrompt(true);
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  lineHeight: 1.4,
                  fontWeight: isMobile ? 500 : 400,
                  textAlign: isMobile ? "left" : "center",
                  ...(isMobile && { hyphens: "auto", wordBreak: "break-word" }),
                  '& code': {
                    borderRadius: 4,
                    fontSize: "0.92em",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.common.white, 0.06)
                        : alpha(theme.palette.text.primary, 0.06),
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.15)}`,
                    padding: "0.15em 0.35em",
                  },
                  '& mark': {
                    display: "inline-block",
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.common.white, 0.06)
                        : alpha(theme.palette.text.primary, 0.12),
                    color: theme.palette.mode === "dark"
                      ? theme.palette.common.white
                      : theme.palette.text.primary,
                    borderRadius: 4,
                    padding: "0.1em 0.25em",
                  },
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents}
                >
                  {prompt}
                </ReactMarkdown>
              </Box>
            </Box>
          ))}
        </Box>
      </>
    )
  );
};
