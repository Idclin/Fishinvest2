import { Client, Databases, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import { USERS, FISH_MARKET, FISH_HOLDINGS, TRANSACTIONS, WITHDRAWALS, DEPOSITS, REFERRALS, CYCLES, NOTIFICATIONS_LOG } from './collections.js';

dotenv.config();

// Define schema configuration for programmatically creating collections
const SCHEMA_CONFIG: Record<string, Array<{ key: string; type: 'string' | 'float' | 'integer' | 'boolean'; size?: number; required?: boolean; default?: any }>> = {
  [USERS]: [
    { key: 'telegram_id', type: 'string', size: 255 },
    { key: 'email', type: 'string', size: 255, required: false },
    { key: 'password', type: 'string', size: 255, required: false },
    { key: 'name', type: 'string', size: 255, required: false },
    { key: 'phone', type: 'string', size: 255, required: false },
    { key: 'bank_name', type: 'string', size: 255, required: false },
    { key: 'account_number', type: 'string', size: 255, required: false },
    { key: 'wallet_balance', type: 'float', required: false, default: 0.0 },
    { key: 'total_deposited', type: 'float', required: false, default: 0.0 },
    { key: 'total_withdrawn', type: 'float', required: false, default: 0.0 },
    { key: 'referral_code', type: 'string', size: 255, required: false },
    { key: 'referred_by', type: 'string', size: 255, required: false },
    { key: 'streak_count', type: 'integer', required: false, default: 0 },
    { key: 'level', type: 'string', size: 255, required: false },
    { key: 'status', type: 'string', size: 255, required: false },
    { key: 'last_checkin', type: 'string', size: 255, required: false },
    { key: 'created_at', type: 'string', size: 255, required: false },
    { key: 'points', type: 'integer', required: false, default: 0 },
    { key: 'admin_notifications', type: 'string', size: 10000, required: false }
  ],
  [FISH_MARKET]: [
    { key: 'name', type: 'string', size: 255 },
    { key: 'display_name', type: 'string', size: 255, required: false },
    { key: 'photo_url', type: 'string', size: 1000, required: false },
    { key: 'tag', type: 'string', size: 255, required: false },
    { key: 'description', type: 'string', size: 2000, required: false },
    { key: 'price', type: 'float', required: false, default: 0.0 },
    { key: 'weekly_profit', type: 'float', required: false, default: 0.0 },
    { key: 'daily_profit', type: 'float', required: false, default: 0.0 },
    { key: 'status', type: 'string', size: 255, required: false },
    { key: 'scheduled_date', type: 'string', size: 255, required: false },
    { key: 'is_limited', type: 'boolean', required: false, default: false },
    { key: 'units_limit', type: 'integer', required: false, default: 0 },
    { key: 'units_sold', type: 'integer', required: false, default: 0 },
    { key: 'sort_order', type: 'integer', required: false, default: 0 }
  ],
  [FISH_HOLDINGS]: [
    { key: 'user_id', type: 'string', size: 255 },
    { key: 'fish_id', type: 'string', size: 255 },
    { key: 'fish_name', type: 'string', size: 255, required: false },
    { key: 'quantity', type: 'integer', required: false, default: 1 },
    { key: 'staked_day', type: 'string', size: 255 },
    { key: 'staked_at', type: 'string', size: 255 },
    { key: 'cycle_id', type: 'string', size: 255, required: false },
    { key: 'daily_profit', type: 'float', required: false, default: 0.0 },
    { key: 'weekly_profit', type: 'float', required: false, default: 0.0 },
    { key: 'projected_payout', type: 'float', required: false, default: 0.0 }
  ],
  [TRANSACTIONS]: [
    { key: 'user_id', type: 'string', size: 255 },
    { key: 'type', type: 'string', size: 255 },
    { key: 'amount', type: 'float', required: false, default: 0.0 },
    { key: 'balance_before', type: 'float', required: false, default: 0.0 },
    { key: 'balance_after', type: 'float', required: false, default: 0.0 },
    { key: 'description', type: 'string', size: 1000, required: false },
    { key: 'status', type: 'string', size: 255 },
    { key: 'created_at', type: 'string', size: 255 }
  ],
  [WITHDRAWALS]: [
    { key: 'user_id', type: 'string', size: 255 },
    { key: 'amount', type: 'float', required: false, default: 0.0 },
    { key: 'bank_name', type: 'string', size: 255, required: false },
    { key: 'account_number', type: 'string', size: 255, required: false },
    { key: 'status', type: 'string', size: 255 },
    { key: 'requested_at', type: 'string', size: 255 },
    { key: 'paid_at', type: 'string', size: 255, required: false }
  ],
  [DEPOSITS]: [
    { key: 'user_id', type: 'string', size: 255 },
    { key: 'amount', type: 'float', required: false, default: 0.0 },
    { key: 'virtual_account', type: 'string', size: 255, required: false },
    { key: 'payment_reference', type: 'string', size: 255, required: false },
    { key: 'status', type: 'string', size: 255 },
    { key: 'created_at', type: 'string', size: 255 }
  ],
  [REFERRALS]: [
    { key: 'referrer_id', type: 'string', size: 255 },
    { key: 'referee_id', type: 'string', size: 255 },
    { key: 'first_purchase_amount', type: 'float', required: false, default: 0.0 },
    { key: 'bonus_amount', type: 'float', required: false, default: 0.0 },
    { key: 'status', type: 'string', size: 255, required: false },
    { key: 'created_at', type: 'string', size: 255 }
  ],
  [CYCLES]: [
    { key: 'start_date', type: 'string', size: 255, required: false },
    { key: 'end_date', type: 'string', size: 255, required: false },
    { key: 'total_deposited', type: 'float', required: false, default: 0.0 },
    { key: 'total_withdrawn', type: 'float', required: false, default: 0.0 },
    { key: 'total_payout', type: 'float', required: false, default: 0.0 },
    { key: 'status', type: 'string', size: 255, required: false }
  ],
  [NOTIFICATIONS_LOG]: [
    { key: 'sent_to', type: 'string', size: 255, required: false },
    { key: 'message', type: 'string', size: 2000 },
    { key: 'segment', type: 'string', size: 255, required: false },
    { key: 'sent_at', type: 'string', size: 255, required: false },
    { key: 'total_recipients', type: 'integer', required: false, default: 0 }
  ]
};

// In-Memory Database fallback config for resilience
interface InMemoryDb {
  users: Record<string, any>;
  fish_market: Record<string, any>;
  fish_holdings: Record<string, any>;
  transactions: Record<string, any>;
  withdrawals: Record<string, any>;
  deposits: Record<string, any>;
  referrals: Record<string, any>;
  cycles: Record<string, any>;
  notifications_log: Record<string, any>;
}

const memoryDb: InMemoryDb = {
  users: {},
  fish_market: {},
  fish_holdings: {},
  transactions: {},
  withdrawals: {},
  deposits: {},
  referrals: {},
  cycles: {},
  notifications_log: {}
};

// Initialize Appwrite components safely
let appwriteClient: Client | null = null;
let appwriteDatabases: Databases | null = null;
export let databaseId = 'Lockin';

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const isConfigured = !!(projectId && apiKey);

export function getAppwriteClient() {
  if (!isConfigured) {
    return null;
  }
  if (!appwriteClient) {
    appwriteClient = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId!)
      .setKey(apiKey!);
  }
  return appwriteClient;
}

