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

// Bandit Engine Watermark: BL-WM-27B9-B757B8
const __banditFingerprint_utils_markdownRenderingtsx = 'BL-FP-CD0811-8EE4';
const __auditTrail_utils_markdownRenderingtsx = 'BL-AU-MGOIKVWA-MS82';
// File: markdownRendering.tsx | Path: src/utils/markdownRendering.tsx | Hash: 27b98ee4

import React from "react";
import type { Element, Text } from "hast";
import { defaultSchema } from "rehype-sanitize";

export const markdownSanitizeSchema = (() => {
  const schema = JSON.parse(JSON.stringify(defaultSchema));
  schema.tagNames = Array.from(
    new Set([...(schema.tagNames || []), "span", "sup", "sub"])
  );
  schema.attributes = {
    ...(schema.attributes || {}),
    "*": Array.from(
      new Set([...(schema.attributes?.["*"] || []), "className", "id", "data*"])
    ),
    span: Array.from(
      new Set([
        ...(schema.attributes?.span || []),
        "className",
        "data-bl-delay",
        "data*",
        "id",
      ])
    ),
    code: Array.from(
      new Set([
        ...(schema.attributes?.code || []),
        "className",
        "data-language",
        "data*",
        "id",
      ])
    ),
    pre: Array.from(
      new Set([...(schema.attributes?.pre || []), "className", "data*", "id"])
    ),
    sup: Array.from(
      new Set([...(schema.attributes?.sup || []), "className", "data*", "id"])
    ),
    a: Array.from(
      new Set([...(schema.attributes?.a || []), "className", "data*", "id"])
    ),
  };
  schema.clobberPrefix = "bl";
  schema.allowComments = false;
  schema.strip = ["script", "style"];
  return schema;
})();

export const renderLowlightChildren = (
  nodes: Array<Element | Text>,
  keyPrefix: string
): React.ReactNode[] =>
  nodes.map((node, index) => {
    if (node.type === "text") {
      return node.value;
    }

    if (node.type === "element") {
      const key = `${keyPrefix}-${index}`;
      const { tagName, properties = {}, children = [] } = node;
      const reactProps: Record<string, unknown> = { key };

      Object.entries(properties).forEach(([propKey, value]) => {
        if (propKey === "className" && Array.isArray(value)) {
          reactProps.className = value.join(" ");
        } else if (value !== null && value !== undefined) {
          reactProps[propKey] = value;
        }
      });

      return React.createElement(
        tagName,
        reactProps,
        renderLowlightChildren(children as Array<Element | Text>, key)
      );
    }

    return null;
  });
