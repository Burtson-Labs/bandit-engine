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

// Bandit Engine Watermark: BL-WM-881F-0475DF
const __banditFingerprint_utilts = 'BL-FP-8CD496-6839';
const __auditTrail_utilts = 'BL-AU-MGOIKVW9-4I28';
// File: util.ts | Path: src/util.ts | Hash: 881f6839

import { debugLogger } from "./services/logging/debugLogger";

export const toTitleCase = (str: string) => str.toLowerCase().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

/**
 * Generates a random number between min and max (inclusive).
 * @param min the minimum value 
 * @param max the maximum value 
 * @returns 
 */
export const randomRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateSeed = () => Math.floor(Math.random() * 10000)

export const fetchAndConvertToBase64 = async (src: string): Promise<string> => {
    const response = await fetch(src);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const detectTransparency = (imageSrc: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(false);
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
            for (let i = 3; i < imageData.length; i += 4) {
                if (imageData[i] < 255) {
                    debugLogger.debug("Detected transparency in image");
                    resolve(true);
                    return;
                }
            }
            debugLogger.debug("No transparency detected in image");
            resolve(false);
        };
        img.src = imageSrc;
    });
};

const banditHead = "https://cdn.burtson.ai/logos/bandit-head.png";

export const modelAvatars: Record<string, string> = {
    "Bandit-Core": "https://cdn.burtson.ai/avatars/core-avatar.png",
    "Bandit-Muse": "https://cdn.burtson.ai/avatars/muse-avatar.png",
    "Bandit-Logic": "https://cdn.burtson.ai/avatars/logic-avatar.png",
    "Bandit-D1VA": "https://cdn.burtson.ai/avatars/d1va-avatar.png",
    "Bandit-Exec": "https://cdn.burtson.ai/avatars/exec-avatar.png",
};

type ModelLike = {
    name?: string;
    avatarBase64?: string | null;
};

export const resolveAvatar = (model: ModelLike | null | undefined): string => {
    // If no model provided, return banditHead URL
    if (!model) return banditHead;

    // If model has base64 avatar
    if (model.avatarBase64 && model.avatarBase64.startsWith("data:image")) {
        return model.avatarBase64;
    }

    // If model is a known Bandit model
    const banditAvatar = model.name ? modelAvatars[model.name] : undefined;
    if (banditAvatar) {
        return banditAvatar;
    }

    return banditHead;
};
