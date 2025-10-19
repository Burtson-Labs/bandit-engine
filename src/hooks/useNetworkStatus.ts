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

// Bandit Engine Watermark: BL-WM-9120-F74DEA
const __banditFingerprint_hooks_useNetworkStatusts = 'BL-FP-517F02-D84F';
const __auditTrail_hooks_useNetworkStatusts = 'BL-AU-MGOIKVVE-S29A';
// File: useNetworkStatus.ts | Path: src/hooks/useNetworkStatus.ts | Hash: 9120d84f

import { useState, useEffect, useCallback } from "react";

type NetworkEffectiveType = "slow-2g" | "2g" | "3g" | "4g";

interface NetworkInformation extends EventTarget {
  readonly effectiveType?: NetworkEffectiveType;
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
  onchange?: ((this: NetworkInformation, ev: Event) => unknown) | null;
  addEventListener(
    type: "change",
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: "change",
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionQuality: "fast" | "slow" | "offline";
  lastRequestTime: number;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionQuality: "fast",
    lastRequestTime: 0,
  });

  // Track request timing to detect slow connections
  const trackRequestStart = useCallback(() => {
    const startTime = Date.now();
    setNetworkStatus(prev => ({ ...prev, lastRequestTime: startTime }));
    return startTime;
  }, []);

  const trackRequestEnd = useCallback((startTime: number) => {
    const duration = Date.now() - startTime;
    const isSlowConnection = duration > 2000; // Consider >2s as slow
    
    setNetworkStatus(prev => ({
      ...prev,
      isSlowConnection,
      connectionQuality: !navigator.onLine 
        ? "offline" 
        : isSlowConnection 
          ? "slow" 
          : "fast",
    }));
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ 
        ...prev, 
        isOnline: true, 
        connectionQuality: prev.isSlowConnection ? "slow" : "fast" 
      }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ 
        ...prev, 
        isOnline: false, 
        connectionQuality: "offline" 
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Detect slow connection using Connection API if available
  useEffect(() => {
    const { connection } = navigator as NavigatorWithConnection;
    if (connection) {
      
      const updateConnectionInfo = () => {
        // Consider 2g/slow-2g as slow connections
        const slowConnections = ['slow-2g', '2g'];
        const isSlowConnection = slowConnections.includes(connection.effectiveType);
        
        setNetworkStatus(prev => ({
          ...prev,
          isSlowConnection,
          connectionQuality: !navigator.onLine 
            ? "offline" 
            : isSlowConnection 
              ? "slow" 
              : "fast",
        }));
      };

      updateConnectionInfo();

      const handleChange = () => updateConnectionInfo();

      if (typeof connection.addEventListener === "function") {
        connection.addEventListener("change", handleChange);
        return () => connection.removeEventListener("change", handleChange);
      }

      if (connection) {
        connection.onchange = handleChange;
        return () => {
          if (connection.onchange === handleChange) {
            connection.onchange = null;
          }
        };
      }
    }
  }, []);

  return {
    ...networkStatus,
    trackRequestStart,
    trackRequestEnd,
  };
};
