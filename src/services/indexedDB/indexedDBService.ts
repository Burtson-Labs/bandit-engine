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

// Bandit Engine Watermark: BL-WM-ECDD-4361B0
const __banditFingerprint_indexedDB_indexedDBServicets = 'BL-FP-C06DFD-C03C';
const __auditTrail_indexedDB_indexedDBServicets = 'BL-AU-MGOIKVVV-XMSG';
// File: indexedDBService.ts | Path: src/services/indexedDB/indexedDBService.ts | Hash: ecddc03c

import { openDB, IDBPDatabase } from 'idb';

type StoreConfig = {
  name: string;
  keyPath?: string;
};

type StoreConfigList = ReadonlyArray<StoreConfig>;

const isNotFoundError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  typeof (error as { name: unknown }).name === 'string' &&
  (error as { name: string }).name === 'NotFoundError';

/**
 * Generic IndexedDB service that provides consistent database operations
 * across the application using the idb library for modern Promise-based APIs.
 */
class IndexedDBService {
  private dbConnections: Map<string, Promise<IDBPDatabase>> = new Map();

  /**
   * Get or create a database connection (legacy method, use ensureDBWithStores for better error handling)
   */
  private async getDB(dbName: string, version: number, storeConfigs: StoreConfigList): Promise<IDBPDatabase> {
    return this.ensureDBWithStores(dbName, version, storeConfigs);
  }

  /**
   * Ensure database and object stores exist, with robust error handling
   */
  private async ensureDBWithStores(
    dbName: string, 
    version: number, 
    storeConfigs: StoreConfigList
  ): Promise<IDBPDatabase> {
    const key = `${dbName}_v${version}`;
    
    try {
      // Check if we already have a valid connection
      const existingPromise = this.dbConnections.get(key);
      if (existingPromise) {
        const existingDB = await existingPromise;
        
        // Verify all required object stores exist
        const missingStores = storeConfigs.filter(config => 
          !existingDB.objectStoreNames.contains(config.name)
        );
        
        if (missingStores.length === 0) {
          return existingDB;
        }
        
        // If stores are missing, close existing connection and recreate
        existingDB.close();
        this.dbConnections.delete(key);
      }
      
      // Use the new version-aware helper
      const db = await this.openDBWithVersionFallback(dbName, version, storeConfigs);
      
      // Cache the connection with the actual version used
      const actualKey = `${dbName}_v${db.version}`;
      this.dbConnections.set(actualKey, Promise.resolve(db));
      
      return db;
      
    } catch (error) {
      // Remove failed connection from cache
      this.dbConnections.delete(key);
      throw error;
    }
  }

  /**
   * Open database with automatic version detection and fallback
   */
  private async openDBWithVersionFallback(
    dbName: string, 
    preferredVersion: number,
    storeConfigs: StoreConfigList
  ): Promise<IDBPDatabase> {
    try {
      // First try without specifying version (use existing version)
      const db = await openDB(dbName);
      
      // Check if all required stores exist
      const missingStores = storeConfigs.filter(config => 
        !db.objectStoreNames.contains(config.name)
      );
      
      if (missingStores.length === 0) {
        return db;
      }
      
      // Close and upgrade if stores are missing
      db.close();
      
      // Try to upgrade with current version + 1
      const currentVersion = db.version;
      const newVersion = Math.max(currentVersion + 1, preferredVersion);
      
      return await openDB(dbName, newVersion, {
        upgrade(db) {
          storeConfigs.forEach(config => {
            if (!db.objectStoreNames.contains(config.name)) {
              db.createObjectStore(config.name, config.keyPath ? { keyPath: config.keyPath } : undefined);
            }
          });
        },
      });
      
    } catch (error) {
      // If no database exists, create with preferred version
      if (isNotFoundError(error)) {
        return await openDB(dbName, preferredVersion, {
          upgrade(db) {
            storeConfigs.forEach(config => {
              if (!db.objectStoreNames.contains(config.name)) {
                db.createObjectStore(config.name, config.keyPath ? { keyPath: config.keyPath } : undefined);
              }
            });
          },
        });
      }
      
      throw error;
    }
  }

