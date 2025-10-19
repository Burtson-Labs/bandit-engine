(() => {
  const STYLE_ID = "bandit-typedoc-mobile-tweaks";
  const BACK_BUTTON_ID = "bandit-docs-back-button";
  const FALLBACK_URL = "/npm-package";
  const GATEWAY_MARKER = "VITE_DEFAULT_MODEL";
  const MAX_GATEWAY_ATTEMPTS = 40;
  const EMBEDDED_CLASS = "bandit-docs-embedded";
  const STANDALONE_CLASS = "bandit-docs-standalone";

  const isEmbedded = (() => {
    try {
      return window.top !== window;
    } catch {
      return true;
    }
  })();

  const addStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --bandit-docs-footer-height: 56px;
        --bandit-docs-header-height: 68px;
      }

      html,
      body {
        overflow: hidden;
      }

      body.bandit-docs-ready {
        display: block !important;
      }

      .tsd-panel table {
        width: 100%;
        border-collapse: collapse;
      }

      .tsd-panel table:not(.tsd-comment-table) {
        display: block;
        overflow-x: auto;
      }

      .tsd-panel table::-webkit-scrollbar {
        height: 6px;
      }

      .gateway-doc {
        display: grid;
        gap: clamp(12px, 2.5vw, 20px);
        line-height: 1.65;
      }

      .gateway-doc ul {
        margin: 0;
        padding-left: clamp(20px, 4vw, 32px);
      }

      .gateway-doc blockquote {
        margin: 0;
        padding-left: clamp(16px, 3vw, 24px);
        border-left: 3px solid rgba(148, 163, 184, 0.35);
        opacity: 0.9;
      }

      .container {
        width: 100%;
        max-width: none;
        margin: 0 auto;
        padding-left: clamp(18px, 2.8vw, 64px);
        padding-right: clamp(18px, 2.8vw, 64px);
        box-sizing: border-box;
      }

      .container-main {
        box-sizing: border-box;
        margin: 0 auto;
        padding-top: clamp(4px, 0.6vh, 10px);
        padding-bottom: 0;
        gap: clamp(12px, 1.4vw, 24px);
        height: calc(100vh - var(--bandit-docs-header-height));
        display: grid;
        grid-template-rows: max-content 1fr;
        align-content: start;
      }

      .container-main .col-content,
      .container-main .col-navigation,
      .container-main .col-sidebar {
        padding-bottom: clamp(12px, 1.4vw, 20px);
      }

      @media (min-width: 1280px) {
        .container-main {
          display: grid;
          grid-template-columns:
            minmax(200px, clamp(236px, 15.5vw, 284px))
            minmax(0, 1fr)
            minmax(200px, clamp(236px, 15.5vw, 284px));
          align-items: stretch;
          grid-template-rows: max-content 1fr;
        }

        .container-main .col-navigation,
        .container-main .col-sidebar {
          position: sticky;
          top: var(--bandit-docs-header-height);
          max-height: calc(100vh - var(--bandit-docs-header-height) - var(--bandit-docs-footer-height) - clamp(12px, 1.5vh, 24px));
          overflow-y: auto;
          padding-right: clamp(6px, 0.9vw, 16px);
          padding-bottom: calc(var(--bandit-docs-footer-height) + clamp(12px, 1.5vh, 24px));
          scrollbar-gutter: stable;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          min-width: 0;
        }

        .container-main .col-content {
          min-width: 0;
          max-height: calc(100vh - var(--bandit-docs-header-height) - var(--bandit-docs-footer-height) - clamp(12px, 1.5vh, 24px));
          overflow-y: auto;
          padding-right: clamp(8px, 1vw, 20px);
          padding-bottom: calc(var(--bandit-docs-footer-height) + clamp(16px, 2vh, 28px));
          scrollbar-gutter: stable;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        .container-main .col-navigation .tsd-navigation a,
        .container-main .col-sidebar .tsd-navigation a {
          white-space: normal;
        }
      }

      footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        margin: 0;
        padding: 0 clamp(18px, 2.8vw, 54px);
        height: var(--bandit-docs-footer-height);
        display: flex;
        align-items: center;
        background: rgba(5, 11, 25, 0.94);
        backdrop-filter: blur(14px);
        border-top: 1px solid rgba(148, 163, 184, 0.2);
        z-index: 200;
      }

      footer > * {
        max-width: min(100%, calc(100vw - clamp(32px, 6vw, 120px)));
        margin: 0 auto;
      }

      .${EMBEDDED_CLASS} footer {
        padding-left: clamp(18px, 2.4vw, 54px);
        padding-right: clamp(18px, 2.4vw, 54px);
      }

      body {
        margin: 0;
        padding-bottom: 0;
      }

      @media (min-width: 1280px) {
        body {
          overflow-y: hidden;
        }
      }

      @media (min-width: 1200px) {
        .page-menu,
        .site-menu {
          max-height: calc(100vh - 2rem - 114px) !important;
        }
      }

      @media (min-width: 770px) and (max-width: 1199px) {
        .site-menu {
          max-height: calc(100vh - 2rem - 114px) !important;
        }
      }

      @media (max-width: 1024px) {
        html,
        body {
          overflow: auto;
        }

        .container {
          padding-left: clamp(16px, 4.5vw, 28px);
          padding-right: clamp(16px, 4.5vw, 28px);
        }

        .container-main {
          display: block;
          max-width: min(100%, 780px);
          margin-left: auto;
          margin-right: auto;
          min-height: auto;
          height: auto;
          padding-top: clamp(18px, 6vw, 28px);
          padding-bottom: clamp(18px, 6vw, 32px);
        }

        .container-main .col-navigation,
        .container-main .col-sidebar {
          position: relative;
          top: auto;
          max-height: none;
          overflow: visible;
          padding-right: 0;
          padding-bottom: clamp(24px, 6vw, 48px);
        }

        .container-main .col-content {
          max-height: none;
          overflow: visible;
          padding-right: 0;
          padding-bottom: clamp(72px, 10vw, 120px);
        }

        footer {
          position: static;
          padding: clamp(18px, 6vw, 28px) 0 clamp(24px, 6vw, 36px);
          background: transparent;
          backdrop-filter: none;
          border-top: 1px solid rgba(148, 163, 184, 0.24);
          height: auto;
        }

        footer > * {
          max-width: none;
          padding-left: clamp(16px, 4.5vw, 28px);
          padding-right: clamp(16px, 4.5vw, 28px);
        }

        body {
          overflow-y: auto;
          padding-bottom: clamp(48px, 12vw, 88px);
        }

        #${BACK_BUTTON_ID} {
          display: flex;
        }
      }

      .${EMBEDDED_CLASS} .container {
        padding-left: clamp(18px, 2.4vw, 54px);
        padding-right: clamp(18px, 2.4vw, 54px);
      }

      .${EMBEDDED_CLASS} .container-main {
        margin-left: auto;
        margin-right: auto;
        width: min(100%, calc(100vw - clamp(32px, 6vw, 120px)));
      }

      .${EMBEDDED_CLASS} .tsd-page-toolbar {
        position: sticky;
        top: 0;
        z-index: 90;
        min-height: 56px;
        padding: 0;
        box-shadow: inset 0 -1px 0 rgba(148, 163, 184, 0.18);
        backdrop-filter: blur(18px);
      }

      .${EMBEDDED_CLASS} .tsd-page-toolbar .tsd-toolbar-contents {
        margin: 0 auto;
        padding: 0 clamp(18px, 2.4vw, 54px);
        width: min(100%, calc(100vw - clamp(32px, 6vw, 120px)));
        display: flex;
        align-items: center;
      }

      #${BACK_BUTTON_ID} {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(18px, 6vw, 32px));
        z-index: 2147483647;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: clamp(32px, 10vw, 999px);
        padding: clamp(12px, 4vw, 18px) clamp(18px, 7vw, 22px);
        min-height: 46px;
        width: min(480px, calc(100vw - clamp(28px, 10vw, 64px)));
        background: linear-gradient(135deg, rgba(63, 133, 245, 0.95), rgba(14, 165, 233, 0.95));
        color: #f8fafc;
        font-size: clamp(14px, 4vw, 16px);
        font-weight: 700;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        box-shadow: 0 20px 36px rgba(8, 15, 32, 0.35);
        display: none;
        align-items: center;
        justify-content: center;
        gap: clamp(4px, 2vw, 10px);
        cursor: pointer;
        backdrop-filter: blur(18px);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      #${BACK_BUTTON_ID}:hover {
        transform: translate(-50%, -2px);
        box-shadow: 0 26px 45px rgba(8, 15, 32, 0.4);
      }

      #${BACK_BUTTON_ID}:active {
        transform: translate(-50%, 0) scale(0.97);
        box-shadow: 0 16px 30px rgba(8, 15, 32, 0.4);
      }

      #${BACK_BUTTON_ID} svg {
        width: clamp(16px, 4vw, 18px);
        height: clamp(16px, 4vw, 18px);
        fill: currentColor;
      }

      #${BACK_BUTTON_ID} span {
        white-space: nowrap;
        letter-spacing: 0.01em;
      }

      @media (max-width: 1024px) {
        .container {
          width: 100%;
          max-width: calc(100vw - clamp(8px, 4vw, 28px));
          margin: 0 auto;
          padding: clamp(14px, 4.5vw, 24px);
        }

        #${BACK_BUTTON_ID} {
          display: flex;
        }
      }
    `;

    document.head.appendChild(style);
  };

  const revealBody = () => {
    if (document.body) {
      document.body.classList.add("bandit-docs-ready");
      document.body.style.removeProperty("display");
    }
  };

  const ensureBackButton = () => {
    if (isEmbedded) return;

    let button = document.getElementById(BACK_BUTTON_ID);
    if (!button) {
      button = document.createElement("button");
      button.id = BACK_BUTTON_ID;
      button.type = "button";
      button.setAttribute("aria-label", "Return to npm package page");
      button.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg><span>Back to overview</span>';
      button.addEventListener("click", () => {
        const fallback = () => {
          window.location.href = FALLBACK_URL;
        };
        const timeout = setTimeout(fallback, 180);
        window.addEventListener(
          "popstate",
          () => {
            clearTimeout(timeout);
          },
          { once: true },
        );
        window.history.back();
      });
      document.body.appendChild(button);
    }
  };

  const replaceGatewaySnippet = (attempt = 0) => {
    const codeBlocks = Array.from(document.querySelectorAll("pre code"));
    const targetBlock = codeBlocks.find((block) => {
      const text = block.textContent || "";
      return text.includes(GATEWAY_MARKER) && text.includes("Voice Services (TTS/STT)");
    });

    if (!targetBlock) {
      if (attempt < MAX_GATEWAY_ATTEMPTS) {
        setTimeout(() => replaceGatewaySnippet(attempt + 1), 200);
      }
      return;
    }

    const pre = targetBlock.closest("pre");
    if (!pre) return;

    const copyButton = pre.nextElementSibling;
    if (copyButton?.tagName === "BUTTON") {
      copyButton.remove();
    }

    const wrapper = document.createElement("div");
    wrapper.className = "gateway-doc";
    wrapper.innerHTML = `
      <p>Set <code>VITE_DEFAULT_MODEL</code> / <code>VITE_FALLBACK_MODEL</code> to the exact Ollama model tags you have available (<code>gemma</code>, <code>llava</code>, <code>moondream</code>, or your own custom builds). Bandit automatically detects multimodal Ollama models, so setting <code>llava</code>, <code>moondream</code>, or other vision-capable variants enables image understanding with no extra code.</p>
      <h3>🎤 Voice Services (TTS/STT)</h3>
      <p>The Bandit Engine supports Text-to-Speech (TTS) and Speech-to-Text (STT) through your gateway API. These services are <strong>technology-agnostic</strong> — you can implement them using any backend technology:</p>
      <ul>
        <li>
          <strong>TTS Endpoint (<code>POST /api/tts</code>)</strong>
          <ul>
            <li><strong>Input</strong>: <code>{ text: string, voice?: string, speed?: number }</code></li>
            <li><strong>Output</strong>: Audio file (MP3, WAV, etc.) or streaming audio</li>
            <li><strong>Compatible with</strong>: OpenAI TTS, Azure Speech, Google Cloud TTS, AWS Polly, local TTS servers, or custom implementations</li>
          </ul>
        </li>
        <li>
          <strong>STT Endpoint (<code>POST /api/stt/transcribe</code>)</strong>
          <ul>
            <li><strong>Input</strong>: Audio file upload (multipart/form-data)</li>
            <li><strong>Output</strong>: <code>{ text: string }</code> or <code>{ transcription: string }</code></li>
            <li><strong>Compatible with</strong>: OpenAI Whisper, Azure Speech, Google Speech, AWS Transcribe, local Whisper servers, or custom implementations</li>
          </ul>
        </li>
        <li>
          <strong>Service Discovery (<code>GET /api/tts/available-models</code>)</strong>
          <ul>
            <li><strong>Output</strong>: <code>{ models: string[], defaultModel: string, fallbackModel: string }</code></li>
            <li>Used for automatic service availability detection and voice model selection</li>
          </ul>
        </li>
      </ul>
      <blockquote>Quickstart note: the generated Express gateway ships these TTS/STT routes as <code>501</code> placeholders so you can connect your own provider. Voice features remain disabled until you implement them server-side.</blockquote>
      <p>See the <a href="media/02_gateway_api.md">Gateway API Contract</a> for complete implementation examples in multiple languages.</p>
      <p>Use the Management interface to switch providers anytime or migrate from direct to gateway setup.</p>
    `;

    pre.replaceWith(wrapper);
  };

  const init = () => {
    document.documentElement.classList.add(isEmbedded ? EMBEDDED_CLASS : STANDALONE_CLASS);
    addStyles();
    revealBody();
    ensureBackButton();
    replaceGatewaySnippet();
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  }
})();
