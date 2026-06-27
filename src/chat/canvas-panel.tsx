import { useState } from "react";
import { Box, Dialog, IconButton, Tab, Tabs, TextField, Tooltip } from "@mui/material";
import {
  X as CloseIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
  Eye as PreviewIcon,
  Pencil as EditIcon,
} from "lucide-react";
import StreamingMarkdown from "../components/StreamingMarkdown";
import { useCanvasStore } from "../store/canvasStore";

const CANVAS_WIDTH = "min(46vw, 760px)";

/** The shared canvas surface — header + Edit/Preview tabs. Rendered inside the
 *  desktop panel or the mobile dialog. */
const CanvasBody = () => {
  const { content, title, language, setContent, setTitle, close } = useCanvasStore();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const download = () => {
    const safe = (title || "canvas").replace(/[^\w.-]+/g, "_") || "canvas";
    const ext = language ? language : "md";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safe}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.paper" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <TextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="standard"
          placeholder="Untitled"
          InputProps={{ disableUnderline: true, sx: { fontWeight: 700, fontSize: 15 } }}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <Tooltip title={copied ? "Copied" : "Copy"} arrow>
          <IconButton size="small" onClick={copy} aria-label="Copy canvas">
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          </IconButton>
        </Tooltip>
        <Tooltip title={`Download .${language || "md"}`} arrow>
          <IconButton size="small" onClick={download} aria-label="Download canvas">
            <DownloadIcon size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Close canvas" arrow>
          <IconButton size="small" onClick={close} aria-label="Close canvas">
            <CloseIcon size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Edit / Preview */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: 40,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
          "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600 },
        }}
      >
        <Tab value="edit" label="Edit" icon={<EditIcon size={14} />} iconPosition="start" />
        <Tab value="preview" label="Preview" icon={<PreviewIcon size={14} />} iconPosition="start" />
      </Tabs>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {tab === "edit" ? (
          <Box
            component="textarea"
            value={content}
            onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
            spellCheck={false}
            placeholder="Write or edit here…"
            sx={{
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              border: 0,
              outline: 0,
              resize: "none",
              p: 2,
              bgcolor: "transparent",
              color: "text.primary",
              fontFamily: language
                ? "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
                : "inherit",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          />
        ) : (
          <Box sx={{ p: 2 }}>
            <StreamingMarkdown content={content} isStreaming={false} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * The Canvas panel. Desktop: a fixed panel pinned to the right edge (the chat
 * shell shrinks to make room — see chat.tsx). Mobile: a full-screen dialog so
 * the editor isn't crammed into a split.
 */
const CanvasPanel = ({ isMobile }: { isMobile: boolean }) => {
  const open = useCanvasStore((s) => s.open);
  const close = useCanvasStore((s) => s.close);
  if (!open) return null;

  if (isMobile) {
    return (
      <Dialog
        fullScreen
        open={open}
        onClose={close}
        slotProps={{ paper: { sx: { bgcolor: "background.paper" } } }}
      >
        <CanvasBody />
      </Dialog>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: CANVAS_WIDTH,
        zIndex: 1,
        borderLeft: "1px solid",
        borderColor: "divider",
        boxShadow: "-8px 0 28px rgba(0,0,0,0.22)",
        bgcolor: theme.palette.background.paper,
      })}
    >
      <CanvasBody />
    </Box>
  );
};

export { CANVAS_WIDTH };
export default CanvasPanel;
