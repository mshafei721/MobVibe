/**
 * Message History Manager
 * Manages persistent message storage per session
 * Provides fast append operations and efficient loading
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Message } from '../../store/sessionStore';

const STORAGE_KEY_PREFIX = '@mobvibe:messages:';
const MAX_MESSAGES_PER_SESSION = 500; // Limit per session to prevent storage overflow

export class MessageHistory {
  /**
   * Get storage key for a session
   */
  private static getKey(sessionId: string): string {
    return `${STORAGE_KEY_PREFIX}${sessionId}`;
  }

  /**
   * Save complete message history for a session
   */
  static async save(sessionId: string, messages: Message[]): Promise<void> {
    try {
      const key = this.getKey(sessionId);

      // Limit messages to prevent storage overflow
      const limitedMessages = messages.slice(-MAX_MESSAGES_PER_SESSION);

      // Serialize with Date handling
      const serialized = JSON.stringify(limitedMessages, (key, value) => {
        if (key === 'timestamp' && value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });

      await AsyncStorage.setItem(key, serialized);

      console.log('[MessageHistory] Saved messages', {
        sessionId,
        count: limitedMessages.length
      });
    } catch (error) {
      console.error('[MessageHistory] Failed to save messages:', error);
      throw error;
    }
  }

  /**
   * Load message history for a session
   */
  static async load(sessionId: string): Promise<Message[]> {
    try {
      const key = this.getKey(sessionId);
      const data = await AsyncStorage.getItem(key);

      if (!data) {
        console.log('[MessageHistory] No messages found', { sessionId });
        return [];
      }

      // Deserialize with Date parsing
      const messages = JSON.parse(data, (key, value) => {
        if (key === 'timestamp' && typeof value === 'string') {
          return new Date(value);
        }
        return value;
      });

      console.log('[MessageHistory] Loaded messages', {
        sessionId,
        count: messages.length
      });

      return messages;
    } catch (error) {
      console.error('[MessageHistory] Failed to load messages:', error);
      return [];
    }
  }

  /**
   * Append a single message to session history
   * More efficient than loading, modifying, and saving entire array
   */
  static async append(sessionId: string, message: Message): Promise<void> {
    try {
      const messages = await this.load(sessionId);

      // Check for duplicates
      const isDuplicate = messages.some(m => m.id === message.id);
      if (isDuplicate) {
        console.warn('[MessageHistory] Duplicate message, skipping append', {
          sessionId,
          messageId: message.id
        });
        return;
      }

      messages.push(message);
      await this.save(sessionId, messages);

      console.log('[MessageHistory] Appended message', {
        sessionId,
        messageId: message.id,
        totalCount: messages.length
      });
    } catch (error) {
      console.error('[MessageHistory] Failed to append message:', error);
      throw error;
    }
  }

  /**
   * Append multiple messages at once (batch operation)
   */
  static async appendBatch(
    sessionId: string,
    newMessages: Message[]
  ): Promise<void> {
    try {
      const messages = await this.load(sessionId);

      // Filter out duplicates
      const existingIds = new Set(messages.map(m => m.id));
      const uniqueMessages = newMessages.filter(m => !existingIds.has(m.id));

      if (uniqueMessages.length === 0) {
        console.log('[MessageHistory] No new messages to append', { sessionId });
        return;
      }

      messages.push(...uniqueMessages);
      await this.save(sessionId, messages);

      console.log('[MessageHistory] Appended batch', {
        sessionId,
        newCount: uniqueMessages.length,
        totalCount: messages.length
      });
    } catch (error) {
      console.error('[MessageHistory] Failed to append batch:', error);
      throw error;
    }
  }

  /**
   * Clear message history for a specific session
   */
  static async clear(sessionId: string): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      await AsyncStorage.removeItem(key);

      console.log('[MessageHistory] Cleared messages', { sessionId });
    } catch (error) {
      console.error('[MessageHistory] Failed to clear messages:', error);
      throw error;
    }
  }

  /**
   * Clear all message history (cleanup utility)
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const messageKeys = keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));

      if (messageKeys.length === 0) {
        console.log('[MessageHistory] No message history to clear');
        return;
      }

      await AsyncStorage.multiRemove(messageKeys);

      console.log('[MessageHistory] Cleared all message history', {
        count: messageKeys.length
      });
    } catch (error) {
      console.error('[MessageHistory] Failed to clear all messages:', error);
      throw error;
    }
  }

  /**
   * Get list of session IDs with stored messages
   */
  static async getStoredSessions(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const messageKeys = keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));

      const sessionIds = messageKeys.map(k =>
        k.replace(STORAGE_KEY_PREFIX, '')
      );

      console.log('[MessageHistory] Found stored sessions', {
        count: sessionIds.length
      });

      return sessionIds;
    } catch (error) {
      console.error('[MessageHistory] Failed to get stored sessions:', error);
      return [];
    }
  }

  /**
   * Get message count for a session (without loading all messages)
   */
  static async getMessageCount(sessionId: string): Promise<number> {
    try {
      const messages = await this.load(sessionId);
      return messages.length;
    } catch (error) {
      console.error('[MessageHistory] Failed to get message count:', error);
      return 0;
    }
  }

  /**
   * Get last N messages for a session
   */
  static async getLastMessages(
    sessionId: string,
    count: number
  ): Promise<Message[]> {
    try {
      const messages = await this.load(sessionId);
      return messages.slice(-count);
    } catch (error) {
      console.error('[MessageHistory] Failed to get last messages:', error);
      return [];
    }
  }

  /**
   * Search messages by content
   */
  static async searchMessages(
    sessionId: string,
    query: string
  ): Promise<Message[]> {
    try {
      const messages = await this.load(sessionId);
      const lowerQuery = query.toLowerCase();

      const results = messages.filter(m =>
        m.content.toLowerCase().includes(lowerQuery)
      );

      console.log('[MessageHistory] Search completed', {
        sessionId,
        query,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      console.error('[MessageHistory] Failed to search messages:', error);
      return [];
    }
  }

  /**
   * Get storage usage info
   */
  static async getStorageInfo(): Promise<{
    totalSessions: number;
    totalMessages: number;
    estimatedSizeKB: number;
  }> {
    try {
      const sessionIds = await this.getStoredSessions();
      let totalMessages = 0;
      let estimatedSize = 0;

      for (const sessionId of sessionIds) {
        const key = this.getKey(sessionId);
        const data = await AsyncStorage.getItem(key);

        if (data) {
          const messages = JSON.parse(data);
          totalMessages += messages.length;
          estimatedSize += data.length;
        }
      }

      const info = {
        totalSessions: sessionIds.length,
        totalMessages,
        estimatedSizeKB: Math.round(estimatedSize / 1024)
      };

      console.log('[MessageHistory] Storage info', info);

      return info;
    } catch (error) {
      console.error('[MessageHistory] Failed to get storage info:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        estimatedSizeKB: 0
      };
    }
  }
}
