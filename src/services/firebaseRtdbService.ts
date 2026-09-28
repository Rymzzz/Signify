import { UserProfile } from '../types/index';
import { getSavedFirebaseConfig } from './firebaseConfig';

export const DEFAULT_RTDB_URL = 'https://signify-asl-db-default-rtdb.asia-southeast1.firebasedatabase.app';

export interface RtdbConnectionStatus {
  status: 'CONNECTED' | 'PERMISSION_DENIED' | 'OFFLINE' | 'UNCONFIGURED';
  success: boolean;
  message: string;
  httpStatus?: number;
  url: string;
  latencyMs?: number;
}

function getDatabaseBaseUrl(): string {
  const cfg = getSavedFirebaseConfig();
  let url = cfg.databaseURL || DEFAULT_RTDB_URL;
  // Ensure trailing slash removed
  return url.replace(/\/+$/, '');
}

function sanitizeEmailKey(email: string): string {
  return email.toLowerCase().replace(/[.@#$\[\]]/g, '_');
}

export class FirebaseRtdbService {
  private lastStatus: RtdbConnectionStatus | null = null;
  private statusListeners: ((status: RtdbConnectionStatus) => void)[] = [];

  public getDatabaseUrl(): string {
    return getDatabaseBaseUrl();
  }

  public subscribeStatus(listener: (status: RtdbConnectionStatus) => void): () => void {
    this.statusListeners.push(listener);
    if (this.lastStatus) {
      listener(this.lastStatus);
    }
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private notifyStatus(status: RtdbConnectionStatus): void {
    this.lastStatus = status;
    this.statusListeners.forEach(l => l(status));
  }

  public getLastStatus(): RtdbConnectionStatus | null {
    return this.lastStatus;
  }

  /**
   * Test live connection to the user's online Firebase Realtime Database
   */
  public async testConnection(): Promise<RtdbConnectionStatus> {
    const baseUrl = getDatabaseBaseUrl();
    const testUrl = `${baseUrl}/.json?shallow=true`;
    const start = performance.now();

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        const result: RtdbConnectionStatus = {
          status: 'CONNECTED',
          success: true,
          message: 'Connected to Firebase Realtime Database! Live sync is active.',
          httpStatus: response.status,
          url: baseUrl,
          latencyMs,
        };
        this.notifyStatus(result);
        return result;
      }

      if (response.status === 401 || response.status === 403) {
        // Permission denied means the database is online and reachable, but rules need update
        const result: RtdbConnectionStatus = {
          status: 'PERMISSION_DENIED',
          success: false,
          message: 'Firebase Database reachable, but "Permission Denied" (403). In Firebase Console -> Realtime Database -> Rules tab, ensure rules are set to public read/write and click the blue "Publish" button.',
          httpStatus: response.status,
          url: baseUrl,
          latencyMs,
        };
        this.notifyStatus(result);
        return result;
      }

      const result: RtdbConnectionStatus = {
        status: 'OFFLINE',
        success: false,
        message: `Firebase responded with HTTP status ${response.status}`,
        httpStatus: response.status,
        url: baseUrl,
        latencyMs,
      };
      this.notifyStatus(result);
      return result;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      const result: RtdbConnectionStatus = {
        status: 'OFFLINE',
        success: false,
        message: `Could not reach Firebase database: ${err.message || 'Network error'}`,
        url: baseUrl,
        latencyMs,
      };
      this.notifyStatus(result);
      return result;
    }
  }

  /**
   * Save a user profile directly to the online Firebase Realtime Database:
   * Location: /users/{userId}.json
   */
  public async saveUser(user: UserProfile): Promise<{ success: boolean; isOnline: boolean; error?: string }> {
    const baseUrl = getDatabaseBaseUrl();
    const userUrl = `${baseUrl}/users/${encodeURIComponent(user.uid)}.json`;
    const payload = {
      ...user,
      deviceSyncedAt: Date.now(),
    };

    try {
      const res = await fetch(userUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Also save an email index so users can log in by email on any device
        const emailKey = sanitizeEmailKey(user.email);
        const emailIndexUrl = `${baseUrl}/users_by_email/${emailKey}.json`;
        fetch(emailIndexUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, email: user.email }),
        }).catch(() => {});

        this.notifyStatus({
          status: 'CONNECTED',
          success: true,
          message: 'Live sync succeeded',
          httpStatus: 200,
          url: baseUrl,
        });

        return { success: true, isOnline: true };
      }

      if (res.status === 401 || res.status === 403) {
        this.notifyStatus({
          status: 'PERMISSION_DENIED',
          success: false,
          message: 'Permission denied: Please set your Firebase rules to public test mode.',
          httpStatus: res.status,
          url: baseUrl,
        });
        return { success: false, isOnline: true, error: 'PERMISSION_DENIED' };
      }

      return { success: false, isOnline: false, error: `HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, isOnline: false, error: err.message || 'Network error' };
    }
  }

  /**
   * Load user profile from online Firebase Realtime Database
   */
  public async getUser(uid: string): Promise<UserProfile | null> {
    const baseUrl = getDatabaseBaseUrl();
    const userUrl = `${baseUrl}/users/${encodeURIComponent(uid)}.json`;

    try {
      const res = await fetch(userUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        return data as UserProfile;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch all users from the online Firebase Realtime Database:
   * Location: /users.json
   */
  public async getAllUsers(): Promise<UserProfile[]> {
    const baseUrl = getDatabaseBaseUrl();
    const usersUrl = `${baseUrl}/users.json`;

    try {
      const res = await fetch(usersUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (!data) return [];
        if (Array.isArray(data)) return data.filter(Boolean);
        return Object.values(data) as UserProfile[];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Look up user by email from the online Firebase Realtime Database
   */
  public async getUserByEmail(email: string): Promise<UserProfile | null> {
    const baseUrl = getDatabaseBaseUrl();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try email index lookup
    try {
      const emailKey = sanitizeEmailKey(cleanEmail);
      const indexRes = await fetch(`${baseUrl}/users_by_email/${emailKey}.json`);
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        if (indexData?.uid) {
          const user = await this.getUser(indexData.uid);
          if (user) return user;
        }
      }
    } catch {
      // Continue to full scan
    }

    // 2. Full scan across /users.json
    try {
      const all = await this.getAllUsers();
      const match = all.find(u => u.email?.toLowerCase() === cleanEmail);
      return match || null;
    } catch {
      return null;
    }
  }

  /**
   * Bulk sync all users to Firebase Realtime Database
   */
  public async syncAllUsers(users: UserProfile[]): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    const baseUrl = getDatabaseBaseUrl();
    const usersMap: Record<string, UserProfile> = {};
    users.forEach(u => {
      usersMap[u.uid] = { ...u, deviceSyncedAt: Date.now() };
    });

    try {
      const res = await fetch(`${baseUrl}/users.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usersMap),
      });

      if (res.ok) {
        this.notifyStatus({
          status: 'CONNECTED',
          success: true,
          message: `Synced ${users.length} user accounts to Firebase Realtime Database!`,
          httpStatus: 200,
          url: baseUrl,
        });
        return { success: true, syncedCount: users.length };
      }

      if (res.status === 401 || res.status === 403) {
        this.notifyStatus({
          status: 'PERMISSION_DENIED',
          success: false,
          message: 'Permission denied: Please set your Firebase rules to public test mode.',
          httpStatus: res.status,
          url: baseUrl,
        });
        return { success: false, syncedCount: 0, error: 'PERMISSION_DENIED: Firebase Database rules must allow read/write.' };
      }

      return { success: false, syncedCount: 0, error: `HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, syncedCount: 0, error: err.message || 'Network error' };
    }
  }

  /**
   * Delete user from the online Firebase Realtime Database
   */
  public async deleteUser(uid: string): Promise<boolean> {
    const baseUrl = getDatabaseBaseUrl();
    const userUrl = `${baseUrl}/users/${encodeURIComponent(uid)}.json`;

    try {
      const res = await fetch(userUrl, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const firebaseRtdbService = new FirebaseRtdbService();
