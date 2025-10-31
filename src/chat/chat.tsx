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

// Bandit Engine Watermark: BL-WM-ADA1-C10301
const __banditFingerprint_chat_chattsx = 'BL-FP-CFC9B2-7718';
const __auditTrail_chat_chattsx = 'BL-AU-MGOIKVUY-9KCZ';
// File: chat.tsx | Path: src/chat/chat.tsx | Hash: ada17718

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import CustomLogo from "./custom-logo";
import indexedDBService from "../services/indexedDB/indexedDBService";
import { Box, ThemeProvider, CssBaseline } from "@mui/material";
import { useAIQueryStore } from "../store/aiQueryStore";
import { useModelStore } from "../store/modelStore";
import { Navigate } from "react-router-dom";
import ChatScrollToBottomButton from "./chat-scroll-to-bottom-button";
import BanditChatLogo from "./bandit-chat-logo";
import ChatMessages from "./chat-messages";
import ChatInput from "./chat-input";
import { useAIProvider } from "./hooks/useAIProvider";
import { SCROLL_STATE_CHANGED_EVENT, useAutoScroll } from "../hooks/useAutoScroll";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import "./chat.css";
import { useVoiceStore } from "../store/voiceStore";
import { useAIProviderStore } from "../store/aiProviderStore";
import { useTTS } from "../hooks/useTTS";
import ChatAppBar from "./chat-app-bar";
import { useConversationStore } from "../store/conversationStore";
import { useConversationNameGenerator } from "./hooks/useConversationNameGenerator";
import { usePackageSettingsStore } from "../store/packageSettingsStore";
import { QuerySuggestionPicker } from "./query-suggestion-picker";
import { authenticationService } from "../services/auth/authenticationService";
import themeMap from "../theme/themeMap";
import { banditDarkTheme } from "../theme/banditTheme";
import UnderReview from "../../../../src/pages/under-review";
import { usePreferencesStore } from "../store/preferencesStore";
import { debugLogger } from "../services/logging/debugLogger";
import { stopTTS } from "../services/tts/streaming-tts";
import { FeedbackButton } from "../components/feedback/FeedbackButton";
import { useNotificationService } from "../hooks/useNotificationService";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { useVoiceMode } from "../hooks/useVoiceMode";
import { useVoiceModeStore } from "../store/voiceModeStore";
import { sanitizeForTTS } from "../services/tts/ttsSanitizer";
import { StoredBanditConfigRecord, StoredBrandingConfig } from "../types/config";
import { useFeatureFlag } from "../contexts/FeatureFlagContext";