  /**
   * Get a value from a specific store
   */
  async get<T = unknown>(
    dbName: string, 
    version: number, 
    storeName: string, 
    key: string,
    storeConfigs: StoreConfigList
  ): Promise<T | undefined> {
    try {
      const db = await this.ensureDBWithStores(dbName, version, storeConfigs);
      const value = await db.get(storeName, key);
      return value as T | undefined;
    } catch (error) {
      if (isNotFoundError(error)) {
        console.warn(`Object store '${storeName}' not found in database '${dbName}'. Creating it...`);
        // Try to recreate the database with proper stores
        const db = await this.ensureDBWithStores(dbName, version + 1, storeConfigs);
        const fallbackValue = await db.get(storeName, key);
        return fallbackValue as T | undefined;
      }
      throw error;
    }
  }

  /**
   * Put a value into a specific store
   */
  async put<T = unknown>(
    dbName: string, 
    version: number, 
    storeName: string, 
    value: T,
    storeConfigs: StoreConfigList,
    key?: string
  ): Promise<void> {
    try {
      const db = await this.ensureDBWithStores(dbName, version, storeConfigs);
      if (key !== undefined) {
        await db.put(storeName, value, key);
      } else {
        await db.put(storeName, value);
      }
    } catch (error) {
      if (isNotFoundError(error)) {
        console.warn(`Object store '${storeName}' not found in database '${dbName}'. Creating it...`);
        // Try to recreate the database with proper stores
        const db = await this.ensureDBWithStores(dbName, version + 1, storeConfigs);
        if (key !== undefined) {
          await db.put(storeName, value, key);
        } else {
          await db.put(storeName, value);
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete a value from a specific store
   */
  async delete(
    dbName: string, 
    version: number, 
    storeName: string, 
    key: string,
    storeConfigs: StoreConfigList
  ): Promise<void> {
    try {
      const db = await this.ensureDBWithStores(dbName, version, storeConfigs);
      await db.delete(storeName, key);
    } catch (error) {
      if (isNotFoundError(error)) {
        console.warn(`Object store '${storeName}' not found in database '${dbName}'. Creating it...`);
        // Try to recreate the database with proper stores
        const db = await this.ensureDBWithStores(dbName, version + 1, storeConfigs);
        await db.delete(storeName, key);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get all values from a specific store
   */
  async getAll<T = unknown>(
    dbName: string, 
    version: number, 
    storeName: string,
    storeConfigs: StoreConfigList
  ): Promise<T[]> {
    try {
      const db = await this.ensureDBWithStores(dbName, version, storeConfigs);
      const values = await db.getAll(storeName);
      return values as T[];
    } catch (error) {
      if (isNotFoundError(error)) {
        console.warn(`Object store '${storeName}' not found in database '${dbName}'. Creating it...`);
        // Try to recreate the database with proper stores
        const db = await this.ensureDBWithStores(dbName, version + 1, storeConfigs);
        const fallbackValues = await db.getAll(storeName);
        return fallbackValues as T[];
      }
      throw error;
    }
  }

  /**
   * Clear all values from a specific store
   */
  async clear(
    dbName: string, 
    version: number, 
    storeName: string,
    storeConfigs: StoreConfigList
  ): Promise<void> {
    try {
      const db = await this.ensureDBWithStores(dbName, version, storeConfigs);
      await db.clear(storeName);
    } catch (error) {
      if (isNotFoundError(error)) {
        console.warn(`Object store '${storeName}' not found in database '${dbName}'. Creating it...`);
        // Try to recreate the database with proper stores
        const db = await this.ensureDBWithStores(dbName, version + 1, storeConfigs);
        await db.clear(storeName);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get all keys from a specific store
   */
  async getAllKeys(
    dbName: string, 
    version: number, 
    storeName: string,
    storeConfigs: StoreConfigList
  ): Promise<IDBValidKey[]> {
    try {
      const db = await this.ensureDBWithStores(dbName, version, storeConfigs);
      return db.getAllKeys(storeName);
    } catch (error) {
      if (isNotFoundError(error)) {
        console.warn(`Object store '${storeName}' not found in database '${dbName}'. Creating it...`);
        // Try to recreate the database with proper stores
        const db = await this.ensureDBWithStores(dbName, version + 1, storeConfigs);
        return db.getAllKeys(storeName);
      }
      throw error;
    }
  }
}

// Create a singleton instance
const indexedDBService = new IndexedDBService();
export default indexedDBService;
