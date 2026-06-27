import { create } from "zustand";

/**
 * The Canvas: a side-by-side editable document/code surface. The chat can drop
 * a generated answer into it ("Open in canvas"), the user edits it live, and it
 * can be copied or downloaded. Kept deliberately small — a single source of
 * truth that both the chat (entry points) and the CanvasPanel (UI) read from.
 */
interface CanvasState {
  open: boolean;
  title: string;
  content: string;
  /** Set when the canvas holds code (e.g. "ts", "py") so the editor uses a mono font. */
  language?: string;
  openCanvas: (args: { content: string; title?: string; language?: string }) => void;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
  close: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  open: false,
  title: "",
  content: "",
  language: undefined,
  openCanvas: ({ content, title, language }) =>
    set({ open: true, content, title: title?.trim() || "Untitled", language }),
  setContent: (content) => set({ content }),
  setTitle: (title) => set({ title }),
  close: () => set({ open: false }),
}));
