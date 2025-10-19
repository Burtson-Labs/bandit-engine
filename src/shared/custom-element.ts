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

// Bandit Engine Watermark: BL-WM-8B89-AB352F
const __banditFingerprint_shared_customelementts = 'BL-FP-F2B205-1756';
const __auditTrail_shared_customelementts = 'BL-AU-MGOIKVW2-KQI8';
// File: custom-element.ts | Path: src/shared/custom-element.ts | Hash: 8b891756

import React from "react";
import ReactDOM from "react-dom/client";

type AttributeMap = Record<string, string>;

export function defineCustomElement<Props extends Record<string, unknown>>(
  name: string,
  Component: React.ComponentType<Props>
) {
  if (customElements.get(name)) return;

  class ReactElement extends HTMLElement {
    mountPoint: HTMLDivElement;
    root!: ReactDOM.Root;

    constructor() {
      super();
      this.mountPoint = document.createElement("div");
      this.attachShadow({ mode: "open" }).appendChild(this.mountPoint);
    }

    connectedCallback() {
      this.render();
    }

    static get observedAttributes() {
      return [];
    }

    attributeChangedCallback() {
      this.render();
    }

    render() {
      const props = Object.fromEntries(
        Array.from(this.attributes).map((attr) => [attr.name, attr.value])
      ) as AttributeMap;

      if (!this.root) {
        this.root = ReactDOM.createRoot(this.mountPoint);
      }

      this.root.render(React.createElement(Component, props as Props));
    }
  }

  customElements.define(name, ReactElement);
}
