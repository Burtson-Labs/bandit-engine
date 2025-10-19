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

// Bandit Engine Watermark: BL-WM-C8A1-40B795
const __banditFingerprint_stt_sttclientts = 'BL-FP-B71992-8B55';
const __auditTrail_stt_sttclientts = 'BL-AU-MGOIKVVZ-KV58';
// File: stt-client.ts | Path: src/services/stt/stt-client.ts | Hash: c8a18b55

import { authenticationService } from "../auth/authenticationService";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { debugLogger } from "../logging/debugLogger";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

/**
 * Abstract STT response parser to handle different API response formats
 */
export interface STTResponse {
  text: string;
}

export class STTResponseParser {
  /**
   * Parse STT response to extract transcribed text
   * Supports multiple API response formats for maximum compatibility
   */
  static parseResponse(data: unknown): string {
    const root = isRecord(data) ? data : {};

    // Strategy 1: Nested JSON in transcription field (current C# API)
    const transcriptionValue = root["transcription"];
    if (typeof transcriptionValue === "string") {
      try {
        const transcriptionData = JSON.parse(transcriptionValue) as Record<string, unknown>;
        const nestedText = transcriptionData?.text;
        if (typeof nestedText === "string") {
          return nestedText;
        }
      } catch (e) {
        debugLogger.warn('Failed to parse nested transcription JSON, trying direct access');
      }
    }

    // Strategy 2: Direct text field (common in Node.js/Python APIs)
    const directText = root["text"];
    if (typeof directText === "string") {
      return directText;
    }

    // Strategy 3: Transcription as direct string (simple APIs)
    if (typeof transcriptionValue === "string" && !transcriptionValue.startsWith("{")) {
      return transcriptionValue;
    }

    // Strategy 4: Result field (some ML APIs)
    const result = root["result"];
    if (isRecord(result)) {
      const resultText = result["text"];
      if (typeof resultText === "string") {
        return resultText;
      }
    }

    // Strategy 5: Response wrapper (enterprise APIs)
    const responseWrapper = root["response"];
    if (isRecord(responseWrapper)) {
      const responseText = responseWrapper["transcription"];
      if (typeof responseText === "string") {
        return responseText;
      }
    }

    // Strategy 6: Alternatives array (Google/AWS style)
    const alternatives = root["alternatives"];
    if (Array.isArray(alternatives)) {
      const firstAlternative = alternatives[0];
      if (isRecord(firstAlternative) && typeof firstAlternative["transcript"] === "string") {
        return firstAlternative["transcript"] as string;
      }
    }

    debugLogger.error('Unable to parse STT response format:', data);
    throw new Error('Unsupported STT response format');
  }
}

/**
 * Universal STT client that works with any backend API
 */
export class STTClient {
  /**
   * Transcribe audio blob to text
   * @param blob Audio blob to transcribe
   * @returns Promise<string> Transcribed text
   */
  static async transcribe(blob: Blob): Promise<string> {
    const gatewayUrl = usePackageSettingsStore.getState().settings?.gatewayApiUrl || "";
    
    if (!gatewayUrl) {
      throw new Error('Gateway API URL not configured');
    }
    
    let normalizedBlob: Blob = blob;

    if (blob.type.includes('webm') && blob.type.includes('codecs=')) {
      debugLogger.debug('STT Request: normalizing webm blob without codec suffix', {
        originalType: blob.type,
      });
      normalizedBlob = new Blob([blob], { type: 'audio/webm' });
    }

    const body = new FormData();
    const filename = normalizedBlob.type.includes('ogg') ? 'audio.ogg' : 
                    normalizedBlob.type.includes('wav') ? 'audio.wav' :
                    normalizedBlob.type.includes('mp3') ? 'audio.mp3' : 'audio.webm';
    
    // Try common parameter names for maximum API compatibility
    body.append("audio", normalizedBlob, filename);     // Most common
    body.append("file", normalizedBlob, filename);      // Alternative
    body.append("audioFile", normalizedBlob, filename); // Some APIs prefer this
    
    debugLogger.debug('STT Request:', {
      blobSize: normalizedBlob.size,
      blobType: normalizedBlob.type,
      filename: filename,
      url: `${gatewayUrl}/stt/transcribe`
    });
    
    const token = authenticationService.getToken();
    const response = await fetch(`${gatewayUrl}/stt/transcribe`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        // Let browser set Content-Type with boundary for FormData
      },
      body: body,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      debugLogger.error('STT API Error:', { status: response.status, error: errorText });
      throw new Error(`STT API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    debugLogger.debug('STT Response:', data);
    
    return STTResponseParser.parseResponse(data);
  }
}
