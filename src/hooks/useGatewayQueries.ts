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

// Bandit Engine Watermark: BL-WM-3096-F9AF1C
const __banditFingerprint_hooks_useGatewayQueriests = 'BL-FP-52A0D3-0867';
const __auditTrail_hooks_useGatewayQueriests = 'BL-AU-MGOIKVVE-4U8X';
// File: useGatewayQueries.ts | Path: src/hooks/useGatewayQueries.ts | Hash: 30960867

import { useMemo } from "react";
import { lastValueFrom } from "rxjs";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { usePackageSettingsStore } from "../store/packageSettingsStore";
import { GatewayService } from "../services/gateway/gateway.service";
import { authenticationService } from "../services/auth/authenticationService";
import {
  GatewayHealthResponse,
  GatewayMemoryResponse,
  GatewayModel
} from "../services/gateway/interfaces";

export type GatewayQueryOptions<TData> = Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn">;

const useGatewayClient = () => {
  const settings = usePackageSettingsStore((state) => state.settings);
  const gatewayUrl = settings?.gatewayApiUrl;
  const feedbackEmail = settings?.feedbackEmail;

  const service = useMemo<GatewayService | null>(() => {
    if (!gatewayUrl) {
      return null;
    }

    return new GatewayService(
      gatewayUrl,
      () => authenticationService.getToken(),
      feedbackEmail
    );
  }, [gatewayUrl, feedbackEmail]);

  return { service, gatewayUrl };
};

export const useGatewayHealth = (
  options?: GatewayQueryOptions<GatewayHealthResponse>
) => {
  const { service, gatewayUrl } = useGatewayClient();
  const enabled = Boolean(service && gatewayUrl) && (options?.enabled ?? true);

  return useQuery<GatewayHealthResponse, Error>({
    ...options,
    queryKey: ["gateway", "health", gatewayUrl],
    queryFn: async () => {
      if (!service) {
        throw new Error("Gateway service is not configured");
      }
      return lastValueFrom(service.getHealth());
    },
    enabled
  });
};

export const useGatewayModels = (
  options?: GatewayQueryOptions<GatewayModel[]>
) => {
  const { service, gatewayUrl } = useGatewayClient();
  const enabled = Boolean(service && gatewayUrl) && (options?.enabled ?? true);

  return useQuery<GatewayModel[], Error>({
    ...options,
    queryKey: ["gateway", "models", gatewayUrl],
    queryFn: async () => {
      if (!service) {
        throw new Error("Gateway service is not configured");
      }
      return lastValueFrom(service.listModels());
    },
    enabled
  });
};

export const useGatewayMemory = (
  options?: GatewayQueryOptions<GatewayMemoryResponse>
) => {
  const { service, gatewayUrl } = useGatewayClient();
  const enabled = Boolean(service && gatewayUrl) && (options?.enabled ?? true);

  return useQuery<GatewayMemoryResponse, Error>({
    ...options,
    queryKey: ["gateway", "memory", gatewayUrl],
    queryFn: async () => {
      if (!service) {
        throw new Error("Gateway service is not configured");
      }
      return lastValueFrom(service.getMemory());
    },
    enabled
  });
};
