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

// Bandit Engine Watermark: BL-WM-CB36-E68584
const __banditFingerprint_hooks_useAutoScrollts = 'BL-FP-CB225C-6283';
const __auditTrail_hooks_useAutoScrollts = 'BL-AU-MGOIKVVE-3F6Z';
// File: useAutoScroll.ts | Path: src/hooks/useAutoScroll.ts | Hash: cb366283

import { useRef, useEffect, useCallback } from "react";

// A stable event name that components can listen to for scroll state updates
export const SCROLL_STATE_CHANGED_EVENT = 'scrollStateChanged';

interface UseAutoScrollOptions {
  threshold?: number; // Distance from bottom to consider "near bottom"
  behavior?: ScrollBehavior;
  enabled?: boolean;
  isMobile?: boolean; // Add mobile flag for smart scrolling
}

export const useAutoScroll = (options: UseAutoScrollOptions = {}) => {
  const {
    threshold = 100,
    behavior = "smooth",
    enabled = true,
    isMobile = false,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Check if user is near bottom
  const isNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Consider "near bottom" if within threshold pixels, with a minimum of 10px
    // to ensure reliable detection after scrollToBottom() completes
    const effectiveThreshold = Math.max(threshold, 10);
    return distanceFromBottom <= effectiveThreshold;
  }, [threshold]);

  // Scroll to bottom with mobile-aware behavior
  const scrollToBottom = useCallback((forceBehavior?: ScrollBehavior) => {
    if (!enabled) return;
    
    const container = containerRef.current;
    if (container) {
      // Use scrollTop directly to avoid scrollIntoView issues
      const scrollBehavior = forceBehavior || behavior;
      
      if (isMobile) {
        // On mobile, scroll to show content optimally (not necessarily the very bottom)
        const optimalScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
        if (scrollBehavior === "smooth") {
          container.scrollTo({
            top: optimalScrollTop,
            behavior: "smooth"
          });
        } else {
          container.scrollTop = optimalScrollTop;
        }
      } else {
        // Desktop behavior - scroll to absolute bottom
        if (scrollBehavior === "smooth") {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
          });
        } else {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
  }, [enabled, behavior, isMobile]);

  // Force scroll to bottom (ignores auto-scroll state)
  const forceScrollToBottom = useCallback(() => {
    scrollToBottom("smooth");
    
    // Ensure button state updates after forced scroll using rAF to catch the end of scroll
    const container = containerRef.current;
    if (container) {
      let rafId: number | null = null;
      let attempts = 0;

      const tick = () => {
        attempts += 1;
        // Dispatch on each frame so listeners can update progressively
  container.dispatchEvent(new CustomEvent(SCROLL_STATE_CHANGED_EVENT));

        // Stop once we're near bottom or after a reasonable number of frames
        if (isNearBottom() || attempts > 30) {
          if (rafId) cancelAnimationFrame(rafId);
          return;
        }
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    }
  }, [scrollToBottom, isNearBottom]);

  // Auto-scroll if conditions are met
  const autoScrollIfNeeded = useCallback(() => {
    if (enabled && shouldAutoScrollRef.current && isNearBottom()) {
      scrollToBottom();
      
      // Dispatch event(s) to update UI state after auto-scroll using rAF
      const container = containerRef.current;
      if (container) {
        let rafId: number | null = null;
        let frames = 0;
        const pump = () => {
          frames += 1;
          container.dispatchEvent(new CustomEvent(SCROLL_STATE_CHANGED_EVENT));
          if (frames < 20) {
            rafId = requestAnimationFrame(pump);
          } else if (rafId) {
            cancelAnimationFrame(rafId);
          }
        };
        rafId = requestAnimationFrame(pump);
      }
    }
  }, [enabled, isNearBottom, scrollToBottom]);

  // Handle scroll events to determine if user manually scrolled
  const containerElement = containerRef.current;

  useEffect(() => {
    if (!containerElement) return;

    const handleScroll = () => {
      const currentlyNearBottom = isNearBottom();

      // Update auto-scroll state based on current position
      shouldAutoScrollRef.current = currentlyNearBottom;

      // Always dispatch scroll state change event to ensure UI updates
      containerElement.dispatchEvent(new CustomEvent(SCROLL_STATE_CHANGED_EVENT));
    };

    containerElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => containerElement.removeEventListener("scroll", handleScroll);
  }, [containerElement, isNearBottom]);

  // Auto-scroll on content changes
  useEffect(() => {
    autoScrollIfNeeded();
  });

  // Get scroll state info
  const getScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return {
        isNearBottom: true,
        shouldAutoScroll: true,
        canScroll: false,
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
      };
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const canScroll = scrollHeight > clientHeight;
    const nearBottom = isNearBottom();
    
    // Update the ref to reflect current state
    shouldAutoScrollRef.current = nearBottom;

    return {
      isNearBottom: nearBottom,
      shouldAutoScroll: nearBottom,
      canScroll,
      scrollTop,
      scrollHeight,
      clientHeight,
    };
  }, [isNearBottom]);

  return {
    containerRef,
    targetRef,
    scrollToBottom: forceScrollToBottom,
    autoScrollIfNeeded,
    getScrollState,
    isNearBottom,
  };
};