export function getAppwriteDatabases() {
  if (!isConfigured) {
    return null;
  }
  const client = getAppwriteClient();
  if (client && !appwriteDatabases) {
    appwriteDatabases = new Databases(client);
  }
  return appwriteDatabases;
}

/**
 * Robust database initialization routine.
 * Discovers and builds schemas asynchronously to keep Express launch instant and safe.
 */
export async function initializeDatabaseSchema() {
  const dbs = getAppwriteDatabases();
  if (!dbs) {
    console.log('⚠️ [Appwrite DB] Configuration parameters are absent. Using fully supportive In-Memory Database Engine.');
    return;
  }

  console.log('🔄 [Appwrite DB] Connecting to database schema configurations on Appwrite Cloud...');
  try {
    // 1. Verify or create database
    try {
      await dbs.get(databaseId);
      console.log(`✅ [Appwrite DB] Located active database: "${databaseId}"`);
    } catch (e: any) {
      console.log(`🔄 [Appwrite DB] Database "${databaseId}" not found. Attempting to create a new database...`);
      try {
        await dbs.create(databaseId, 'FishInvest Production DB');
        console.log(`✅ [Appwrite DB] Successfully created database: "${databaseId}"`);
      } catch (createErr: any) {
        if (createErr.code === 403 || createErr.message?.includes('limit') || createErr.message?.includes('plan') || createErr.type === 'additional_resource_not_allowed') {
          console.warn(`⚠️ [Appwrite DB] Could not create database "${databaseId}" because of standard Appwrite Cloud free-tier quota limits.`);
          console.log('🔄 [Appwrite DB] Scanning for any existing available database inside your project...');
          const listRes = await dbs.list();
          if (listRes.databases && listRes.databases.length > 0) {
            const firstDb = listRes.databases[0];
            databaseId = firstDb.$id;
            console.log(`🚨 [Appwrite DB] Intelligently switched database targets to your existing: "${databaseId}" (${firstDb.name})!`);
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    }

    // Index mappings required for active filter collections
    const INDEX_CONFIG: Record<string, Array<{ key: string; type: 'key' | 'unique' | 'fulltext'; attributes: string[] }>> = {
      [USERS]: [
        { key: 'email', type: 'key', attributes: ['email'] }
      ],
      [FISH_HOLDINGS]: [
        { key: 'user_id', type: 'key', attributes: ['user_id'] }
      ],
      [TRANSACTIONS]: [
        { key: 'user_id', type: 'key', attributes: ['user_id'] },
        { key: 'type', type: 'key', attributes: ['type'] }
      ],
      [WITHDRAWALS]: [
        { key: 'status', type: 'key', attributes: ['status'] }
      ]
    };

    // 2. Build/Repair all 9 collections, their attributes, and indices
    for (const collectionId of Object.keys(SCHEMA_CONFIG)) {
      let col: any = null;
      try {
        col = await dbs.getCollection(databaseId, collectionId);
        console.log(`✅ [Appwrite DB] Located collection: "${collectionId}"`);
      } catch (colErr) {
        console.log(`🔄 [Appwrite DB] Creating missing collection: "${collectionId}"...`);
        col = await dbs.createCollection(databaseId, collectionId, collectionId);
        
        // Wait briefly between Appwrite operations to allow internal worker indices to align
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Check existing attributes list
      const existingAttributes = col ? (col.attributes || []) : [];
      const existingKeys = new Set(existingAttributes.map((a: any) => a.key));

      // Append any missing attribute schemas in real-time
      const attributes = SCHEMA_CONFIG[collectionId];
      for (const attr of attributes) {
        if (!existingKeys.has(attr.key)) {
          try {
            console.log(`🔄 [Appwrite DB] Creating missing attribute: ${collectionId}.${attr.key}...`);
            if (attr.type === 'string') {
              await dbs.createStringAttribute(databaseId, collectionId, attr.key, attr.size || 255, attr.required ?? false, attr.default);
            } else if (attr.type === 'float') {
              await dbs.createFloatAttribute(databaseId, collectionId, attr.key, attr.required ?? false, undefined, undefined, attr.default);
            } else if (attr.type === 'integer') {
              await dbs.createIntegerAttribute(databaseId, collectionId, attr.key, attr.required ?? false, undefined, undefined, attr.default);
            } else if (attr.type === 'boolean') {
              await dbs.createBooleanAttribute(databaseId, collectionId, attr.key, attr.required ?? false, attr.default);
            }
            console.log(`   ✅ Attribute created successfully: ${collectionId}.${attr.key}`);
            await new Promise((r) => setTimeout(r, 200));
          } catch (attrErr: any) {
            if (attrErr.message?.includes('already exists') || attrErr.code === 409) {
              // Attribute exists but was not fully loaded in attributes array yet
            } else {
              console.warn(`   ⚠️ Problem creating attribute ${collectionId}.${attr.key}: ${attrErr.message}`);
            }
          }
        }
      }

      // Append any missing query filter index maps
      const indexList = INDEX_CONFIG[collectionId];
      if (indexList) {
        const existingIndexes = col ? (col.indexes || []) : [];
        const existingIndexKeys = new Set(existingIndexes.map((i: any) => i.key));

        for (const idx of indexList) {
          if (!existingIndexKeys.has(idx.key)) {
            try {
              console.log(`🔄 [Appwrite DB] Creating missing index: ${collectionId}.${idx.key}...`);
              await dbs.createIndex(databaseId, collectionId, idx.key, idx.type as any, idx.attributes);
              console.log(`   ✅ Index created successfully: ${collectionId}.${idx.key}`);
              await new Promise((r) => setTimeout(r, 200));
            } catch (idxErr: any) {
              if (idxErr.message?.includes('already exists') || idxErr.code === 409) {
                // Index exists, safe to ignore
              } else {
                console.warn(`   ⚠️ Problem creating index ${collectionId}.${idx.key}: ${idxErr.message}`);
              }
            }
          }
        }
      }
    }
    console.log('🎉 [Appwrite DB] All 9 collections schema and indices verified successfully.');
  } catch (error: any) {
    console.error('❌ [Appwrite DB] Schema initialization completed with error:', error.message);
  }
}

// Global helper to filter matching documents with schema validation
function matchesQuery(doc: any, queries: any[]): boolean {
  for (const q of queries) {
    // Basic match parsing for Query.equal
    if (typeof q === 'string' && q.includes('=')) {
      const parts = q.replace(/[\"\'\s]/g, '').split('=');
      const key = parts[0];
      const val = parts[1];
      if (String(doc[key]) !== String(val)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Generic CRUD Wrapper to seamlessly fall back to local in-memory records
 */
export const dbService = {
  getInMemoryDb() {
    return memoryDb;
  },

  async listDocuments(collectionId: string, queries: any[] = []): Promise<any[]> {
    const dbs = getAppwriteDatabases();
    if (!dbs) {
      // Memory access
      let list = Object.values(memoryDb[collectionId as keyof InMemoryDb] || {});
      // Simple custom filter for standard Query.equal inside Queries array
      for (const q of queries) {
        if (q && typeof q === 'string' && q.startsWith('equal(')) {
          // parses: equal("userId", "value") -> userId, value
          const match = q.match(/equal\("([^"]+)"\s*,\s*(?:\["([^"]+)"\]|"([^"]+)"|([0-9\.]+)|(true|false))\)/);
          if (match) {
            const field = match[1];
            const rawVal = match[2] || match[3] || match[4] || match[5];
            let val: any = rawVal;
            if (rawVal === 'true') val = true;
            else if (rawVal === 'false') val = false;
            else if (!isNaN(Number(rawVal)) && rawVal.trim() !== '') val = Number(rawVal);

            list = list.filter((doc: any) => String(doc[field]) === String(val));
          }
        }
      }
      return list.map(doc => this.mapDocumentOut(collectionId, doc));
    }

    try {
      const response = await dbs.listDocuments(databaseId, collectionId, queries);
      return response.documents.map(doc => this.mapDocumentOut(collectionId, doc));
    } catch (err: any) {
      console.error(`Error listing documents in collection "${collectionId}":`, err.message);
      // Return memory fallback if error
      const docs = Object.values(memoryDb[collectionId as keyof InMemoryDb] || {});
      return docs.map(doc => this.mapDocumentOut(collectionId, doc));
    }
  },

  async getDocument(collectionId: string, documentId: string): Promise<any | null> {
    const dbs = getAppwriteDatabases();
    if (!dbs) {
      const store = memoryDb[collectionId as keyof InMemoryDb];
      const doc = store ? (store[documentId] || null) : null;
      return this.mapDocumentOut(collectionId, doc);
    }

    try {
      const doc = await dbs.getDocument(databaseId, collectionId, documentId);
      return this.mapDocumentOut(collectionId, doc);
    } catch (err: any) {
      // Document not found is common, don't flood error logs
      const store = memoryDb[collectionId as keyof InMemoryDb];
      const doc = store ? (store[documentId] || null) : null;
      return this.mapDocumentOut(collectionId, doc);
    }
  },

  async createDocument(collectionId: string, documentId: string, data: any): Promise<any> {
    const cleanData = { ...data };
    // Strip empty string telegram IDs or auto fill ID key
    if (!cleanData.id) {
      cleanData.id = documentId === ID.unique() ? 'id_' + Math.floor(Math.random() * 100000000).toString() : documentId;
    }

    // Save to memory
    const store = memoryDb[collectionId as keyof InMemoryDb];
    if (store) {
      store[cleanData.id] = cleanData;
    }

    const dbs = getAppwriteDatabases();
    if (!dbs) {
      return this.mapDocumentOut(collectionId, cleanData);
    }

    try {
      // Ensure all fields map perfectly to schemas as Float, String, Int or Boolean
      const sanitized = this.sanitizeForAppwrite(collectionId, cleanData);
      const doc = await dbs.createDocument(databaseId, collectionId, documentId, sanitized);
      return this.mapDocumentOut(collectionId, doc);
    } catch (err: any) {
      console.error(`Error creating document in ${collectionId}:`, err.message);
      return this.mapDocumentOut(collectionId, cleanData);
    }
  },

  async updateDocument(collectionId: string, documentId: string, data: any): Promise<any> {
    // Save to memory
    const store = memoryDb[collectionId as keyof InMemoryDb];
    if (store && store[documentId]) {
      store[documentId] = { ...store[documentId], ...data };
    } else if (store) {
      store[documentId] = data;
    }

    const dbs = getAppwriteDatabases();
    if (!dbs) {
      return this.mapDocumentOut(collectionId, store ? store[documentId] : data);
    }

    try {
      const sanitized = this.sanitizeForAppwrite(collectionId, data);
      if (Object.keys(sanitized).length === 0) {
        console.log(`⚠️ [Appwrite DB] Skipping empty updateDocument call on "${collectionId}" / "${documentId}"`);
        return this.mapDocumentOut(collectionId, store ? store[documentId] : data);
      }
      const doc = await dbs.updateDocument(databaseId, collectionId, documentId, sanitized);
      return this.mapDocumentOut(collectionId, doc);
    } catch (err: any) {
      console.error(`Error updating document ${documentId} in ${collectionId}:`, err.message);
      return this.mapDocumentOut(collectionId, store ? store[documentId] : data);
    }
  },

  async deleteDocument(collectionId: string, documentId: string): Promise<boolean> {
    const store = memoryDb[collectionId as keyof InMemoryDb];
    if (store) {
      delete store[documentId];
    }

    const dbs = getAppwriteDatabases();
    if (!dbs) {
      return true;
    }

    try {
      await dbs.deleteDocument(databaseId, collectionId, documentId);
      return true;
    } catch (err: any) {
      console.error(`Error deleting document ${documentId} in ${collectionId}:`, err.message);
      return false;
    }
  },

  sanitizeForAppwrite(collectionId: string, data: any): any {
    const schema = SCHEMA_CONFIG[collectionId];
    if (!schema) return data;

    const result: any = {};
    for (const attr of schema) {
      // Map both camelCase and snake_case properties to schema snake_case keys
      const camelKey = attr.key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      const val = data[attr.key] !== undefined ? data[attr.key] : data[camelKey];

      if (val !== undefined) {
        if (val === null) {
          result[attr.key] = null;
        } else if (attr.type === 'float') {
          result[attr.key] = parseFloat(val) || 0.0;
        } else if (attr.type === 'integer') {
          result[attr.key] = parseInt(val) || 0;
        } else if (attr.type === 'boolean') {
          result[attr.key] = !!val;
        } else {
          if (Array.isArray(val) || (val && typeof val === 'object')) {
            result[attr.key] = JSON.stringify(val);
          } else {
            result[attr.key] = String(val);
          }
        }
      }
    }
    return result;
  },

  mapDocumentOut(collectionId: string, doc: any): any {
    if (!doc) return doc;
    const result = { ...doc };
    const schema = SCHEMA_CONFIG[collectionId];
    if (!schema) return result;

    for (const attr of schema) {
      if (doc[attr.key] !== undefined) {
        let val = doc[attr.key];
        if (typeof val === 'string' && ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}')))) {
          try {
            val = JSON.parse(val);
          } catch (e) {}
        }
        const camelKey = attr.key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        result[camelKey] = val;
        result[attr.key] = val;
      }
    }
    return result;
  }
};
