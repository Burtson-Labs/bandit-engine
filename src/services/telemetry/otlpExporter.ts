/**
 * SDK-less OTLP/HTTP telemetry exporter for bandit-engine.
 *
 * Opt-in, OFF BY DEFAULT. Sends one trace per chat turn (root span
 * `agent.turn` with child `llm.generate` + `tool.*` spans) plus a few usage
 * metrics (tokens, TTFT, turn duration) to an OTLP/HTTP endpoint — by default
 * `otlp.burtson.ai`, which feeds grafana.burtson.ai.
 *
 * No `@opentelemetry/*` dependency on purpose — hand-rolled OTLP JSON over
 * `fetch`, so consumers carry zero telemetry weight. Browser-safe (Web Crypto
 * + global `fetch`, no Node-only imports).
 *
 * Privacy: prompt/completion text is NEVER attached; the only free-text
 * attributes (turn goal, a tool's primary param) are truncated and run through
 * a light secret redactor. Ported from the bandit-agent-framework's
 * agent-core/telemetry/otlpExporter.ts so Bandit cloud + the CLI/IDE emit the
 * same shape.
 */
import { debugLogger } from "../logging/debugLogger";

/** Light secret redaction for the few free-text attributes we attach. */
function redactSecretsString(s: string): string {
  return s
    .replace(/\b(?:sk|tvly|ghp|gho|pk|rk)[-_][A-Za-z0-9]{8,}\b/gi, "[redacted]")
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-jwt]")
    .replace(/\bBearer\s+[A-Za-z0-9._-]{8,}/gi, "Bearer [redacted]");
}

export interface TelemetryConfig {
  endpoint: string;
  headers: Record<string, string>;
  mode: "metrics+traces" | "metrics-only";
  serviceName: string;
}

/** Package-level opt-in config a consumer passes via PackageSettings.telemetry. */
export interface TelemetryOptIn {
  enabled?: boolean;
  endpoint?: string;
  mode?: "metrics+traces" | "metrics-only";
  headers?: Record<string, string>;
  serviceName?: string;
}

/**
 * Resolve the effective telemetry config, or `null` when disabled. Bearer
 * defaults to the supplied bandit/gateway token unless an explicit
 * Authorization header is provided.
 */
export function resolveTelemetryConfig(opts: {
  telemetry?: TelemetryOptIn;
  banditApiKey?: string;
}): TelemetryConfig | null {
  if (!opts.telemetry?.enabled) return null;

  const endpoint = (opts.telemetry.endpoint ?? "https://otlp.burtson.ai").replace(/\/+$/, "");
  const headers: Record<string, string> = { ...(opts.telemetry.headers ?? {}) };
  const hasAuth = Object.keys(headers).some((k) => k.toLowerCase() === "authorization");
  if (!hasAuth && opts.banditApiKey) {
    headers["Authorization"] = `Bearer ${opts.banditApiKey}`;
  }
  const mode = opts.telemetry.mode ?? "metrics+traces";
  // Default OTLP service.name. Consumers (other Bandit websites / the stealth
  // web agent runner) override via PackageSettings.telemetry.serviceName, e.g.
  // "bandit-stealth-web". The "bandit-" prefix keeps the whole fleet
  // filterable in Grafana as service.name =~ "bandit-.*".
  return { endpoint, headers, mode, serviceName: opts.telemetry.serviceName ?? "bandit-web" };
}

// ---------- OTLP JSON helpers ----------

type AttrVal = string | number | boolean;
type KeyValue = { key: string; value: Record<string, unknown> };

function toAttrs(rec: Record<string, AttrVal | undefined>): KeyValue[] {
  const out: KeyValue[] = [];
  for (const [key, v] of Object.entries(rec)) {
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "boolean") out.push({ key, value: { boolValue: v } });
    else if (typeof v === "number")
      out.push({ key, value: Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v } });
    else out.push({ key, value: { stringValue: v } });
  }
  return out;
}

const webCrypto = (globalThis as unknown as { crypto?: { getRandomValues<T extends ArrayBufferView>(a: T): T } }).crypto;
function hex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (webCrypto?.getRandomValues) webCrypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
const nano = (ms: number): string => String(Math.round(ms * 1e6));

export const TTFT_BUCKETS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 30];
export const DURATION_BUCKETS = [0.5, 1, 2, 5, 10, 30, 60, 120, 300];

