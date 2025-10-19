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

// Bandit Engine Watermark: BL-WM-02BB-817687
const __banditFingerprint_chatmodal_airesponsetextfieldtsx = 'BL-FP-5F1C0D-1D01';
const __auditTrail_chatmodal_airesponsetextfieldtsx = 'BL-AU-MGOIKVVM-OZSJ';
// File: ai-response-text-field.tsx | Path: src/modals/chat-modal/ai-response-text-field.tsx | Hash: 02bb1d01

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DocumentCard from "../../shared/DocumentCard";
import KnowledgeFileModal from "../../modals/knowlege/knowledge-file-modal";
import { KnowledgeDoc } from "../../store/knowledgeStore";
import { useKnowledgeStore } from "../../chat/hooks/useKnowledgeStore";
import { useTheme, alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import ReactMarkdown, { type Components as ReactMarkdownComponents, type ExtraProps as ReactMarkdownExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { debugLogger } from "../../services/logging/debugLogger";
import {
  Avatar,
  Box,
  IconButton,
  Modal,
  Tooltip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useModelStore } from "../../store/modelStore";
import type { Element, Text, Root } from "hast";
import { getHighlightTree } from "../../utils/lowlight";
import { markdownSanitizeSchema, renderLowlightChildren } from "../../utils/markdownRendering";
const brainIcon = "https://cdn.burtson.ai/images/brain-icon.png";

const avatarFilenames: Record<string, string> = {
  "Bandit-Core": "core-avatar.png",
  "Bandit-Muse": "muse-avatar.png",
  "Bandit-Logic": "logic-avatar.png",
  "Bandit-D1VA": "d1va-avatar.png",
  "Bandit-Exec": "exec-avatar.png",
  "default": "bandit-head.png",
};

const banditHead = `https://cdn.burtson.ai/images/bandit-head.png`;
import AiResponseActionsBar from "./ai-response-action-bar";
import brandingService from "../../services/branding/brandingService";


const resolveAvatar = (selectedModel: string): string => {
  const model = useModelStore.getState().availableModels.find(
    (m) => m.name === selectedModel
  );
  if (model?.avatarBase64) {
    return model.avatarBase64;
  }
  
  const avatarFilename = avatarFilenames[selectedModel] || avatarFilenames["default"];
  return `https://cdn.burtson.ai/avatars/${avatarFilename}`;
};

interface AIResponseTextFieldProps {
  question: string;
  response: string | React.ReactNode;
  responseText?: string; // raw markdown/text used for actions bar (feedback/tts/copy)
  images?: string[];
  backgroundColor?: string;
  memoryUpdated?: boolean;
  sourceFiles?: SourceFileInput[];
  isMobile?: boolean;
  cancelled?: boolean;
}

const normalizeTables = (markdown: string): string => {
  const lines = markdown.split("\n");
  const output: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;

    const maxCols = Math.max(...tableRows.map((r) => r.length));
    const padded = tableRows.map((row) => {
      return [...row, ...Array(maxCols - row.length).fill("")];
    });

    const header = padded[0];
    const separator = Array(maxCols).fill("---");

    output.push("| " + header.join(" | ") + " |");
    output.push("| " + separator.join(" | ") + " |");
    for (let i = 1; i < padded.length; i++) {
      const row = padded[i];
      // Skip rows that are just separators (all dashes)
      if (row.every((cell) => /^-+$/.test(cell))) continue;
      output.push("| " + row.join(" | ") + " |");
    }

    tableRows = [];
    inTable = false;
  };

  for (const line of lines) {
    if (/^\s*\|.*\|\s*$/.test(line)) {
      inTable = true;
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
    } else {
      if (inTable) flushTable();
      output.push(line);
    }
  }

  flushTable();
  return output.join("\n");
};

type ChatResponsePalette = {
  codeBackground?: string;
  codeText?: string;
  aiBackground?: string;
  aiText?: string;
  aiBorder?: string;
};

type VectorResultLike = {
  id?: string;
  fileId?: string;
  _id?: string;
  [key: string]: unknown;
};

type KnowledgeDocCandidate = Partial<KnowledgeDoc> & {
  fileId?: string;
  _id?: string;
  filename?: string;
  uploadedAt?: string | Date;
  createdAt?: string | Date;
  mimeType?: string;
  content?: string | null;
  rawData?: string;
  embedding?: unknown;
  size?: number;
  uploadedBy?: string;
  userId?: string;
  userEmail?: string;
  bucket?: string;
  key?: string;
  s3Url?: string;
  teamSid?: string;
  contentSource?: "team" | "user";
  isUserContent?: boolean;
  isTeamContent?: boolean;
  _vectorResult?: VectorResultLike | null;
  metadata?: VectorResultLike | null;
  chunks?: string[];
  [key: string]: unknown;
};

type SourceFileInput = KnowledgeDocCandidate;

type MarkdownComponentProps<Tag extends keyof JSX.IntrinsicElements> =
  React.ComponentPropsWithoutRef<Tag> & ReactMarkdownExtraProps;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toDateSafe = (value: unknown): Date | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return undefined;
};