const ChatContent = () => {
  const packageSettings = usePackageSettingsStore((state) => state.settings);
  const featureFlag = useFeatureFlag();
  const { isOSSMode } = featureFlag;
  const ossMode = isOSSMode() || !packageSettings?.featureFlags?.subscriptionType;
  const playgroundBypassAccess =
    packageSettings?.playgroundBypassAuth ||
    (typeof window !== "undefined" && window.location.pathname.includes("/playground"));
  const notificationService = useNotificationService();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [themeLoading, setThemeLoading] = useState(true);
  
  // Check for super-admin role
  const token = authenticationService.getToken();
  const claims = token ? authenticationService.parseJwtClaims(token) : null;
  const banditTheme = themeMap[selectedTheme ?? "bandit-dark"] || banditDarkTheme;

  const {
    inputValue,
    setInputValue,
    setResponse,
    history,
    addHistory,
    setComponentStatus,
    setPreviousQuestion,
    componentStatus,
    hydrated,
  } = useAIQueryStore();

  const { availableModels, selectedModel, setSelectedModel } = useModelStore();
  const { 
    availableVoices, 
    selectedVoice, 
    setSelectedVoice,
    isServiceAvailable,
    loadVoicesFromAPI,
    initialized
  } = useVoiceStore();
  const isVoiceModeEnabled = useVoiceModeStore((state) => state.enabled);
  const previousVoiceModeEnabledRef = useRef(isVoiceModeEnabled);
  const historyRef = useRef(history);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  
  // TTS functionality
  const {
    speak: ttsSpeak,
    stop: ttsStop,
    isAvailable: isTTSAvailable,
  } = useTTS();
  
  // Initialize voice loading when component mounts
  useEffect(() => {
    // Force voice loading with a small delay to ensure package settings are ready
    const timer = setTimeout(() => {
      const isAuthenticated = authenticationService.isAuthenticated();
      
      if (!initialized || availableVoices.length === 0) {
        if (token && isAuthenticated) {
          debugLogger.debug('Chat: Voices not initialized or unavailable, attempting to load from API');
          loadVoicesFromAPI();
        } else {
          debugLogger.debug('Chat: No valid JWT token available - skipping voice loading');
        }
      }
    }, 500); // 500ms delay to ensure gateway URL is configured

    return () => clearTimeout(timer);
  }, [initialized, availableVoices.length, loadVoicesFromAPI, token]);

  // Also try to load voices when package settings become available
  useEffect(() => {
    const isAuthenticated = authenticationService.isAuthenticated();
    
    if (packageSettings?.gatewayApiUrl && availableVoices.length === 0 && !initialized) {
      if (token && isAuthenticated) {
        debugLogger.debug('Chat: Gateway URL available and no voices loaded, attempting to load from API');
        loadVoicesFromAPI();
      } else {
        debugLogger.debug('Chat: Gateway URL available but no valid JWT token - skipping voice loading');
      }
    }
  }, [packageSettings?.gatewayApiUrl, availableVoices.length, initialized, loadVoicesFromAPI, token]);

  const provider = useAIProviderStore((state) => state.provider);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = useState(80);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{
    question: string;
    images?: string[];
  } | null>(null);

  const { conversations, currentId, _hasHydrated, hydrate } = useConversationStore();
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { generateName } = useConversationNameGenerator();
  const { preferences } = usePreferencesStore();


  // Enhanced UX with auto-scroll and network awareness (after isMobile is defined)
  const { containerRef: chatContainerRef, targetRef: scrollTargetRef, scrollToBottom, getScrollState } = useAutoScroll({
    threshold: 16, // Smaller threshold so the button shows with light upward scrolls
    behavior: "smooth",
    isMobile: isMobile,
  });
  const chatContainerEl = chatContainerRef.current;
  const scrollTargetEl = scrollTargetRef.current;
  const { isSlowConnection, connectionQuality, trackRequestStart, trackRequestEnd } = useNetworkStatus();
  
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [responseStarted, setResponseStarted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const initialLogoState = history.length === 0;
  const [logoVisible, setLogoVisible] = useState(initialLogoState);
  const [logoShouldRender, setLogoShouldRender] = useState(initialLogoState);

  // Keep previous message slightly visible during the first moments of a new stream
  const streamingGraceUntilRef = useRef<number>(0);
  const GRACE_MS = 450; // duration of scroll grace
  const GRACE_OFFSET_DESKTOP = 28; // px reserved above bottom to keep previous answer visible
  const GRACE_OFFSET_MOBILE = 20;

  // Track whether we should follow the stream based on user's position at send time
  const followStreamRef = useRef<boolean>(true);
  const lastSpokenResponseRef = useRef<string | null>(null);
  const previousConversationIdRef = useRef<string | null>(null);
  const logoFadeTimeoutRef = useRef<number | null>(null);

  const [branding, setBranding] = useState<{ brandingText?: string, logoBase64?: string } | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const isBrandingLoadInProgressRef = useRef(false);
  const logoOnly = history.length === 0 && !brandingLoading;

  useEffect(() => {
    const isEmptyConversation = (history?.length ?? 0) === 0;
    const isSending = Boolean(pendingMessage);
    const shouldShowLogo = isEmptyConversation && !isSending;

    if (shouldShowLogo) {
      if (logoFadeTimeoutRef.current) {
        window.clearTimeout(logoFadeTimeoutRef.current);
        logoFadeTimeoutRef.current = null;
      }

      setLogoShouldRender((prev) => {
        if (prev) return prev;
        return true;
      });

      setLogoVisible((prev) => {
        if (prev) return prev;
        return true;
      });

      return;
    }

    setLogoVisible((prev) => {
      if (!prev) return prev;
      return false;
    });

    if (!logoFadeTimeoutRef.current) {
      logoFadeTimeoutRef.current = window.setTimeout(() => {
        setLogoShouldRender(false);
        logoFadeTimeoutRef.current = null;
      }, 500);
    }
  }, [history, pendingMessage]);

  useEffect(() => () => {
    if (logoFadeTimeoutRef.current) {
      window.clearTimeout(logoFadeTimeoutRef.current);
      logoFadeTimeoutRef.current = null;
    }
  }, []);

  // Ensure conversation store is hydrated on component mount
  useEffect(() => {
    // When a new stream starts, start a short grace window to avoid snapping to absolute bottom
    if (isStreaming && streamBuffer.trim() === "") {
      streamingGraceUntilRef.current = Date.now() + GRACE_MS;
    }
  }, [isStreaming, streamBuffer]);

  useEffect(() => {
    if (!isStreaming) return;
    const container = chatContainerRef.current;
    if (!container) return;
    const now = Date.now();
    if (now <= streamingGraceUntilRef.current && followStreamRef.current) {
      const offset = isMobile ? GRACE_OFFSET_MOBILE : GRACE_OFFSET_DESKTOP;
      const targetTop = Math.max(0, container.scrollHeight - container.clientHeight - offset);
      // Use smooth behavior to keep motion gentle
      container.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  }, [streamBuffer, isStreaming, isMobile, chatContainerRef]);

  useEffect(() => {
    if (!_hasHydrated) {
      debugLogger.info("Chat component triggering conversation store hydration");
      hydrate();
    }
  }, [_hasHydrated, hydrate]);

  useEffect(() => {
    const loadBrandingAndTheme = async () => {
      // Prevent concurrent loading
      if (isBrandingLoadInProgressRef.current) {
        debugLogger.warn("Branding loading already in progress, skipping");
        return;
      }
      
      // Check if we're on management page and add delay to avoid conflicts
      const isManagementPage = window.location.pathname.includes('/management');
      if (isManagementPage) {
        debugLogger.info("Chat: Detected management page, adding delay before branding load");
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Double-check if branding is still not being loaded
        if (isBrandingLoadInProgressRef.current) {
          debugLogger.info("Chat: Management branding load detected, skipping chat branding load");
          return;
        }
      }
      
      isBrandingLoadInProgressRef.current = true;
      
      try {
        const storeConfigs = [{ name: "config", keyPath: "id" }] as const;
        const config = await indexedDBService.get<StoredBanditConfigRecord>(
          "banditConfig",
          1,
          "config",
          "main",
          storeConfigs
        );
        
        const brandingConfig = config?.branding;

        debugLogger.info("Branding load attempt", {
          hasConfig: !!config,
          hasBrandingObject: !!brandingConfig,
          brandingContent: brandingConfig ? {
            hasText: !!brandingConfig.brandingText,
            hasLogo: !!brandingConfig.logoBase64,
            hasTheme: !!brandingConfig.theme,
            textValue: brandingConfig.brandingText,
            themeValue: brandingConfig.theme
          } : null
        });
        
        let loadedFromIndexedDB = false;
        let cdnBranding: StoredBrandingConfig | null = null;
        
        // NUCLEAR OPTION: If IndexedDB has ANY branding object at all, NEVER touch CDN
        const hasAnyBrandingObject = !!brandingConfig;
        
        // Enhanced protection: also check if any meaningful branding data exists
        const hasAnyBrandingData = brandingConfig && (
          brandingConfig.brandingText || 
          brandingConfig.logoBase64 || 
          brandingConfig.theme ||
          brandingConfig.hasTransparentLogo !== undefined ||
          brandingConfig.userSaved !== undefined
        );
        
        // Check if there's any evidence of user models (indicating user has used Management)
        const hasUserModels = await indexedDBService.getAll<StoredBanditConfigRecord>(
          "banditConfig",
          1,
          "config",
          storeConfigs
        );
        const hasCustomContent = hasUserModels.some(entry => 
          entry.id !== "main" && 
          entry.id !== "deletedModels" && 
          entry.id !== "preferences" && 
          entry.id !== "mcpTools" && 
          entry.id !== "knowledgeDocs"
        );
        
        // ABSOLUTE NUCLEAR PROTECTION: If there's ANY trace of branding or user activity, skip CDN entirely
        const shouldSkipCDN = hasAnyBrandingObject || hasAnyBrandingData || hasCustomContent;
        
        if (shouldSkipCDN) {
          debugLogger.info("🚫 NUCLEAR PROTECTION ACTIVATED - COMPLETELY SKIPPING CDN", {
            hasAnyBrandingObject,
            hasAnyBrandingData,
            hasCustomContent,
            brandingKeys: brandingConfig ? Object.keys(brandingConfig) : [],
            brandingValues: brandingConfig
          });
          
          // Use whatever is in IndexedDB, even if empty values
          if (brandingConfig) {
            setBranding({
              brandingText: brandingConfig.brandingText || "",
              logoBase64: brandingConfig.logoBase64 ?? undefined
            });
            
            if (brandingConfig.brandingText) {
              document.title = brandingConfig.brandingText;
            }
            
            setSelectedTheme(brandingConfig.theme || "bandit-dark");
          } else {
            setBranding(null);
            setSelectedTheme("bandit-dark");
          }
          loadedFromIndexedDB = true;
        }
        
        if (!loadedFromIndexedDB) {
          // Enhanced protection: Double-check that we should really load from CDN
          if (shouldSkipCDN) {
            debugLogger.warn("🚫 CDN LOAD BLOCKED: Branding protection still active even with !loadedFromIndexedDB");
            setBranding(null);
            setSelectedTheme("bandit-dark");
            loadedFromIndexedDB = true; // Prevent further CDN attempts
          } else {
            // No meaningful branding in IndexedDB, try to load from CDN config
            debugLogger.info("No meaningful branding found in IndexedDB, checking CDN config", {
              hasConfig: !!config,
              hasBrandingObject: !!brandingConfig,
              brandingKeys: brandingConfig ? Object.keys(brandingConfig) : []
            });
            const packageSettings = usePackageSettingsStore.getState().getSettings();
            
            if (packageSettings?.brandingConfigUrl) {
              try {
                const configResponse = await fetch(packageSettings.brandingConfigUrl);
                const configData: unknown = await configResponse.json();
                if (configData && typeof configData === "object" && "branding" in configData) {
                  const maybeBranding = (configData as { branding?: unknown }).branding;
                  if (maybeBranding && typeof maybeBranding === "object") {
                    cdnBranding = maybeBranding as StoredBrandingConfig;
                  }
                }
              } catch (err) {
                debugLogger.warn("Failed to load CDN branding config:", { error: err });
              }
            }

            if (cdnBranding) {
              debugLogger.info("Loading branding and theme from CDN config");
              
              // Set branding state
              setBranding({
                brandingText: cdnBranding.brandingText,
                logoBase64: cdnBranding.logoBase64 ?? undefined
              });
              
              // Set document title
              if (cdnBranding.brandingText) {
                document.title = cdnBranding.brandingText;
              }
              
              // Set theme
              setSelectedTheme(cdnBranding.theme || "bandit-dark");
              
              // NEVER save CDN branding to IndexedDB if ANY branding already exists
              // This prevents CDN from ever overwriting existing branding
              try {
                // Double-check that no branding exists before saving
                const existingConfig = await indexedDBService.get<StoredBanditConfigRecord>(
                  "banditConfig",
                  1,
                  "config",
                  "main",
                  storeConfigs
                );
                const hasAnyExistingBranding = existingConfig?.branding && (
                  existingConfig.branding.brandingText || 
                  existingConfig.branding.logoBase64 || 
                  existingConfig.branding.theme
                );
                
                if (!hasAnyExistingBranding) {
                  debugLogger.info("Saving CDN branding to IndexedDB as absolutely no branding exists");
                  
                  // Get current config to preserve any other data
                  const currentConfig: StoredBanditConfigRecord = existingConfig ?? { id: "main" };
                  
                  await indexedDBService.put<StoredBanditConfigRecord>("banditConfig", 1, "config", {
                    ...currentConfig,
                    id: "main",
                    branding: {
                      ...currentConfig.branding,
                      ...cdnBranding,
                      userSaved: false, // Mark as CDN-loaded, not user-saved
                    },
                  }, storeConfigs);
                  
                  debugLogger.info("CDN branding saved successfully");
                } else {
                  debugLogger.warn("SKIPPING CDN save - existing branding detected!", {
                    existingBranding: {
                      hasText: !!existingConfig.branding?.brandingText,
                      hasLogo: !!existingConfig.branding?.logoBase64,
                      hasTheme: !!existingConfig.branding?.theme,
                      userSaved: existingConfig.branding?.userSaved
                    }
                  });
                }
              } catch (putError) {
                debugLogger.warn("Failed to save CDN branding to IndexedDB:", { error: putError });
              }
            } else {
              // Fall back to Bandit defaults
              debugLogger.info("Using Bandit default branding and theme");
              setBranding(null);
              setSelectedTheme("bandit-dark");
            }
          }
        }
      } catch (err) {
        debugLogger.error("Failed to load branding and theme from IndexedDB", {
          error: err instanceof Error ? err.message : String(err),
        });
        // Fallback to default on error
        setBranding(null);
        setSelectedTheme("bandit-dark");
      } finally {
        setThemeLoading(false);
        setBrandingLoading(false);
        isBrandingLoadInProgressRef.current = false;
      }
    };

    loadBrandingAndTheme();

    // Listen for custom theme change events
    const handleThemeChange = () => {
      debugLogger.info("Chat received bandit-theme-changed event - checking if reload needed");
      
      // Don't reload if branding is already being loaded by another component
      if (isBrandingLoadInProgressRef.current) {
        debugLogger.info("Chat: Skipping branding reload - already in progress");
        return;
      }
      
      // Add a small delay to avoid race conditions with Management component
      setTimeout(() => {
        if (!isBrandingLoadInProgressRef.current) {
          debugLogger.info("Chat: Reloading branding after theme change");
          loadBrandingAndTheme();
        } else {
          debugLogger.info("Chat: Skipping delayed branding reload - still in progress");
        }
      }, 100);
    };

    window.addEventListener('bandit-theme-changed', handleThemeChange);

    return () => {
      window.removeEventListener('bandit-theme-changed', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    if (!chatContainerEl) return;
    const blurInputOnScroll = () => inputRef.current?.blur();
    chatContainerEl.addEventListener("scroll", blurInputOnScroll);
    return () => chatContainerEl.removeEventListener("scroll", blurInputOnScroll);
  }, [chatContainerEl]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const setViewportHeight = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    };
    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);
    return () => window.removeEventListener("resize", setViewportHeight);
  }, []);

  // Minimal visibility logic: show only when there is scrollable content and not at the bottom
  useEffect(() => {
    if (!chatContainerEl) return;

    let rafId: number | null = null;
    const update = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const s = getScrollState();
        setShowScrollToBottom(s.canScroll && !s.isNearBottom);
      });
    };

    update();
    // Listen to both native scroll and our custom state-changed event
    chatContainerEl.addEventListener('scroll', update, { passive: true });
    chatContainerEl.addEventListener(SCROLL_STATE_CHANGED_EVENT, update as EventListener);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      chatContainerEl.removeEventListener('scroll', update as EventListener);
      chatContainerEl.removeEventListener(SCROLL_STATE_CHANGED_EVENT, update as EventListener);
    };
  }, [chatContainerEl, getScrollState]);

  // IntersectionObserver-based visibility: observe the bottom sentinel (robust to padding)
  useEffect(() => {
    if (!chatContainerEl) return;

    let observer: IntersectionObserver | null = null;
    let rafId: number | null = null;
    let cancelled = false;

    const setup = () => {
      if (cancelled) return;
      const target = scrollTargetRef.current ?? scrollTargetEl;
      if (!target) {
        // Try again on the next frame (child may not be mounted yet)
        rafId = requestAnimationFrame(setup);
        return;
      }

      // If the sentinel is on-screen, we're at/near the bottom; otherwise show the button
      observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          const atBottom = entry?.isIntersecting ?? false;
          const s = getScrollState();
          setShowScrollToBottom(s.canScroll && !atBottom);
        },
        {
          root: chatContainerEl,
          threshold: 0.0,
          // Account for bottom padding (inputHeight) so "near bottom" counts as bottom
          rootMargin: `0px 0px ${Math.max(24, inputHeight + 48)}px 0px`,
        }
      );

      observer.observe(target);
    };

    rafId = requestAnimationFrame(setup);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, [chatContainerEl, scrollTargetEl, scrollTargetRef, getScrollState, inputHeight, history.length]);

  // Also update scroll button when content changes - but avoid during transitions
  useEffect(() => {
    // If we're transitioning between loading and content, delay the scroll state update
    const isTransitioning = isStreaming || (streamBuffer.trim() === "");
    const delay = isTransitioning ? 400 : 100; // Wait for transitions to complete
    
    const timer = setTimeout(() => {
      const scrollState = getScrollState();
      setShowScrollToBottom(scrollState.canScroll && !scrollState.isNearBottom);
    }, delay); // Small delay to let DOM update

    return () => clearTimeout(timer);
  }, [history, streamBuffer, getScrollState, isStreaming]);

  // Auto-scroll when new content is added - with smarter completion behavior
  useLayoutEffect(() => {
    const scrollState = getScrollState();
    const now = Date.now();

    if (isStreaming && scrollState.shouldAutoScroll && followStreamRef.current) {
      // During the initial grace window, avoid snapping to bottom so the previous answer stays visible
      if (now <= streamingGraceUntilRef.current) {
        return; // Grace effect handles offset scrolling
      }
      // After grace: follow the stream to bottom
      const scrollTimer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(scrollTimer);
    } else if (!isStreaming && scrollState.shouldAutoScroll) {
      // When streaming completes: wait for transition to complete before scrolling
      const scrollTimer = setTimeout(() => {
        const container = chatContainerRef.current;
        if (container && history.length > 0) {
          const lastMessage = history[history.length - 1];
          const isLongResponse = lastMessage?.answer && lastMessage.answer.length > 500;
          // Decide whether to follow the stream for the next turn based on current position
          followStreamRef.current = getScrollState().isNearBottom;

          if (isMobile) {
            // Mobile: Always scroll to show input on completion (better UX for thumb typing)
            scrollToBottom();
          } else if (!isLongResponse) {
            // Desktop: Auto-scroll for short responses
            scrollToBottom();
          }
          // For long responses on desktop: let user decide (don't auto-scroll)
        }
        
        // Update button visibility after auto-scroll decision
        if (!isMobile) {
          setTimeout(() => {
            const s = getScrollState();
            setShowScrollToBottom(s.canScroll && !s.isNearBottom);
          }, 100);
        }
      }, 350); // Wait for transition to complete
      return () => clearTimeout(scrollTimer);
    }
    // else: do nothing
  }, [history, isStreaming, scrollToBottom, getScrollState, isMobile, chatContainerRef]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (inputContainerRef.current)
        setInputHeight(inputContainerRef.current.offsetHeight);
    });
    if (inputContainerRef.current) {
      observer.observe(inputContainerRef.current);
      setInputHeight(inputContainerRef.current.offsetHeight);
    }
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!hydrated || !_hasHydrated) return;

    if (currentId === null) {
      useAIQueryStore.setState({ history: [] });
      setInputValue("");
      setResponse("");
      setComponentStatus("Idle");
      previousConversationIdRef.current = null;
      return;
    }

    const match = conversations.find((c) => c.id === currentId);
    if (!match) {
      return;
    }

    const conversationChanged = previousConversationIdRef.current !== match.id;

    useAIQueryStore.setState({ history: match.history });

    if (conversationChanged) {
      previousConversationIdRef.current = match.id;

      // Reset scroll button state when switching conversations
      setShowScrollToBottom(false);

      setInputValue("");
      setResponse("");
      setComponentStatus("Idle");
      setLogoVisible(true); // Explicitly show the logo when a new conversation starts or is hydrated

      // Update inputHeight in case of hard reload
      if (inputContainerRef.current) {
        setInputHeight(inputContainerRef.current.offsetHeight);
      }

      // Ensure scroll after layout on conversation switch or hard reload
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
          // Update scroll button state after conversation loads and scrolls
          setTimeout(() => {
            const scrollState = getScrollState();
            setShowScrollToBottom(scrollState.canScroll && !scrollState.isNearBottom);
          }, 150); // Allow time for scroll animation to complete
        });
      });
      return;
    }

    // For same conversation updates, keep the previous id reference but do not clear the input
    previousConversationIdRef.current = match.id;
  }, [
    hydrated,
    _hasHydrated,
    currentId,
    conversations,
    scrollToBottom,
    getScrollState,
    setInputValue,
    setResponse,
    setComponentStatus
  ]);

  // Debug conversation store state
  useEffect(() => {
    debugLogger.info("Chat component conversation state", {
      hasHydrated: _hasHydrated,
      conversationCount: conversations.length,
      currentId,
      firstFewConversations: conversations.slice(0, 3).map(c => ({ id: c.id, name: c.name, historyLength: c.history.length })),
      storeState: "main-chat"
    });
  }, [_hasHydrated, conversations, currentId]);

  // Initial scroll button state check after component fully loads
  useEffect(() => {
    if (!_hasHydrated || !chatContainerEl) return;

    // Sync via rAF to catch layout after content renders
    let rafId: number | null = null;
    const sync = () => {
      rafId = requestAnimationFrame(() => {
        const scrollState = getScrollState();
        setShowScrollToBottom(scrollState.canScroll && !scrollState.isNearBottom);
      });
    };
    sync();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [_hasHydrated, chatContainerEl, getScrollState, history.length]);

  const aiProvider = useAIProvider({
    overrideComponentStatus: setComponentStatus,
    setIsSubmitting,
    setIsStreaming,
    setResponseStarted,
    setResponse,
    setStreamBuffer,
    setPreviousQuestion,
    addHistory,
    setInputValue,
    setPastedImages,
    setPendingMessage,
    setLogoVisible,
    inputRef,
    isMobile,
    history,
    onError: (error) => {
      // Use the notification service to handle HTTP errors properly
      notificationService?.handleHttpError(error);
    },
  });

  const handleStop = useCallback(() => {
    try {
      aiProvider.cancel();
    } catch (error) {
      debugLogger.warn("AI provider cancel failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [aiProvider]);

  const handleVoiceInterrupt = useCallback(() => {
    try {
      ttsStop();
    } catch (error) {
      debugLogger.warn("Voice interrupt failed to stop TTS hook", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      stopTTS();
    } catch (error) {
      debugLogger.warn("Voice interrupt failed to stop streaming TTS", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (isStreaming) {
      handleStop();
    }
  }, [ttsStop, isStreaming, handleStop]);

  const handleSend = useCallback(
    (question: string, images: string[], displayQuestion?: string) => {
      const requestStartTime = trackRequestStart();
      
      // Immediate feedback - set pending message and loading state right away
      const questionForDisplay = displayQuestion || question;
      const pendingImages = images.length > 0 ? [...images] : undefined;
      setPendingMessage({ question: questionForDisplay, images: pendingImages });
    setIsStreaming(true); // Show skeleton immediately
    setResponseStarted(true); // Show loading feedback
    setStreamBuffer(""); // Clear any previous buffer
    
    // Immediately add placeholder entry to history for smooth UX
    const { addToCurrent } = useConversationStore.getState();
    const placeholderImages = pendingImages ? [...pendingImages] : undefined;
    addToCurrent({
      question: questionForDisplay,
      answer: "...",
      images: placeholderImages,
      placeholder: true,
      rawQuestion: question,
    });
    
    const getCurrentModel = useModelStore.getState().getCurrentModel;
    const systemPrompt =
      getCurrentModel()?.systemPrompt ?? "You are a helpful assistant.";

    const { currentId, conversations, createConversation, renameConversation } =
      useConversationStore.getState();
    const existing = conversations.find((c) => c.id === currentId);

    if (!existing) {
      generateName(question).then((name) => {
        createConversation(name || question);

        setLogoVisible(true);

        setTimeout(() => {
          const newCurrentId = useConversationStore.getState().currentId;
          if (!newCurrentId) return;

          setResponse("");
          
          // Add placeholder entry for new conversation too
          const { addToCurrent: addToNew } = useConversationStore.getState();
          const newPlaceholderImages = pendingImages ? [...pendingImages] : undefined;
          addToNew({
            question: questionForDisplay,
            answer: "...",
            images: newPlaceholderImages,
            placeholder: true,
            rawQuestion: question,
          });
          
          const providerImages = pendingImages ? [...pendingImages] : [];
          aiProvider(systemPrompt, question, providerImages);
        }, 0);
      });
      return;
    }

    // If the conversation is "New Conversation", rename it after first user message
    if (existing.name === "New Conversation") {
      generateName(question).then((newName) => {
        if (newName) {
          renameConversation(existing.id, newName);
        }
      });
    }
    
    // Decide whether to follow the stream for this message based on current position
    followStreamRef.current = getScrollState().isNearBottom;

    // Smart scrolling: on mobile, scroll to show AI response area; on desktop, scroll near-bottom (grace)
    if (isMobile) {
      // On mobile, scroll to position the AI response (skeleton) at the top of the viewport
      setTimeout(() => {
        const container = chatContainerRef.current;
        if (container) {
          // Wait for DOM to update with the new pending message
          setTimeout(() => {
            // Strategy: Find the AI response container and position it at the top of viewport
            // The skeleton appears in the last AIResponseTextField, so scroll to show that
            const containerHeight = container.clientHeight;
            const scrollHeight = container.scrollHeight;
            
            // Calculate position to show the AI response area where skeleton will appear
            // We want the AI response container to be at the top of the viewport
            // Leave a small buffer (about 50px) from the very top for breathing room
            const topBuffer = 50; 
            const targetPosition = Math.max(0, scrollHeight - containerHeight + topBuffer);
            
            if (followStreamRef.current) {
              container.scrollTo({
                top: targetPosition,
                behavior: "smooth"
              });
            }
          }, 100); // Delay for DOM updates
        }
      }, 50);
    } else {
      // On desktop, avoid snapping to absolute bottom at stream start
      // Respect the grace offset so the previous answer remains visible briefly
      setTimeout(() => {
        const container = chatContainerRef.current;
        if (container) {
          const offset = isMobile ? 20 : 28; // mirror GRACE_OFFSETs
          const targetTop = Math.max(0, container.scrollHeight - container.clientHeight - offset);
          if (followStreamRef.current) {
            container.scrollTo({ top: targetTop, behavior: "smooth" });
          }
        } else {
          // Fallback
          if (followStreamRef.current) scrollToBottom();
        }
        
        // Update button state after scroll
        setTimeout(() => {
          const scrollState = getScrollState();
          setShowScrollToBottom(scrollState.canScroll && !scrollState.isNearBottom);
        }, 120);
      }, 50);
    }
    
    setResponse("");

    const providerImages = pendingImages ? [...pendingImages] : [];
    aiProvider(systemPrompt, question, providerImages);
  },
  [
    aiProvider,
    chatContainerRef,
    generateName,
    getScrollState,
    isMobile,
    scrollToBottom,
    setIsStreaming,
    setLogoVisible,
    setPendingMessage,
    setResponse,
    setResponseStarted,
    setShowScrollToBottom,
    setStreamBuffer,
    trackRequestStart
  ]
  );

  const handleVoiceTranscription = useCallback(
    (text: string) => {
      const cleaned = text.trim();
      if (!cleaned) {
        return;
      }

      setInputValue("");
      setPastedImages([]);
      handleSend(cleaned, [], cleaned);
    },
    [handleSend, setInputValue, setPastedImages]
  );

  useVoiceMode({
    onTranscription: handleVoiceTranscription,
    onInterrupt: handleVoiceInterrupt,
    onError: (message) => notificationService?.showError?.(message),
  });

  useEffect(() => {
    const previouslyEnabled = previousVoiceModeEnabledRef.current;
    previousVoiceModeEnabledRef.current = isVoiceModeEnabled;

    if (!previouslyEnabled && isVoiceModeEnabled) {
      const latest = historyRef.current[historyRef.current.length - 1];
      lastSpokenResponseRef.current = latest?.answer ?? null;
    }

    if (previouslyEnabled && !isVoiceModeEnabled) {
      lastSpokenResponseRef.current = null;
      try {
        ttsStop();
      } catch (error) {
        debugLogger.warn("Voice mode disable failed to stop TTS hook", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      try {
        stopTTS();
      } catch (error) {
        debugLogger.warn("Voice mode disable failed to stop streaming TTS", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }, [isVoiceModeEnabled, ttsStop]);

  useEffect(() => {
    if (!isVoiceModeEnabled || !isStreaming) {
      return;
    }

    try {
      ttsStop();
    } catch (error) {
      debugLogger.warn("Voice mode stream start failed to stop TTS hook", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      stopTTS();
    } catch (error) {
      debugLogger.warn("Voice mode stream start failed to stop streaming TTS", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    lastSpokenResponseRef.current = null;
  }, [isStreaming, isVoiceModeEnabled, ttsStop]);

  useEffect(() => {
    if (!isVoiceModeEnabled) {
      lastSpokenResponseRef.current = null;
      return;
    }

    if (isStreaming) {
      return;
    }

    if (!isTTSAvailable || history.length === 0) {
      return;
    }

    const latest = history[history.length - 1];
    if (!latest?.answer || latest.answer === "..." || !latest.answer.trim()) {
      return;
    }

    if (lastSpokenResponseRef.current === latest.answer) {
      return;
    }

    const sanitizedAnswer = sanitizeForTTS(latest.answer);
    if (!sanitizedAnswer) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await ttsSpeak(sanitizedAnswer, { useStreaming: true, useRealtime: true });
        if (!cancelled) {
          lastSpokenResponseRef.current = latest.answer;
        }
      } catch (error) {
        if (!cancelled) {
          debugLogger.error("Voice mode auto playback failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [history, isStreaming, isVoiceModeEnabled, isTTSAvailable, ttsSpeak]);

  const handleModelChange = useCallback(
    (modelId: string) => {
      setSelectedModel(modelId);
    },
    [setSelectedModel]
  );

  const handleVoiceChange = useCallback(async (voiceId: string) => {
    // Stop any current TTS playback FIRST
    ttsStop();
    stopTTS(); // Extra insurance against voice mixing
    
    // Then set the new voice
    setSelectedVoice(voiceId);
    
    const voiceName = voiceId.split("-")[1];
    const defaultModel = usePackageSettingsStore.getState().settings?.defaultModel;
    
    // Get the friendly display name for the personality (use selectedModel which is the Bandit personality)
    const currentModelConfig = availableModels.find(m => m.name === selectedModel);
    const personalityName = currentModelConfig ? currentModelConfig.name.replace("Bandit-", "Bandit ") : (selectedModel || defaultModel || "Bandit");
    
    if (isTTSAvailable) {
      try {
        // Small delay to ensure TTS cleanup is complete and new voice is set
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Create the greeting directly - no AI generation needed
        const greetingText = `Hi, I'm ${personalityName} speaking with ${voiceName}'s voice.`;
        
        // Speak the greeting directly
        await ttsSpeak(greetingText, { useStreaming: true });
        
      } catch (ttsError) {
        debugLogger.error('TTS failed for voice greeting:', { error: ttsError instanceof Error ? ttsError.message : String(ttsError) });
      }
    }
  }, [availableModels, selectedModel, isTTSAvailable, ttsStop, ttsSpeak, setSelectedVoice]);

  const handleScrollToBottomClick = () => {
    scrollToBottom();
    // Proactively re-check visibility on the next frame(s)
    const container = chatContainerRef.current;
    if (container) {
      let frames = 0;
      const pump = () => {
        frames += 1;
        const s = getScrollState();
        setShowScrollToBottom(s.canScroll && !s.isNearBottom);
        if (frames < 6) requestAnimationFrame(pump);
      };
      requestAnimationFrame(pump);
    }
  };




  if (!hydrated || brandingLoading || themeLoading) return null;

  const userHasAccess =
    playgroundBypassAccess ||
    ossMode ||
    claims?.roles?.includes("super-user") ||
    claims?.roles?.includes("admin");

  if (!userHasAccess) {
    return (
      <ThemeProvider theme={banditTheme}>
        <CssBaseline />
        <UnderReview />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={banditTheme}>
      <CssBaseline />
      <Box
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          maxHeight: "100dvh",
          overflow: "hidden",
          bgcolor: theme.palette.chat.shell,
          color: theme.palette.text.primary,
          position: "fixed",
          top: 0,
          left: drawerOpen && !isMobile ? "340px" : 0,
          width: drawerOpen && !isMobile ? "calc(100vw - 340px)" : "100vw",
          zIndex: 0,
          transition: "left 0.3s ease-in-out, width 0.3s ease-in-out",
        })}
      >
        <ChatAppBar
          availableModels={availableModels}
          handleModelChange={handleModelChange}
          selectedVoice={selectedVoice}
          availableVoices={availableVoices}
          handleVoiceChange={handleVoiceChange}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
        />
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflowY: logoOnly ? "hidden" : "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            px: isMobile ? 1 : 2, // Reduce padding on mobile for better width utilization
            pb: logoOnly ? 0 : `${inputHeight + 24}px`,
            maxHeight: isMobile ? "calc(var(--vh, 1vh) * 100)" : "100%",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            position: "relative",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pt: 2,
            }}
          >
            {logoShouldRender && !brandingLoading && (
              branding?.logoBase64 ? (
                <CustomLogo visible={logoVisible} atTop />
              ) : (
                <BanditChatLogo visible={logoVisible} atTop />
              )
            )}
            <Box
              sx={{
                margin: "0 auto",
                width: "100%",
                maxWidth: isMobile ? "100%" : "768px",
                flexShrink: 0,
                px: isMobile ? 0 : 0,
              }}
            >
              <ChatMessages
                isStreaming={isStreaming}
                history={history}
                pendingMessage={pendingMessage}
                streamBuffer={streamBuffer}
                isMobile={isMobile}
                scrollTargetRef={scrollTargetRef}
                responseStarted={responseStarted}
                isNetworkSlow={isSlowConnection}
                showInstantFeedback={true}
                selectedModel={selectedModel}
                availableModels={availableModels}
              />
            </Box>
          </Box>
        </Box>

        {showScrollToBottom && (
          <ChatScrollToBottomButton
            inputHeight={inputHeight}
            drawerOpen={drawerOpen}
            isMobile={isMobile}
            onClick={handleScrollToBottomClick}
          />
        )}

        {history.length === 0 && componentStatus !== "Loading" && !isMobile && (
          <Box
            sx={(theme) => ({
              position: "absolute",
              bottom: `${inputHeight + 160}px`,
              textAlign: "center",
              width: "100%",
              color: theme.palette.mode === "light" ? "#555" : "#ccc",
              fontSize: "0.95rem",
              fontWeight: 500,
              fontStyle: "italic",
              opacity: 0.9,
              textShadow:
                theme.palette.mode === "dark"
                  ? "0 0 4px rgba(0,0,0,0.4)"
                  : "0 0 2px rgba(255,255,255,0.4)",
              transition: "opacity 0.3s ease",
              pointerEvents: "none",
            })}
          >
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "auto",
            width: "100vw",
            maxWidth: "768px",
          }}
        >
          <Box sx={{ flex: "1 1 auto" }}></Box>
          {history.length === 0 && componentStatus !== "Loading" && !pendingMessage && preferences.chatSuggestionsEnabled && (
            <Box sx={{ marginBottom: "20px" }}>
              <QuerySuggestionPicker onSend={handleSend} inputHeight={inputHeight} />
            </Box>
          )}

          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            pastedImages={pastedImages}
            setPastedImages={setPastedImages}
            inputRef={inputRef}
            inputContainerRef={inputContainerRef}
            isMobile={isMobile}
            inputHeight={inputHeight}
            setInputHeight={setInputHeight}
            isSubmitting={isSubmitting}
            isStreaming={isStreaming}
            onSend={handleSend}
            onStop={handleStop}
            selectedModel={selectedModel}
            availableModels={availableModels}
            handleModelChange={handleModelChange}
            selectedVoice={selectedVoice}
            availableVoices={availableVoices}
            handleVoiceChange={handleVoiceChange}
          />
        </Box>

        {preferences.feedbackEnabled && !isMobile && (
          <FeedbackButton 
            fullScreen={false}
            zIndex={1300}
            feedbackEmail={packageSettings?.feedbackEmail}
            absolute={true}
            position={{
              bottom: 20,
              right: 20,
            }}
          />
        )}

        {/* Connection status indicator */}
        <ConnectionStatus position="top" showWhenGood={false} />

      </Box>
    </ThemeProvider>
  );
};

const Chat = () => {
  const featureFlag = useFeatureFlag();
  const { isOSSMode } = featureFlag;
  const packageSettings = usePackageSettingsStore((state) => state.settings);

  if (!packageSettings) {
    return null;
  }

  const ossConfigured = !packageSettings.featureFlags?.subscriptionType;
  const allowUnauthenticated = isOSSMode() || ossConfigured;
  const playgroundBypassAuth = packageSettings.playgroundBypassAuth;
  const isPlaygroundRoute = typeof window !== "undefined" && window.location.pathname.includes("/playground");
  const bypassAuth = playgroundBypassAuth || isPlaygroundRoute;
  debugLogger.info("Chat authentication gate", {
    ossConfigured,
    isOSSMode: isOSSMode(),
    tier: featureFlag.getEvaluation()?.tier,
    hasToken: authenticationService.isAuthenticated(),
    playgroundBypassAuth,
    isPlaygroundRoute,
    bypassAuth,
  });

  if (!allowUnauthenticated && !bypassAuth && !authenticationService.isAuthenticated()) {
    debugLogger.debug("User is not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return <ChatContent />;
};

export default Chat;