function histogramPoint(
  value: number,
  bounds: number[],
  attrs: Record<string, AttrVal | undefined>,
  startMs: number,
  endMs: number
): Record<string, unknown> {
  const counts = new Array(bounds.length + 1).fill(0);
  let idx = bounds.findIndex((b) => value <= b);
  if (idx === -1) idx = bounds.length;
  counts[idx] = 1;
  return {
    attributes: toAttrs(attrs),
    startTimeUnixNano: nano(startMs),
    timeUnixNano: nano(endMs),
    count: "1",
    sum: value,
    bucketCounts: counts.map(String),
    explicitBounds: bounds,
  };
}

function sumPoint(
  value: number,
  attrs: Record<string, AttrVal | undefined>,
  startMs: number,
  endMs: number
): Record<string, unknown> {
  return {
    attributes: toAttrs(attrs),
    startTimeUnixNano: nano(startMs),
    timeUnixNano: nano(endMs),
    asInt: String(Math.round(value)),
  };
}

interface SpanRec {
  spanId: string;
  parentSpanId?: string;
  name: string;
  startMs: number;
  endMs?: number;
  attrs: Record<string, AttrVal | undefined>;
  error?: string;
}

const clip = (s: string, n = 120): string => redactSecretsString(s.slice(0, n)).slice(0, n);

type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal }
) => Promise<unknown>;

export class TelemetryExporter {
  private readonly cfg: TelemetryConfig;
  private readonly now: () => number;

  private traceId = "";
  private turn: SpanRec | null = null;
  private llm: SpanRec | null = null;
  private llmFirstChunkMs = 0;
  private openTools: SpanRec[] = [];
  private completedSpans: SpanRec[] = [];
  private model = "";
  private turnChunkChars = 0;
  private turnTokens = 0;
  private ttftSeconds: number | null = null;

  constructor(cfg: TelemetryConfig, opts?: { now?: () => number }) {
    this.cfg = cfg;
    this.now = opts?.now ?? (() => Date.now());
  }

  startTurn(goal: string, model: string): void {
    this.traceId = hex(16);
    this.model = model;
    this.turnChunkChars = 0;
    this.turnTokens = 0;
    this.ttftSeconds = null;
    this.llm = null;
    this.llmFirstChunkMs = 0;
    this.openTools = [];
    this.completedSpans = [];
    this.turn = {
      spanId: hex(8),
      name: "agent.turn",
      startMs: this.now(),
      attrs: { "gen_ai.request.model": model, "bandit.turn.goal": clip(goal, 160) },
    };
  }

  /** Fed from the chat turn lifecycle. Best-effort; swallows bad payloads. */
  onEvent(type: string, payload?: unknown): void {
    if (!this.turn) return;
    try {
      const p = (payload ?? {}) as Record<string, unknown>;
      switch (type) {
        case "tool_loop:llm_start":
          this.llm = {
            spanId: hex(8),
            parentSpanId: this.turn.spanId,
            name: "llm.generate",
            startMs: this.now(),
            attrs: { "gen_ai.request.model": this.model },
          };
          this.llmFirstChunkMs = 0;
          break;
        case "tool_loop:llm_chunk": {
          const chunk = typeof p.chunk === "string" ? p.chunk : "";
          if (this.llm && this.llmFirstChunkMs === 0 && chunk.length > 0) {
            this.llmFirstChunkMs = this.now();
            const ttft = (this.llmFirstChunkMs - this.llm.startMs) / 1000;
            if (this.ttftSeconds === null) this.ttftSeconds = ttft;
            this.llm.attrs["bandit.llm.ttft_seconds"] = ttft;
          }
          this.turnChunkChars += chunk.length;
          this.turnTokens = Math.floor(this.turnChunkChars / 4);
          break;
        }
        case "tool_loop:llm_response":
          if (this.llm) {
            this.llm.endMs = this.now();
            if (typeof p.responseLength === "number") this.llm.attrs["bandit.llm.response_chars"] = p.responseLength;
            this.completedSpans.push(this.llm);
            this.llm = null;
          }
          break;
        case "tool_loop:tool_execute": {
          const name = typeof p.name === "string" ? p.name : "tool";
          const params = (p.params ?? {}) as Record<string, string>;
          const primary = params.query ?? params.url ?? params.prompt ?? params.topic ?? "";
          this.openTools.push({
            spanId: hex(8),
            parentSpanId: this.turn.spanId,
            name: `tool.${name}`,
            startMs: this.now(),
            attrs: { "bandit.tool.name": name, "bandit.tool.primary": primary ? clip(primary) : undefined },
          });
          break;
        }
        case "tool_loop:tool_result":
        case "tool_loop:tool_error": {
          const name = typeof p.name === "string" ? p.name : undefined;
          const span = this.takeOpenTool(name);
          if (span) {
            span.endMs = this.now();
            if (type === "tool_loop:tool_error" || p.isError === true) span.error = "tool error";
            this.completedSpans.push(span);
          }
          break;
        }
      }
    } catch {
      /* telemetry must never break a turn */
    }
  }