const toNumberArray = (value: unknown): number[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const numbers = value.filter((item): item is number => typeof item === "number" && Number.isFinite(item));
  return numbers.length ? numbers : undefined;
};

interface MarkdownCodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  theme: Theme;
  chatResponse?: ChatResponsePalette;
}

const MarkdownCodeBlock: React.FC<MarkdownCodeBlockProps> = ({
  inline,
  className,
  children,
  theme,
  chatResponse,
  ...props
}) => {
  const match = /language-([\w-]+)/.exec(className || "");
  const requestedLanguage = match?.[1]?.toLowerCase() || "";
  const codeText = String(children).replace(/\n$/, "");
  const isProbablyBlock = codeText.includes("\n") || Boolean(requestedLanguage);

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightTree = useMemo<Root | null>(
    () =>
      isProbablyBlock ? getHighlightTree(codeText, requestedLanguage) : null,
    [codeText, requestedLanguage, isProbablyBlock]
  );
  const highlightedNodes = useMemo(
    () =>
      isProbablyBlock
        ? renderLowlightChildren(
            (highlightTree?.children || []).filter((node): node is Element | Text => {
              if (!node) {
                return false;
              }
              return node.type === "element" || node.type === "text";
            }),
            `hl-${requestedLanguage || "auto"}`
          )
        : [],
    [highlightTree, requestedLanguage, isProbablyBlock]
  );

  const resolvedLanguage = (
    requestedLanguage ||
    highlightTree?.data?.language ||
    "code"
  ).toString();
  const languageLabel = resolvedLanguage.toUpperCase();
  const languageClass = resolvedLanguage.toLowerCase();

  const highlightColors =
    theme.palette.mode === "dark"
      ? {
          background: chatResponse?.codeBackground || "#0f172a",
          text: chatResponse?.codeText || "#e2e8f0",
          keyword: "#c792ea",
          string: "#7fdbca",
          number: "#f78c6c",
          comment: "#64748b",
          function: "#82aaff",
          variable: "#f07178",
        }
      : {
          background: chatResponse?.codeBackground || "#f4f6ff",
          text: chatResponse?.codeText || "#1e293b",
          keyword: "#7c3aed",
          string: "#0f766e",
          number: "#b45309",
          comment: "#6b7280",
          function: "#2563eb",
          variable: "#d97706",
        };

  if (!isProbablyBlock) {
    return (
      <code
        style={{
          borderRadius: "4px",
          fontSize: "0.9em",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: "4px",
        overflow: "auto",
        my: "0.5rem",
        px: 0,
        py: 0,
        mt: 1,
        mb: 0.5,
        fontSize: "0.9rem",
        position: "relative",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor:
            chatResponse?.aiBackground ||
            (theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.04)
              : alpha(theme.palette.text.primary, 0.04)),
          color: chatResponse?.aiText || theme.palette.text.secondary,
          fontSize: "0.75rem",
          borderBottom: `1px solid ${
            chatResponse?.aiBorder || alpha(theme.palette.text.primary, 0.1)
          }`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "inherit",
        }}
      >
        <span>{languageLabel}</span>
        <Tooltip title={copied ? "Copied!" : "Copy"} arrow>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              color: copied
                ? theme.palette.success.main
                : theme.palette.text.secondary,
              "&:hover": { color: theme.palette.text.primary },
              padding: "4px",
            }}
          >
            {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          overflowX: "auto",
          maxWidth: "100%",
          "& .hljs": {
            display: "block",
            overflowX: "auto",
            padding: "16px",
            margin: 0,
            backgroundColor: highlightColors.background,
            color: highlightColors.text,
            fontSize: "0.9rem",
          },
          "& .hljs-comment, & .hljs-quote": {
            color: highlightColors.comment,
            fontStyle: "italic",
          },
          "& .hljs-keyword, & .hljs-selector-tag, & .hljs-literal, & .hljs-built_in": {
            color: highlightColors.keyword,
          },
          "& .hljs-string, & .hljs-doctag, & .hljs-template-tag, & .hljs-attr": {
            color: highlightColors.string,
          },
          "& .hljs-number, & .hljs-symbol, & .hljs-bullet, & .hljs-meta": {
            color: highlightColors.number,
          },
          "& .hljs-title, & .hljs-section, & .hljs-selector-id, & .hljs-function": {
            color: highlightColors.function,
          },
          "& .hljs-variable, & .hljs-params, & .hljs-property": {
            color: highlightColors.variable,
          },
        }}
      >
        <pre className={`hljs language-${languageClass}`} {...props}>
          <code className="hljs">{highlightedNodes}</code>
        </pre>
      </Box>
    </Box>
  );
};

