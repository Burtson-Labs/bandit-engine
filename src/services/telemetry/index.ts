/**
 * Opt-in telemetry for bandit-engine. OFF unless a consumer sets
 * PackageSettings.telemetry.enabled = true. Sends one OTLP trace + a few
 * metrics per chat turn to the configured collector (default otlp.burtson.ai,
 * which feeds grafana.burtson.ai), tagged service.name = "bandit-web".
 *
 * Usage from the chat loop (all no-ops when telemetry is disabled):
 *   syncTelemetry();                       // build/refresh exporter from settings
 *   telemetryStartTurn(question, model);
 *   telemetryEvent("tool_loop:llm_start");
 *   telemetryEvent("tool_loop:llm_chunk", { chunk });
 *   telemetryEvent("tool_loop:tool_execute", { name, params });
 *   telemetryEvent("tool_loop:tool_result", { name, isError });
 *   telemetryEndTurn({ error });
 */
import { TelemetryExporter, resolveTelemetryConfig } from "./otlpExporter";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { authenticationService } from "../auth/authenticationService";

export type { TelemetryConfig, TelemetryOptIn } from "./otlpExporter";
export { TelemetryExporter, resolveTelemetryConfig } from "./otlpExporter";

let active: TelemetryExporter | null = null;

/**
 * (Re)build the active exporter from current PackageSettings + the signed-in
 * token. Cheap; safe to call at the start of every turn so settings/token
 * changes take effect immediately. Returns true when telemetry is enabled.
 */
export function syncTelemetry(): boolean {
  try {
    const settings = usePackageSettingsStore.getState().settings;
    const cfg = resolveTelemetryConfig({
      telemetry: settings?.telemetry,
      banditApiKey: authenticationService.getToken() ?? undefined,
    });
    active = cfg ? new TelemetryExporter(cfg) : null;
  } catch {
    active = null;
  }
  return active !== null;
}

export function telemetryStartTurn(goal: string, model: string): void {
  active?.startTurn(goal, model);
}

export function telemetryEvent(type: string, payload?: unknown): void {
  active?.onEvent(type, payload);
}

export function telemetryEndTurn(outcome?: { error?: string }): void {
  void active?.endTurn(outcome);
}

export function isTelemetryActive(): boolean {
  return active !== null;
}