  private takeOpenTool(name?: string): SpanRec | undefined {
    if (name) {
      for (let i = this.openTools.length - 1; i >= 0; i -= 1) {
        if (this.openTools[i].name === `tool.${name}`) return this.openTools.splice(i, 1)[0];
      }
    }
    return this.openTools.shift();
  }

  /** Close the turn, build OTLP traces + metrics, and flush. Never rejects. */
  async endTurn(outcome?: { error?: string }): Promise<void> {
    const turn = this.turn;
    if (!turn) return;
    this.turn = null;
    const end = this.now();
    if (this.llm && !this.llm.endMs) {
      this.llm.endMs = end;
      this.completedSpans.push(this.llm);
      this.llm = null;
    }
    for (const t of this.openTools.splice(0)) {
      t.endMs = end;
      t.error = t.error ?? "incomplete";
      this.completedSpans.push(t);
    }
    turn.endMs = end;
    if (outcome?.error) turn.error = outcome.error;

    const traceId = this.traceId;
    const spans = [turn, ...this.completedSpans];

    const jobs: Array<Promise<void>> = [];
    if (this.cfg.mode === "metrics+traces") jobs.push(this.post("/v1/traces", this.buildTraces(traceId, spans)));
    jobs.push(this.post("/v1/metrics", this.buildMetrics(turn)));
    try {
      await Promise.all(jobs);
    } catch {
      /* best-effort */
    }
  }

  private buildTraces(traceId: string, spans: SpanRec[]): unknown {
    return {
      resourceSpans: [
        {
          resource: { attributes: toAttrs({ "service.name": this.cfg.serviceName }) },
          scopeSpans: [
            {
              scope: { name: this.cfg.serviceName },
              spans: spans.map((s) => ({
                traceId,
                spanId: s.spanId,
                parentSpanId: s.parentSpanId,
                name: s.name,
                kind: 1,
                startTimeUnixNano: nano(s.startMs),
                endTimeUnixNano: nano(s.endMs ?? s.startMs),
                attributes: toAttrs(s.attrs),
                status: s.error ? { code: 2, message: s.error.slice(0, 200) } : { code: 1 },
              })),
            },
          ],
        },
      ],
    };
  }

  private buildMetrics(turn: SpanRec): unknown {
    const start = turn.startMs;
    const end = turn.endMs ?? this.now();
    const metrics: unknown[] = [];
    if (this.turnTokens > 0) {
      metrics.push({
        name: "bandit.llm.tokens",
        sum: {
          aggregationTemporality: 1,
          isMonotonic: true,
          dataPoints: [sumPoint(this.turnTokens, { type: "output", "gen_ai.request.model": this.model }, start, end)],
        },
      });
    }
    if (this.ttftSeconds !== null) {
      metrics.push({
        name: "bandit.llm.ttft",
        unit: "s",
        histogram: {
          aggregationTemporality: 1,
          dataPoints: [histogramPoint(this.ttftSeconds, TTFT_BUCKETS, { "gen_ai.request.model": this.model }, start, end)],
        },
      });
    }
    metrics.push({
      name: "bandit.turn.duration",
      unit: "s",
      histogram: {
        aggregationTemporality: 1,
        dataPoints: [histogramPoint((end - start) / 1000, DURATION_BUCKETS, { "gen_ai.request.model": this.model }, start, end)],
      },
    });
    return {
      resourceMetrics: [
        {
          resource: { attributes: toAttrs({ "service.name": this.cfg.serviceName }) },
          scopeMetrics: [{ scope: { name: this.cfg.serviceName }, metrics }],
        },
      ],
    };
  }

  private async post(path: string, body: unknown): Promise<void> {
    const doFetch = (globalThis as unknown as { fetch?: FetchLike }).fetch;
    if (!doFetch) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      await doFetch(`${this.cfg.endpoint}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.cfg.headers },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (e) {
      debugLogger.debug("[telemetry] OTLP post failed", {
        path,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
