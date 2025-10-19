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

// Bandit Engine Watermark: BL-WM-4F0E-E71F75
const __banditFingerprint_components_StreamingMarkdowntsx = 'BL-FP-BB12E1-3387';
const __auditTrail_components_StreamingMarkdowntsx = 'BL-AU-MGOIKVV9-FMED';
// File: StreamingMarkdown.tsx | Path: src/components/StreamingMarkdown.tsx | Hash: 4f0e3387

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useTheme, alpha } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { Element, Text, Root } from "hast";
import type { Components } from "react-markdown";
import type { CodeProps } from "react-markdown/lib/ast-to-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { getHighlightTree } from "../utils/lowlight";
import { markdownSanitizeSchema, renderLowlightChildren } from "../utils/markdownRendering";

interface SourceSummary {
  id: string;
  name: string;
}

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
  sources?: SourceSummary[];
}

const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({
  content,
  isStreaming = false,
  sources,
}) => {
  const theme = useTheme();
  const showCursor = isStreaming && content.trim().length > 0;
  const showLoader = isStreaming && content.trim().length === 0; // Show loader when streaming but no content yet
  const prevSanitizedRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stableSourcesRef = useRef<SourceSummary[]>([]);

  const effectiveSources = useMemo(() => {
    if (Array.isArray(sources) && sources.length > 0) {
      stableSourcesRef.current = sources;
      return sources;
    }

    if (sources === undefined) {
      return stableSourcesRef.current;
    }

    stableSourcesRef.current = [];
    return [];
  }, [sources]);

  const normalizeTables = (markdown: string): string => {
    const lines = markdown.split("\n");
    const output: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length === 0) return;
      const maxCols = Math.max(...tableRows.map((r) => r.length));
      const padded = tableRows.map((row) => [...row, ...Array(maxCols - row.length).fill("")]);
      const header = padded[0];
      const separator = Array(maxCols).fill("---");
      output.push("| " + header.join(" | ") + " |");
      output.push("| " + separator.join(" | ") + " |");
      for (let i = 1; i < padded.length; i++) {
        const row = padded[i];
        if (row.every((cell) => /^-+$/.test(cell))) continue;
        output.push("| " + row.join(" | ") + " |");
      }
      tableRows = [];
      inTable = false;
    };

    for (const line of lines) {
      if (/^\s*\|.*\|\s*$/.test(line)) {
        inTable = true;
        const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
        tableRows.push(cells);
      } else {
        if (inTable) flushTable();
        output.push(line);
      }
    }
    if (inTable) flushTable();
    return output.join("\n");
  };

  const sanitizeMarkdown = (raw: string): string => {
    let sanitized = raw.replace(/<[/]?start_of_turn>|<[/]?end[_]?of[_]?turn>/gi, "");
    // Unwrap Box wrappers
    sanitized = sanitized
      .replace(/<div class="MuiBox-root[^"]*"[^>]*>([\s\S]*?)<\/div>/g, (_, inner) => inner.trim())
      .replace(/<div[^>]*>\s*<\/div>/g, "");
    // Collapse newline before common punctuation
    sanitized = sanitized.replace(/\r?\n\s*:\s*/g, ": ");
    sanitized = sanitized.replace(/\r?\n\s*,\s*/g, ", ");
    // Normalize pipe tables
    sanitized = normalizeTables(sanitized);
    return sanitized;
  };

  const sanitizedContent = sanitizeMarkdown(content);

  const contentWithSources = useMemo(() => {
    if (!effectiveSources.length || isStreaming) {
      return sanitizedContent;
    }

    const existingSection = /\*\*Sources?\*\*/i.test(sanitizedContent);
    if (existingSection) {
      return sanitizedContent;
    }

    const listMarkdown = effectiveSources
      .map((doc, index) => `- ${index + 1}. ${doc.name}`)
      .join("\n");

    return `${sanitizedContent}\n\n**Sources**\n${listMarkdown}`;
  }, [sanitizedContent, effectiveSources, isStreaming]);

  // Helpers for safe per-word fade wrapping
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const isPlainAppend = (s: string) => {
    // Avoid wrapping when the delta includes markdown/code/meta characters
    return !/[`*_\[\]<>|#~]/.test(s);
  };

  // Compute a render string where newly appended words fade in with a stagger
  let renderContent = contentWithSources;
  if (isStreaming) {
    const prev = prevSanitizedRef.current;
    // Find common prefix length to identify newly appended tail
    let i = 0;
    const max = Math.min(prev.length, sanitizedContent.length);
    while (i < max && prev.charCodeAt(i) === sanitizedContent.charCodeAt(i)) i++;
    const base = sanitizedContent.slice(0, i);
    const appended = sanitizedContent.slice(i);
    if (appended && isPlainAppend(appended)) {
      const parts = appended.split(/(\s+)/); // keep whitespace tokens
  let delayMs = 0;
  const step = 42; // gentle stagger between words for smoother reveal
      const wrapped = parts
        .map((p) => {
          if (/^\s+$/.test(p) || p === "") return p; // preserve whitespace
          const safe = escapeHtml(p);
          const out = `<span class=\"bl-fade-word\" data-bl-delay=\"${delayMs}\">${safe}</span>`;
          delayMs += step;
          return out;
        })
        .join("");
      renderContent = base + wrapped;
    }
  }

  // After compute: update ref for next render
  useEffect(() => {
    prevSanitizedRef.current = contentWithSources;
  }, [contentWithSources]);

  useEffect(() => {
    if (!containerRef.current) return;
    const nodes = containerRef.current.querySelectorAll<HTMLElement>(".bl-fade-word");
    nodes.forEach((node) => {
      const delay = node.getAttribute("data-bl-delay");
      if (delay) {
        node.style.setProperty("--bl-delay", `${delay}ms`);
        node.style.animationDelay = `${delay}ms`;
      }
    });
  }, [renderContent, sanitizedContent, isStreaming]);

  type MarkProps = ComponentPropsWithoutRef<"mark">;
  type AnchorProps = ComponentPropsWithoutRef<"a">;
  type EmProps = ComponentPropsWithoutRef<"em">;
  type TableProps = ComponentPropsWithoutRef<"table">;
  type TableCellProps = ComponentPropsWithoutRef<"td">;
  type TableHeaderProps = ComponentPropsWithoutRef<"th">;
  type ParagraphProps = ComponentPropsWithoutRef<"p">;
  type BlockQuoteProps = ComponentPropsWithoutRef<"blockquote">;
  type OrderedListProps = ComponentPropsWithoutRef<"ol">;
  type UnorderedListProps = ComponentPropsWithoutRef<"ul">;

  const MarkRenderer: React.FC<MarkProps> = ({ children, ...props }) => {
    const inlineBg = theme.palette.mode === "dark"
      ? alpha(theme.palette.common.white, 0.06)
      : alpha(theme.palette.text.primary, 0.06);
    const inlineBorder = `1px solid ${alpha(theme.palette.text.primary, 0.15)}`;
    return (
      <Box
        component="span"
        sx={{
          display: "inline-block",
          backgroundColor: inlineBg,
          border: inlineBorder,
          color: "inherit",
          padding: "0.15em 0.35em",
          borderRadius: "4px",
          fontWeight: 500,
          fontSize: "0.92em",
          lineHeight: 1.4,
          whiteSpace: "normal",
          width: "fit-content",
          maxWidth: "100%",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
        {...props}
      >
        {children}
      </Box>
    );
  };

  const LinkRenderer: React.FC<AnchorProps> = ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: theme.palette.primary.main, textDecoration: "underline" }}
      {...props}
    >
      {children}
    </a>
  );

  const CodeRenderer: React.FC<CodeProps> = ({ inline, className, children, ...props }) => {
    const match = /language-([\w-]+)/.exec(className || "");
    const requestedLanguage = match?.[1]?.toLowerCase() ?? "";
    const codeText = String(children).replace(/\n$/, "");
    const isProbablyBlock = codeText.includes("\n") || Boolean(requestedLanguage);

    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      void navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };


    const highlightTree = useMemo<Root | null>(
      () => (isProbablyBlock ? getHighlightTree(codeText, requestedLanguage) : null),
      [isProbablyBlock, codeText, requestedLanguage]
    );

    const highlightedNodes = useMemo<ReactNode[]>(
      () =>
        highlightTree
          ? renderLowlightChildren(
              (highlightTree.children || []).filter(
                (node): node is Element | Text => node.type === "element" || node.type === "text"
              ),
              `hl-${requestedLanguage || "auto"}`
            )
          : [],
      [highlightTree, requestedLanguage]
    );

    const dataLanguage =
      highlightTree &&
      highlightTree.data &&
      typeof highlightTree.data === "object" &&
      "language" in highlightTree.data
        ? String((highlightTree.data as { language?: unknown }).language ?? "")
        : "";

    if (!highlightTree) {
      const inlineBg = theme.palette.mode === "dark"
        ? alpha(theme.palette.common.white, 0.06)
        : alpha(theme.palette.text.primary, 0.06);
      const inlineBorder = `1px solid ${alpha(theme.palette.text.primary, 0.15)}`;
      return (
        <code
          style={{
            borderRadius: 4,
            fontSize: "0.92em",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            backgroundColor: inlineBg,
            border: inlineBorder,
            padding: "0.15em 0.35em",
          }}
          {...props}
        >
          {children}
        </code>
      );
    }

    const resolvedLanguage = (requestedLanguage || dataLanguage || "code").toString();
    const languageLabel = resolvedLanguage.toUpperCase();
    const languageClass = resolvedLanguage.toLowerCase();

    const highlightColors = theme.palette.mode === "dark"
      ? {
          background: "#0f172a",
          text: "#e2e8f0",
          keyword: "#c792ea",
          string: "#7fdbca",
          number: "#f78c6c",
          comment: "#64748b",
          function: "#82aaff",
          variable: "#f07178",
        }
      : {
          background: "#f4f6ff",
          text: "#1e293b",
          keyword: "#7c3aed",
          string: "#0f766e",
          number: "#b45309",
          comment: "#6b7280",
          function: "#2563eb",
          variable: "#d97706",
        };

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
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.04)
              : alpha(theme.palette.text.primary, 0.04),
            color: theme.palette.text.secondary,
            fontSize: "0.75rem",
            borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
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
                color: copied ? theme.palette.success.main : theme.palette.text.secondary,
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
            '& .hljs': {
              display: 'block',
              overflowX: 'auto',
              padding: '16px',
              margin: 0,
              backgroundColor: highlightColors.background,
              color: highlightColors.text,
              fontSize: '0.9rem',
            },
            '& .hljs-comment, & .hljs-quote': {
              color: highlightColors.comment,
              fontStyle: 'italic',
            },
            '& .hljs-keyword, & .hljs-selector-tag, & .hljs-literal, & .hljs-built_in': {
              color: highlightColors.keyword,
            },
            '& .hljs-string, & .hljs-doctag, & .hljs-template-tag, & .hljs-attr': {
              color: highlightColors.string,
            },
            '& .hljs-number, & .hljs-symbol, & .hljs-bullet, & .hljs-meta': {
              color: highlightColors.number,
            },
            '& .hljs-title, & .hljs-section, & .hljs-selector-id, & .hljs-function': {
              color: highlightColors.function,
            },
            '& .hljs-variable, & .hljs-params, & .hljs-property': {
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

  const EmRenderer: React.FC<EmProps> = ({ children, ...props }) => {
    const onlyChild = Array.isArray(children) && children.length === 1 ? children[0] : null;
    if (
      onlyChild &&
      React.isValidElement(onlyChild) &&
      typeof onlyChild.props?.className === "string" &&
      onlyChild.props.className.includes("MuiBox-root")
    ) {
      const inner = onlyChild.props.children as ReactNode;
      if (typeof inner === "string" && inner.trim().toUpperCase() === "CODE") {
        return null;
      }
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
    return <em {...props}>{children}</em>;
  };

  const TableRenderer: React.FC<TableProps> = ({ children, ...props }) => (
    <Box sx={{ overflowX: "auto", my: 1 }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }} {...props}>
        {children}
      </table>
    </Box>
  );

  const OrderedListRenderer: React.FC<OrderedListProps> = ({ children, ...props }) => (
    <ol style={{ paddingLeft: 24, marginLeft: 16, listStyleType: "decimal" }} {...props}>
      {children}
    </ol>
  );

  const UnorderedListRenderer: React.FC<UnorderedListProps> = ({ children, ...props }) => (
    <ul
      style={{
        paddingLeft: "1.5rem",
        marginTop: "0.5rem",
        marginBottom: "0.25rem",
        listStyle: "disc",
      }}
      {...props}
    >
      {children}
    </ul>
  );

  const BlockQuoteRenderer: React.FC<BlockQuoteProps> = ({ children, ...props }) => (
    <Box
      component="blockquote"
      sx={{
        borderLeft: `4px solid ${theme.palette.divider}`,
        pl: 2,
        ml: 0,
        color: theme.palette.text.secondary,
      }}
      {...props}
    >
      {children}
    </Box>
  );

  const TableHeaderRenderer: React.FC<TableHeaderProps> = ({ children, ...props }) => (
    <th
      style={{
        border: "1px solid #ddd",
        padding: "8px",
        backgroundColor: theme.palette.mode === "dark" ? "#333" : "#f2f2f2",
        textAlign: "left",
      }}
      {...props}
    >
      {children}
    </th>
  );

  const TableCellRenderer: React.FC<TableCellProps> = ({ children, ...props }) => (
    <td
      style={{
        border: "1px solid #ddd",
        padding: "8px",
      }}
      {...props}
    >
      {children}
    </td>
  );

  const ParagraphRenderer: React.FC<ParagraphProps> = ({ children, ...props }) => (
    <p style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }} {...props}>
      {children}
    </p>
  );

  const components: Components = {
    mark: MarkRenderer,
    code: CodeRenderer,
    a: LinkRenderer,
    em: EmRenderer,
    table: TableRenderer,
    ol: OrderedListRenderer,
    ul: UnorderedListRenderer,
    blockquote: BlockQuoteRenderer,
    th: TableHeaderRenderer,
    td: TableCellRenderer,
    p: ParagraphRenderer,
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        // Base transition for minor layout changes
        transition: "opacity 120ms ease-out, transform 120ms ease-out",
        "& .cursor": {
          display: showCursor ? "inline" : "none",
          animation: "blink 1s step-start infinite",
        },
        "@keyframes blink": {
          "50%": { opacity: 0 },
        },
        "& .bl-fade-word": {
          opacity: 0,
          animation: "bl-fade-in 420ms ease-out forwards",
        },
        "@keyframes bl-fade-in": {
          from: { opacity: 0, transform: "translateY(1.5px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        // Subtle fade-in for each render while streaming to reduce choppiness perception
        opacity: isStreaming ? 0.985 : 1,
        transform: isStreaming ? "translateY(0.25px)" : "none",
        // Reduce layout jumpiness between updates
        "& p:last-child": { marginBottom: 0 },
        // Add min height when showing loader to prevent layout shift
        minHeight: showLoader ? "40px" : "auto",
      }}
    >
      {showLoader ? (
        // Show loading indicator when streaming but no content yet
        <Box sx={{ display: "flex", alignItems: "center", minHeight: "40px", pl: 2 }}>
          <div className="typing-only">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </Box>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
          components={components}
        >
          {(renderContent || sanitizedContent) + (showCursor ? " ▊" : "")}
        </ReactMarkdown>
      )}
    </Box>
  );
};

export default StreamingMarkdown;
