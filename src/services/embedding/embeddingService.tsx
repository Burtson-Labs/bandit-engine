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

// Bandit Engine Watermark: BL-WM-80DE-7F9B86
const __banditFingerprint_embedding_embeddingServicetsx = 'BL-FP-F2415E-F7A3';
const __auditTrail_embedding_embeddingServicetsx = 'BL-AU-MGOIKVVS-XRZD';
// File: embeddingService.tsx | Path: src/services/embedding/embeddingService.tsx | Hash: 80def7a3

import { summarizeDocument } from "../prompts";
import { useMemoryStore } from "../../store/memoryStore";
import { debugLogger } from "../logging/debugLogger";

export class EmbeddingService {
  /**
   * Generates a basic "fake" embedding based on word length.
   * (Replaceable later with true model-based embeddings.)
   */
  async generate(text: string): Promise<number[]> {
    const words = text.toLowerCase().split(/\s+/);
    return words.slice(0, 5).map((w) => w.length / 10);
  }

  private generateTFEmbedding(text: string, topN = 10): number[] {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    const freq: Record<string, number> = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }

    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word]) => word);

    return topWords.map((w) => freq[w] / words.length);
  }

  /**
   * Computes cosine similarity between two embedding vectors.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] ?? 0), 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
  }

  /**
   * Backfills any missing memory embeddings in the memory store.
   */
  async backfillMissingEmbeddings(): Promise<void> {
    const { entries } = useMemoryStore.getState();
    const updates: { id: string; embedding: number[] }[] = [];

    for (const entry of entries) {
      if (!entry.embedding) {
        const embedding = await this.generate(entry.content);
        updates.push({ id: entry.id, embedding });
      }
    }

    if (updates.length > 0) {
      useMemoryStore.setState((state) => ({
        entries: state.entries.map((entry) => {
          const updated = updates.find((u) => u.id === entry.id);
          return updated ? { ...entry, embedding: updated.embedding } : entry;
        }),
      }));
      debugLogger.debug(`✅ Backfilled ${updates.length} memory embeddings.`);
    } else {
      debugLogger.debug("✅ No missing embeddings — all memories are up to date!");
    }
  }

  /**
   * Estimates token usage for a given memory content.
   * Rough formula: word count × 1.3 (average token inflation).
   */
  estimateTokens(text: string): number {
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount * 1.3);
  }

  /**
   * Calculates total estimated token usage for pinned memories.
   */
  estimatePinnedMemoryTokens(): number {
    const { entries } = useMemoryStore.getState();
    const pinned = entries.filter((entry) => entry.pinned);
    return pinned.reduce((sum, entry) => sum + this.estimateTokens(entry.content), 0);
  }

  /**
   * Selects the most relevant memories for injection based on:
   * 1. Always include pinned memories first.
   * 2. Then select top semantic matches by cosine similarity.
   * 3. Stay within an approximate max token budget.
   */
  async selectRelevantMemories(question: string, maxTokens = 750): Promise<string[]> {
    if (!question.trim()) return [];

    const { entries } = useMemoryStore.getState();
    if (entries.length === 0) return [];

    const questionEmbedding = await this.generate(question);

    const pinned = entries.filter((entry) => entry.pinned);
    const unpinned = entries.filter((entry) => !entry.pinned);

    // Score unpinned memories
    const scored: { content: string; score: number }[] = [];

    for (const entry of unpinned) {
      if (entry.embedding) {
        const sim = this.cosineSimilarity(questionEmbedding, entry.embedding);
        scored.push({ content: entry.content, score: sim });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    const threshold = 0.6;
    const topMatches = scored.filter((s) => s.score >= threshold);

    const selected: string[] = [];
    let tokensUsed = 0;

    // 1. Add all pinned memories first (if they fit)
    for (const entry of pinned) {
      const tokensNeeded = this.estimateTokens(entry.content);
      if (tokensUsed + tokensNeeded > maxTokens) {
        break;
      }
      selected.push(entry.content);
      tokensUsed += tokensNeeded;
    }

    // 2. Then fill remaining budget with best unpinned matches
    for (const match of topMatches) {
      const tokensNeeded = this.estimateTokens(match.content);
      if (tokensUsed + tokensNeeded > maxTokens) {
        break;
      }
      selected.push(match.content);
      tokensUsed += tokensNeeded;
    }

    debugLogger.debug(
      "🎯 Selected memories (pinned + semantic):",
      { 
        memories: selected.map((m) => `${m.slice(0, 60)}${m.length > 60 ? "..." : ""}`)
      }
    );

    return selected;
  }

  /**
   * Splits raw text into smaller chunks (approx. ~500 chars each).
   * Useful for embedding code or reference documents.
   */
  chunkText(text: string, maxLen = 500): string[] {
    const lines = text.split(/\r?\n/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextChunk = currentChunk + line + "\n";

      if (nextChunk.length > maxLen) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = line + "\n";
        } else {
          chunks.push(line.trim());
          currentChunk = "";
        }
      } else {
        currentChunk = nextChunk;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Prepares a document (like a code file) for embedding.
   */
  async embedDocument(name: string, content: string) {
    const chunks = this.chunkText(content);
    const summary = await summarizeDocument(name, content);
    const embeddings = chunks.map((chunk) => this.generateTFEmbedding(chunk));

    return {
      name,
      summary,
      chunks,
      embeddings,
    };
  }
}

export const embeddingService = new EmbeddingService();
