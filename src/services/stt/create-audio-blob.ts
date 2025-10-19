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

// Bandit Engine Watermark: BL-WM-36B0-9C1E70
const __banditFingerprint_stt_createaudioblobts = 'BL-FP-14329D-148B';
const __auditTrail_stt_createaudioblobts = 'BL-AU-MGOIKVVY-G0SR';
// File: create-audio-blob.ts | Path: src/services/stt/create-audio-blob.ts | Hash: 36b0148b

export const createAudioBlob = (data: BlobPart | BlobPart[]): Blob => {
    const parts = Array.isArray(data) ? data : [data];
    return new Blob(parts, { type: 'audio/ogg' }); // Simplified MIME type without codec specification
};