const AIResponseTextField: React.FC<AIResponseTextFieldProps> = ({
  question,
  response,
  responseText,
  backgroundColor,
  images,
  memoryUpdated,
  sourceFiles,
  isMobile = false,
  cancelled = false,
}) => {
  // Warn if response is not a string, to help debug [object Object] issues
  useEffect(() => {
    if (typeof response !== "string" && !React.isValidElement(response)) {
      debugLogger.warn("⚠️ AIResponseTextField received a non-string, non-ReactElement response:", { response });
    }
  }, [response]);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [showMemoryUpdated, setShowMemoryUpdated] = useState(memoryUpdated ?? false);
  const [openDoc, setOpenDoc] = useState<KnowledgeDoc | null>(null);
  const { isVectorDocument } = useKnowledgeStore();

  // Convert API response format to KnowledgeDoc format (same as KnowledgeTab)
  const normalizeSourceFiles = useCallback((files: SourceFileInput[]): KnowledgeDoc[] => {
    return files
      .map((file) => {
        const vectorResult = file._vectorResult ?? undefined;
        const metadata = file.metadata ?? undefined;

        const candidateId =
          [
            file.id,
            file.fileId,
            file._id,
            vectorResult?.id,
            vectorResult?.fileId,
            vectorResult?._id,
            metadata?.id,
            metadata?.fileId,
            metadata?._id,
          ].find(isNonEmptyString) ?? null;

        if (!candidateId) {
          debugLogger.error("Missing document identifier in AI response file", {
            file,
            availableProperties: Object.keys(file),
            vectorResultProperties: vectorResult ? Object.keys(vectorResult) : undefined,
          });
          return null;
        }

        const resolvedId = candidateId;
        const filename =
          (isNonEmptyString(file.name) && file.name) ||
          (isNonEmptyString(file.filename) && file.filename) ||
          "Unknown Document";
        const timestamp = file.uploadedAt ?? file.createdAt;
        const addedDate = toDateSafe(timestamp) ?? new Date();
        const mimeType =
          (isNonEmptyString(file.mimeType) && file.mimeType) ||
          (isNonEmptyString(file.type) && file.type) ||
          "application/pdf";
        const contentValue = typeof file.content === "string" ? file.content : "";
        const hasInlineContent = contentValue.trim().length > 0;
        const looksLikeMongoId = /^[0-9a-f]{24}$/i.test(resolvedId);
        const isFromVectorDB =
          Boolean(file._vectorResult) ||
          isNonEmptyString(file.s3Url) ||
          (looksLikeMongoId && !hasInlineContent);

        debugLogger.debug("Normalizing AI response source file", {
          docId: resolvedId,
          filename,
          isFromVectorDB,
          hasContent: hasInlineContent,
        });

        const embedding = toNumberArray(file.embedding) ?? [];
        const rawData = typeof file.rawData === "string" ? file.rawData : undefined;
        const size = typeof file.size === "number" && Number.isFinite(file.size) ? file.size : 0;
        const uploadedBy =
          (isNonEmptyString(file.uploadedBy) && file.uploadedBy) ||
          (isNonEmptyString(file.userId) && file.userId) ||
          "";
        const userEmail = (isNonEmptyString(file.userEmail) && file.userEmail) || "";
        const bucket = (isNonEmptyString(file.bucket) && file.bucket) || "";
        const key = (isNonEmptyString(file.key) && file.key) || resolvedId;
        const teamSid = (isNonEmptyString(file.teamSid) && file.teamSid) || undefined;
        const explicitContentSource =
          file.contentSource === "team" || file.contentSource === "user" ? file.contentSource : undefined;
        const contentSource = explicitContentSource ?? (teamSid ? "team" : "user");
        const isTeamContent = file.isTeamContent ?? contentSource === "team";
        const isUserContent = file.isUserContent ?? contentSource === "user";
        const resolvedS3Url =
          (isNonEmptyString(file.s3Url) && file.s3Url) ||
          (isFromVectorDB ? resolvedId : undefined);

        const normalizedDoc: KnowledgeDoc = {
          id: resolvedId,
          name: filename,
          content: isFromVectorDB ? "" : contentValue,
          rawData,
          type: mimeType,
          addedDate,
          embedding,
          size,
          uploadedBy,
          userEmail,
          bucket,
          key,
          isUserContent,
          isTeamContent,
          contentSource,
          teamSid,
          mimeType,
          originalFileName: filename,
          s3Url: resolvedS3Url,
        };

        return normalizedDoc;
      })
      .filter((doc): doc is KnowledgeDoc => doc !== null);
  }, []);

  // Normalize the source files
  const normalizedSourceFiles = useMemo(
    () => (sourceFiles ? normalizeSourceFiles(sourceFiles) : []),
    [sourceFiles, normalizeSourceFiles]
  );

  const sourceCacheRef = useRef<KnowledgeDoc[]>([]);

  const displaySourceFiles = useMemo(() => {
    if (normalizedSourceFiles.length > 0) {
      sourceCacheRef.current = normalizedSourceFiles;
      return normalizedSourceFiles;
    }

    if (sourceFiles === undefined) {
      return sourceCacheRef.current;
    }

    sourceCacheRef.current = [];
    return [];
  }, [normalizedSourceFiles, sourceFiles]);

  const sourcesMarkdownList = displaySourceFiles.map((doc, index) => `- ${index + 1}. ${doc.name}`);

  // Debug logging
  useEffect(() => {
    if (sourceFiles && sourceFiles.length > 0) {
      debugLogger.debug("AI response source files normalization", {
        sourceFileCount: sourceFiles.length,
        normalizedFileCount: normalizedSourceFiles.length,
      });
    }
  }, [sourceFiles, normalizedSourceFiles]);

  useEffect(() => {
    if (!memoryUpdated) return;
    setShowMemoryUpdated(true);
    const timeout = setTimeout(() => setShowMemoryUpdated(false), 3000);
    return () => clearTimeout(timeout);
  }, [memoryUpdated]);

  const selectedModel = useModelStore((state) => state.selectedModel);


  const [userAvatar, setUserAvatar] = useState<string>(banditHead);
  useEffect(() => {
    const fetchBranding = async () => {
      const branding = await brandingService.getBranding();
      setUserAvatar(branding?.logoBase64 || banditHead);
    };
    fetchBranding();
  }, []);

  const theme = useTheme();
  const chatResponse = theme.palette.chat?.response as NonNullable<typeof theme.palette.chat>["response"];
  
  // Choose syntax highlighting theme based on current theme mode

  const sanitizeMarkdown = (raw: string): string => {
    // Strip start/end of turn tags, including malformed or alternate versions
    let sanitized = raw.replace(/<[/]?start_of_turn>|<[/]?end[_]?of[_]?turn>/gi, "");

    // 1) Unwrap any stray <div class="MuiBox-root"> wrappers
    sanitized = sanitized
      .replace(/<div class="MuiBox-root[^"]*"[^>]*>([\s\S]*?)<\/div>/g, (_, inner) =>
        inner.trim()
      )
      .replace(/<div[^>]*>\s*<\/div>/g, "");

    // Collapse newline before colon or comma into inline punctuation
    sanitized = sanitized.replace(/\r?\n\s*:\s*/g, ": ");
    sanitized = sanitized.replace(/\r?\n\s*,\s*/g, ", ");

    // 2) Normalize all pipe‑tables in one go
    sanitized = normalizeTables(sanitized);

    return sanitized;
  };

  const enrichedMarkdown = useMemo(() => {
    if (typeof response !== "string") {
      return null;
    }

    const sanitized = sanitizeMarkdown(response);

    if (!sourcesMarkdownList.length) {
      return sanitized;
    }

    if (/\*\*Sources?\*\*/i.test(sanitized)) {
      return sanitized;
    }

    return `${sanitized}\n\n**Sources**\n${sourcesMarkdownList.join("\n")}`;
  }, [response, sourcesMarkdownList]);

  const components: ReactMarkdownComponents = {
    mark({ children, node: _node, className, style, ...markProps }: MarkdownComponentProps<"mark">) {
      const contentText = React.Children.toArray(children)
        .map((child) => (typeof child === "string" ? child : ""))
        .join("")
        .trim();

      return (
        <Box
          component="span"
          className={className}
          style={style}
          {...markProps}
          sx={{
            display: "inline-block",
            backgroundColor: "#2a3c4f",
            color: "#e0f7fa",
            px: 1,
            py: 0.25,
            borderRadius: "4px",
            fontWeight: 500,
            fontSize: "0.95rem",
            lineHeight: 1.4,
            whiteSpace: "normal",
            width: "fit-content",
            maxWidth: "100%",
          }}
        >
          {contentText}
        </Box>
      );
    },
    code({ inline, className, children, node: _node, ...codeProps }: MarkdownComponentProps<"code">) {
      return (
        <MarkdownCodeBlock
          inline={inline}
          className={className}
          {...codeProps}
          theme={theme}
          chatResponse={chatResponse}
        >
          {children}
        </MarkdownCodeBlock>
      );
    },
    a({ href, children, node: _node, style, ...anchorProps }: MarkdownComponentProps<"a">) {
      return (
        <a
          href={href}
          {...anchorProps}
          style={{
            color: theme.palette.primary.main,
            textDecoration: "underline",
            ...(style ?? {}),
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
    em({ children, node: _node, className, style, ...emProps }: MarkdownComponentProps<"em">) {
      // Check for Bandit's weird <em><div class="MuiBox-root">CODE</div></em>
      const onlyChild =
        Array.isArray(children) && children.length === 1 ? children[0] : null;

      if (
        onlyChild &&
        typeof onlyChild === "object" &&
        onlyChild.type === "div" &&
        onlyChild.props?.className?.includes("MuiBox-root")
      ) {
        const inner = onlyChild.props.children;

        // Optional: skip rendering if it's literally the word "CODE"
        if (typeof inner === "string" && inner.trim().toUpperCase() === "CODE") {
          return null;
        }

        // Otherwise render nicely
      return (
        <Box
          sx={{
            fontFamily: "monospace",
            fontSize: "0.9rem",
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            padding: "12px 16px",
            borderRadius: "4px",
            border: `1px solid ${theme.palette.divider}`,
            my: 1,
            display: "inline-block",
          }}
        >
          {inner}
        </Box>
      );
      }

      return (
        <em className={className} style={style} {...emProps}>
          {children}
        </em>
      );
    },
    ol({ children, node: _node, style, ...orderedListProps }: MarkdownComponentProps<"ol">) {
      const childArray = React.Children.toArray(children);
      const cleanedChildren: React.ReactNode[] = [];

      for (let i = 0; i < childArray.length; i++) {
        const item = childArray[i];

        // Remove raw colon-only text lines
        if (typeof item === "string" && item.trim() === ":") {
          continue;
        }

        // If colon-prefixed string explanation
        if (typeof item === "string" && item.trim().startsWith(":")) {
          cleanedChildren.push(
            <Typography
              key={`ol-expl-${i}`}
              sx={{
                fontSize: "0.875rem",
                color: "#aaa",
                fontStyle: "italic",
                mt: 0.5,
                ml: 2,
              }}
            >
              {item.replace(/^:\s*/, "")}
            </Typography>
          );
        } else {
          cleanedChildren.push(item);
        }
      }

      return (
        <ol
          {...orderedListProps}
          style={{
            paddingLeft: 24,
            marginLeft: 16,
            listStyleType: "decimal",
            ...(style ?? {}),
          }}
        >
          {cleanedChildren}
        </ol>
      );
    },

    ul({ children, node: _node, style, ...unorderedListProps }: MarkdownComponentProps<"ul">) {
      return (
        <ul
          {...unorderedListProps}
          style={{
            paddingLeft: "1.5rem",
            marginTop: "0.5rem",
            marginBottom: "0.25rem",
            listStyle: "disc",
            ...(style ?? {}),
          }}
        >
          {React.Children.toArray(children).filter((child) => {
            if (typeof child === "string" && child.trim() === ":") return false;
            return true;
          })}
        </ul>
      );
    },
    li({ children, node: _node, style, ...listItemProps }: MarkdownComponentProps<"li">) {
      const childArray = React.Children.toArray(children);
      // New logic: If first child is <strong> whose text ends with a colon, and rest is inline/plain
      if (
        childArray.length >= 2 &&
        React.isValidElement(childArray[0]) &&
        childArray[0].type === "strong"
      ) {
        // Extract label text from <strong>
        let labelText = "";
        const strongChild = childArray[0];
        if (typeof strongChild.props.children === "string") {
          labelText = strongChild.props.children;
        } else if (Array.isArray(strongChild.props.children)) {
          labelText = strongChild.props.children.join("");
        }
        // Replace [object Object] with "Item"
        if (labelText?.includes("[object Object]")) {
          labelText = "Item";
        }
        if (typeof labelText === "string" && labelText.trim().endsWith(":")) {
          // Check if all rest are inline/plain (no Box)
          const rest = childArray.slice(1);
          const isAllInline = rest.every(
            (el) =>
              typeof el === "string" ||
              (React.isValidElement(el) &&
                // allow inline tags, but not <Box>
                el.type !== Box)
          );
          if (isAllInline) {
            // Remove trailing colon from label for rendering
            const displayLabel = labelText.replace(/:\s*$/, "");
            return (
              <li
                style={{
                  marginBottom: "0.5rem",
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                  ...(style ?? {}),
                }}
                {...listItemProps}
              >
                <strong>{displayLabel}:</strong>
                {rest.length > 0 && <> {rest}</>}
              </li>
            );
          }
        }
      }
      // Special-case: <strong>Label:</strong> followed by a Box description
      if (
        childArray.length === 2 &&
        React.isValidElement(childArray[0]) &&
        childArray[0].type === "strong" &&
        React.isValidElement(childArray[1]) &&
        childArray[1].type === Box
      ) {
        const label = childArray[0].props.children;
        const desc = childArray[1].props.children;
        return (
          <li
            style={{ marginBottom: "0.5rem", lineHeight: 1.4, whiteSpace: "pre-wrap" }}
            {...listItemProps}
          >
            <span>
              <strong>{label}</strong> {desc}
            </span>
          </li>
        );
      }
      const contentArray = childArray;
      const filtered: React.ReactNode[] = [];

      for (let i = 0; i < contentArray.length; i++) {
        const item = contentArray[i];

        if (typeof item === "string" && item.trim() === ":") continue;

        // Safer merge: use prev variable and check before merge
        if (i > 0 && typeof item === "string" && item.trim().startsWith(":")) {
          const prev = contentArray[i - 1];
          if (React.isValidElement(prev) && prev.type === "strong") {
            const desc = item.replace(/^:\s*/, "");
            const prevKey = React.isValidElement(prev) && prev.key != null ? prev.key : `li-strong-${i}`;
            filtered.pop();
            filtered.push(
              <span key={`li-merge-${prevKey}`}>
                {prev}
                {": "}
                {desc}
              </span>
            );
            continue;
          }
        }
        filtered.push(item);
      }

      return (
        <li
          {...listItemProps}
          style={{
            marginBottom: "0.5rem",
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
            ...(style ?? {}),
          }}
        >
          {filtered}
        </li>
      );
    },
    table({ children, node: _node, className, style, ...tableProps }: MarkdownComponentProps<"table">) {
      return (
        <TableContainer
          component={Paper}
          className={className}
          style={style}
          sx={{ my: 2, bgcolor: theme.palette.background.paper }}
        >
          <Table size="small" {...tableProps}>
            {children}
          </Table>
        </TableContainer>
      );
    },
    thead({ children, node: _node, ...tableHeadProps }: MarkdownComponentProps<"thead">) {
      return <TableHead {...tableHeadProps}>{children}</TableHead>;
    },
    tbody({ children, node: _node, ...tableBodyProps }: MarkdownComponentProps<"tbody">) {
      const rows = React.Children.toArray(children).filter((row: React.ReactNode) => {
        // Keep non-React elements
        if (!React.isValidElement(row)) return true;
        // Extract cell elements for this row
        const cells = React.Children.toArray(row.props.children);
        // Filter out rows where every cell is a string of hyphens
        return !cells.every(
          (cell) =>
            React.isValidElement(cell) &&
            typeof cell.props.children === "string" &&
            /^-+$/.test(cell.props.children.trim())
        );
      });
      return <TableBody {...tableBodyProps}>{rows}</TableBody>;
    },
    tr({ children, node: _node, ...tableRowProps }: MarkdownComponentProps<"tr">) {
      return <TableRow {...tableRowProps}>{children}</TableRow>;
    },
    th({ children, node: _node, ...tableCellProps }: MarkdownComponentProps<"th">) {
      return (
        <TableCell
          {...tableCellProps}
          sx={{
            fontWeight: "bold",
            color: theme.palette.text.primary,
            bgcolor: theme.palette.action.hover,
            textAlign: "left",
            padding: "8px 12px",
            whiteSpace: "nowrap",
          }}
        >
          {children}
        </TableCell>
      );
    },
    td({ children, node: _node, ...tableCellProps }: MarkdownComponentProps<"td">) {
      return (
        <TableCell
          {...tableCellProps}
          sx={{
            color: theme.palette.text.primary,
            fontSize: "0.875rem",
            padding: "8px 12px",
            verticalAlign: "top",
          }}
        >
          {children}
        </TableCell>
      );
    },
    p({ children, node: _node, className, style, ...paragraphProps }: MarkdownComponentProps<"p">) {
      // Flatten children and detect block-level elements
      const flattened = React.Children.toArray(children).flat();
      const hasBlock = flattened.some(
        (child) =>
          typeof child === "object" &&
          child !== null &&
          "type" in child &&
          typeof child.type === "string" &&
          ["div", "Box", "section", "ul", "ol", "table"].includes(child.type)
      );
      // If a block element is present, render without wrapping
      if (hasBlock) {
        return <>{flattened}</>;
      }
      // Otherwise wrap inline text in a div
      return (
        <Box component="div" sx={{ margin: "0.25rem 0" }}>
          <Typography
            component="div"
            variant="body2"
            className={className}
            style={style}
            sx={{ color: theme.palette.text.primary, lineHeight: 1.6, display: "inline" }}
            {...paragraphProps}
          >
            {flattened}
          </Typography>
        </Box>
      );
    },
  };

  return (
    <>
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          flexGrow: 1,
          alignSelf: 'stretch',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: chatResponse.containerBackground,
          color: chatResponse.aiText || "#fff",
          p: isMobile ? 1 : 2,
          borderRadius: "4px",
          userSelect: "text",
          border: "1px solid " + (chatResponse.aiBorder || "#ccc"),
          boxShadow: "0 0 6px rgba(0,0,0,0.3)",
        }}
      >
        {/* User message bubble, right-aligned on desktop */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: {
              xs: "flex-start",
              sm: "flex-end",
            },
            gap: 2,
            mb: 2,
            justifyContent: "flex-end",
          }}
        >
          {/* User avatar and caption - now at the top */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              alt="You"
              src={userAvatar}
              sx={{
                display: { xs: "none", sm: "flex" },
                width: { sm: 72 },
                height: { sm: 72 },
                bgcolor: chatResponse.userAvatarBackground || (theme.palette.mode === "dark" ? "transparent" : "#eee"),
                color: "#fff",
                fontWeight: "bold",
                fontSize: { sm: "1.1rem" },
                border: "2px solid #a78bfa",
                boxShadow: "0 0 8px rgba(167, 139, 250, 0.3)",
                transform: "scaleX(1)",
              }}
            ></Avatar>
            <Typography
              variant="caption"
              sx={{ color: chatResponse.modelLabel || "#888", mt: 1, fontStyle: "italic" }}
            >
              You said
            </Typography>
          </Box>
          {/* Message bubble */}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: "inline-block",
                textAlign: "left",
                bgcolor: chatResponse.userBubble || "#1f1f1f",
                borderRadius: "4px",
                px: isMobile ? 1 : 2,
                py: 1.5,
                width: isMobile ? "100%" : "fit-content",
                maxWidth: "100%",
                border: "1px solid " + (chatResponse.aiBorder || "#444"),
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                mt: { xs: 0.5, sm: 0.25 },
              }}
            >
              <Typography
                sx={{
                  color: chatResponse.userText || "#6C9AC5",
                  fontStyle: "italic",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {question}
              </Typography>
            </Box>
            {/* Images, if any */}
            {images && images.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                {images.map((img, i) => (
                  <Avatar
                    key={i}
                    src={img}
                    variant="rounded"
                    onClick={() => setOpenImage(img)}
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      cursor: "pointer",
                      "&:hover": { boxShadow: `0 0 0 2px ${theme.palette.primary.main}` },
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, my: 2 }} />

        {/* AI avatar and response bubble, left-aligned like a chat bubble */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: {
              xs: "center",
              sm: "flex-start",
            },
            gap: 2,
            mb: 2,
          }}
        >
          {/* AI avatar above the message bubble */}
          {typeof response === "string" && response.trim() !== "" && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mr: 2,
                position: "relative",
              }}
            >
              <Avatar
                src={resolveAvatar(selectedModel)}
                alt={selectedModel}
                sx={{
                  display: { xs: "none", sm: "flex" },
                  width: 72,
                  height: 72,
                  border: "1px solid #888",
                  boxShadow: "0 0 6px rgba(136, 136, 136, 0.4)",
                  filter: "brightness(1.6)",
                }}
              />
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography
                  variant="caption"
                  sx={{ color: chatResponse.modelLabel || "#888", mt: 1, fontStyle: "italic" }}
                >
                  {selectedModel} says
                </Typography>
              </Box>
            </Box>
          )}
          {/* Model name above AI response bubble (mobile only) */}
          <Box
            sx={{
              display: { xs: "flex", sm: "none" },
              justifyContent: "right",
              width: "100%",
              mt: -1,
              mb: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontStyle: "italic", color: chatResponse.modelLabel || "#888" }}
            >
              {selectedModel} says
            </Typography>
          </Box>
          {/* AI chat bubble and memory update indicator wrapper */}
          <Box sx={{ position: "relative", width: "100%" }}>
            {cancelled && (
              <Box
                sx={{
                  position: "absolute",
                  top: -24,
                  left: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  pl: 1,
                  zIndex: 1,
                }}
              >
                <Typography variant="caption" sx={{ fontStyle: "italic", opacity: 0.85 }}>
                  Cancelled by you
                </Typography>
              </Box>
            )}
            {showMemoryUpdated && (
              <Box
                sx={{
                  position: "absolute",
                  top: -24,
                  right: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  pr: 1,
                  animation: "fadeOut 0.3s ease-in 2.7s forwards",
                  zIndex: 1,
                }}
              >
                <img
                  src={brainIcon}
                  alt="Memory"
                  style={{ width: 18, height: 18 }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: chatResponse.memoryText || "#2e7d32", fontStyle: "italic" }}
                >
                  Bandit added to memory
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                bgcolor: chatResponse.aiBubble ?? "#2f2f2f",
                borderRadius: "4px",
                px: isMobile ? 1 : 1.5, // Reduced padding on mobile
                py: 1.25,
                width: "100%",
                maxWidth: isMobile ? "100%" : "768px", // Full width on mobile
                border: "1px solid " + (chatResponse.aiBorder || "#ccc"),
                wordBreak: "break-word",
                alignSelf: "flex-start",
                mt: { xs: 0.5, sm: 0.25 },
              }}
            >
              <Box sx={{ width: '100%', maxWidth: '100%' }}>
                {typeof response === "string" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
                    components={components}
                  >
                    {enrichedMarkdown ?? sanitizeMarkdown(response)}
                  </ReactMarkdown>
                ) : React.isValidElement(response) ? (
                  response
                ) : (
                  <Typography color="error">⚠️ Invalid AI response</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
        {/* Actions bar at the bottom */}
        {!!(responseText || (typeof response === "string" && response)) && (
          <AiResponseActionsBar text={(responseText || (response as string)) as string} />
        )}
        {displaySourceFiles && displaySourceFiles.length > 0 && (
          <Box sx={{ mt: 1.5, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "flex-start" }}>
            {displaySourceFiles.map((doc, idx) => {
              debugLogger.debug("Rendering DocumentCard in AI response", {
                index: idx,
                id: doc.id,
                name: doc.name,
              });
              return (
                <DocumentCard 
                  key={idx} 
                  doc={doc} 
                  onView={() => setOpenDoc(doc)}
                  variant="mini"
                  isHistoricalReference={true}
                  allowErrorStates={true}
                />
              );
            })}
          </Box>
        )}
      </Box>

      {/* Fullscreen image preview modal */}
      <Modal open={!!openImage} onClose={() => setOpenImage(null)}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            bgcolor: "rgba(0, 0, 0, 0.9)",
            p: 2,
            position: "relative",
          }}
        >
          <IconButton
            onClick={() => setOpenImage(null)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.6)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={openImage || ""}
            alt="Full-size"
            sx={{
              maxHeight: "90vh",
              maxWidth: "90vw",
              borderRadius: 2,
              boxShadow: 24,
              cursor: "zoom-out",
            }}
            onClick={() => setOpenImage(null)}
          />
        </Box>
      </Modal>
      <KnowledgeFileModal 
        open={!!openDoc} 
        onClose={() => setOpenDoc(null)} 
        doc={openDoc} 
        isVectorDocument={openDoc ? (() => {
          const isVector = isVectorDocument(openDoc);
          debugLogger.debug("Knowledge file modal open request", {
            documentId: openDoc.id,
            name: openDoc.name,
            isVector,
          });
          return isVector;
        })() : false}
      />
    </>
  );
};

export default AIResponseTextField;
