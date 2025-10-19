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

// Bandit Engine Watermark: BL-WM-B487-385EFF
const __banditFingerprint_utils_lowlightts = 'BL-FP-1A7DC2-C4E1';
const __auditTrail_utils_lowlightts = 'BL-AU-MGOIKVWA-DTLK';
// File: lowlight.ts | Path: src/utils/lowlight.ts | Hash: b487c4e1

import { createLowlight } from 'lowlight';

import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import yaml from 'highlight.js/lib/languages/yaml';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import kotlin from 'highlight.js/lib/languages/kotlin';
import swift from 'highlight.js/lib/languages/swift';
import scala from 'highlight.js/lib/languages/scala';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import powershell from 'highlight.js/lib/languages/powershell';

const lowlight = createLowlight();

type LowlightInstance = ReturnType<typeof createLowlight>;
type LowlightLanguage = Parameters<LowlightInstance['register']>[1];

const asLanguage = (language: unknown): LowlightLanguage =>
  language as LowlightLanguage;

const registrations: Record<string, LowlightLanguage> = {
  javascript: asLanguage(javascript),
  js: asLanguage(javascript),
  jsx: asLanguage(javascript),
  typescript: asLanguage(typescript),
  ts: asLanguage(typescript),
  tsx: asLanguage(typescript),
  json: asLanguage(json),
  bash: asLanguage(bash),
  shell: asLanguage(shell),
  sh: asLanguage(shell),
  yaml: asLanguage(yaml),
  yml: asLanguage(yaml),
  python: asLanguage(python),
  py: asLanguage(python),
  css: asLanguage(css),
  html: asLanguage(xml),
  xml: asLanguage(xml),
  markdown: asLanguage(markdown),
  md: asLanguage(markdown),
  sql: asLanguage(sql),
  java: asLanguage(java),
  csharp: asLanguage(csharp),
  cs: asLanguage(csharp),
  cpp: asLanguage(cpp),
  c: asLanguage(cpp),
  h: asLanguage(cpp),
  go: asLanguage(go),
  rust: asLanguage(rust),
  rs: asLanguage(rust),
  kotlin: asLanguage(kotlin),
  kt: asLanguage(kotlin),
  swift: asLanguage(swift),
  scala: asLanguage(scala),
  ruby: asLanguage(ruby),
  rb: asLanguage(ruby),
  php: asLanguage(php),
  powershell: asLanguage(powershell),
  ps1: asLanguage(powershell),
};

Object.entries(registrations).forEach(([name, language]) => {
  if (!lowlight.listLanguages().includes(name)) {
    lowlight.register(name, language);
  }
});

export function getHighlightTree(code: string, language?: string) {
  const lang = language?.toLowerCase();
  if (lang && lowlight.listLanguages().includes(lang)) {
    return lowlight.highlight(lang, code);
  }
  return lowlight.highlightAuto(code);
}

export { lowlight };
