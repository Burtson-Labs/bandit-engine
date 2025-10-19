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

// Bandit Engine Watermark: BL-WM-39FF-3FCF58
const __banditFingerprint_util_conversationMigrationts = 'BL-FP-CA75E4-D550';
const __auditTrail_util_conversationMigrationts = 'BL-AU-MGOIKVW9-R32Z';
// File: conversationMigration.ts | Path: src/util/conversationMigration.ts | Hash: 39ffd550

import { debugLogger } from "../services/logging/debugLogger";
import indexedDBService from "../services/indexedDB/indexedDBService";
import type { HistoryEntry } from "../store/aiQueryStore";

/**
 * Migration utility to ensure backward compatibility for conversations
 * that were created before the projects feature was added.
 */

export interface ConversationV1 {
  id: string;
  name: string;
  model: string;
  history: HistoryEntry[];
}

export interface ConversationV2 {
  id: string;
  name: string;
  model: string;
  history: HistoryEntry[];
  projectId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DB_NAME = "bandit-conversations";
const STORE_NAME = "conversations";
const DB_VERSION = 1;
const storeConfigs = [{ name: STORE_NAME, keyPath: "id" }];

/**
 * Migrates conversations from V1 format (without projects) to V2 format (with projects)
 */
export async function migrateConversationsToV2(): Promise<boolean> {
  try {
    debugLogger.info("Starting conversation migration to V2 format");
    
    const conversations = await indexedDBService.getAll<ConversationV1 | ConversationV2>(
      DB_NAME, 
      DB_VERSION, 
      STORE_NAME, 
      storeConfigs
    );

    if (!conversations || conversations.length === 0) {
      debugLogger.info("No conversations found, migration not needed");
      return true;
    }

    let migratedCount = 0;
    const now = new Date();

    for (const conversation of conversations) {
      // Check if conversation needs migration (missing V2 fields)
      const needsMigration = 
        !conversation.hasOwnProperty('createdAt') || 
        !conversation.hasOwnProperty('updatedAt');

      if (needsMigration) {
        const migratedConversation: ConversationV2 = {
          ...conversation,
          // projectId remains undefined (ungrouped)
          createdAt: now, // We can't know the real creation date
          updatedAt: now,
        };

        await indexedDBService.put(
          DB_NAME, 
          DB_VERSION, 
          STORE_NAME, 
          migratedConversation, 
          storeConfigs
        );

        migratedCount++;
        debugLogger.debug("Migrated conversation", { 
          id: conversation.id, 
          name: conversation.name 
        });
      } else if ('createdAt' in conversation && conversation.createdAt && typeof conversation.createdAt === 'string') {
        // Convert string dates back to Date objects if needed
        const fixedConversation: ConversationV2 = {
          ...(conversation as ConversationV2),
          createdAt: new Date(conversation.createdAt),
          updatedAt: new Date((conversation as ConversationV2).updatedAt || conversation.createdAt),
        };

        await indexedDBService.put(
          DB_NAME, 
          DB_VERSION, 
          STORE_NAME, 
          fixedConversation, 
          storeConfigs
        );

        migratedCount++;
        debugLogger.debug("Fixed date format for conversation", { 
          id: conversation.id, 
          name: conversation.name 
        });
      }
    }

    if (migratedCount > 0) {
      debugLogger.info("Conversation migration completed", { 
        totalConversations: conversations.length,
        migratedCount 
      });
    } else {
      debugLogger.info("All conversations already up to date");
    }

    return true;
  } catch (error) {
    debugLogger.error("Failed to migrate conversations", { error });
    return false;
  }
}

/**
 * Validates that all conversations have the expected V2 structure
 */
export async function validateConversationStructure(): Promise<boolean> {
  try {
    const conversations = await indexedDBService.getAll<ConversationV2>(
      DB_NAME, 
      DB_VERSION, 
      STORE_NAME, 
      storeConfigs
    );

    if (!conversations) {
      return true; // No conversations to validate
    }

    for (const conversation of conversations) {
      const isValid = 
        typeof conversation.id === 'string' &&
        typeof conversation.name === 'string' &&
        typeof conversation.model === 'string' &&
        Array.isArray(conversation.history) &&
        (conversation.projectId === undefined || typeof conversation.projectId === 'string') &&
        (conversation.createdAt === undefined || conversation.createdAt instanceof Date) &&
        (conversation.updatedAt === undefined || conversation.updatedAt instanceof Date);

      if (!isValid) {
        debugLogger.warn("Invalid conversation structure detected", { 
          conversationId: conversation.id,
          structure: {
            hasId: typeof conversation.id === 'string',
            hasName: typeof conversation.name === 'string',
            hasModel: typeof conversation.model === 'string',
            hasHistory: Array.isArray(conversation.history),
            projectIdValid: conversation.projectId === undefined || typeof conversation.projectId === 'string',
            createdAtValid: conversation.createdAt === undefined || conversation.createdAt instanceof Date,
            updatedAtValid: conversation.updatedAt === undefined || conversation.updatedAt instanceof Date,
          }
        });
        return false;
      }
    }

    debugLogger.info("All conversations have valid structure", { 
      count: conversations.length 
    });
    return true;
  } catch (error) {
    debugLogger.error("Failed to validate conversation structure", { error });
    return false;
  }
}

/**
 * Runs all necessary migrations for conversations
 */
export async function runConversationMigrations(): Promise<boolean> {
  try {
    debugLogger.info("Running conversation migrations");
    
    const migrationSuccess = await migrateConversationsToV2();
    if (!migrationSuccess) {
      debugLogger.error("Conversation migration failed");
      return false;
    }

    const validationSuccess = await validateConversationStructure();
    if (!validationSuccess) {
      debugLogger.warn("Conversation validation failed, but continuing");
    }

    debugLogger.info("Conversation migrations completed successfully");
    return true;
  } catch (error) {
    debugLogger.error("Migration process failed", { error });
    return false;
  }
}
