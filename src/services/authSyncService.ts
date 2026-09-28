import { UserProfile, UserRole } from '../types/index';
import { initFirebase } from './firebaseConfig';
import { firebaseRtdbService, DEFAULT_RTDB_URL } from './firebaseRtdbService';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import { CURRICULUM_MODULES } from '../data/aslCurriculum';

const CURRENT_USER_KEY = 'signify_active_user';
const USERS_DB_KEY = 'signify_registered_users';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// Clean initial authority accounts starting fresh at 0 XP, 0 streak, and 0 trophies
const DEFAULT_USERS: UserProfile[] = [
  {
    uid: 'admin-root-1',
    email: 'admin@signify.edu',
    displayName: 'Administrator',
    password: 'admin',
    role: 'admin',
    avatar: '🛡️',
    createdAt: Date.now(),
    lastActiveDate: '',
    streak: 0,
    xp: 0,
    level: 1,
    completedSigns: [],
    dailyPracticedSigns: {},
    completedModules: [],
    bestSpeedRecords: {},
    averageSpeedMs: 0,
    trophies: 0,
    deviceSyncedAt: Date.now()
  }
];

class AuthSyncService {
  private currentUser: UserProfile | null = null;
  private subscribers: ((user: UserProfile | null) => void)[] = [];

  constructor() {
    this.initDatabase();
    this.loadActiveUser();
    // Background sync with online Firebase Realtime Database
    this.fetchUsersFromFirebaseRtdb().catch(() => {});
  }

  private initDatabase(): void {
    try {
      const existing = localStorage.getItem(USERS_DB_KEY);
      if (!existing) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(DEFAULT_USERS));
      }
    } catch {
      // LocalStorage access issues
    }
  }

  private loadActiveUser(): void {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch {
      this.currentUser = null;
    }
  }

  public subscribe(callback: (user: UserProfile | null) => void): () => void {
    this.subscribers.push(callback);
    callback(this.currentUser);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.currentUser));
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  // Save user both to Local Database and Firebase Realtime Database
  private async persistUser(user: UserProfile): Promise<void> {
    this.currentUser = user;
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

      // Update in users registry
      const all = this.getAllLocalUsers();
      const idx = all.findIndex(u => u.uid === user.uid || u.email === user.email);
      if (idx >= 0) {
        all[idx] = user;
      } else {
        all.push(user);
      }
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(all));

      // Attempt live Firebase Realtime Database sync (direct to user's DB URL)
      firebaseRtdbService.saveUser(user).catch(rtdbErr => {
        console.warn('Firebase RTDB background sync notice:', rtdbErr);
      });

      // Attempt Firebase Firestore Cloud Synchronization (if configured)
      const { db, isConfigured } = initFirebase();
      if (db && isConfigured) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { ...user, deviceSyncedAt: Date.now() }, { merge: true });
        } catch (firebaseErr) {
          console.warn('Firebase Firestore sync failed, retained in offline storage:', firebaseErr);
        }
      }
    } catch (err) {
      console.error('Error persisting user:', err);
    }
    this.notifySubscribers();
  }

  public getAllLocalUsers(): UserProfile[] {
    try {
      const stored = localStorage.getItem(USERS_DB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_USERS;
  }

  /**
   * Fetch all users from online Firebase Realtime Database and merge into local database
   */
  public async fetchUsersFromFirebaseRtdb(): Promise<UserProfile[]> {
    try {
      const onlineUsers = await firebaseRtdbService.getAllUsers();
      if (onlineUsers && onlineUsers.length > 0) {
        const localUsers = this.getAllLocalUsers();
        const mergedMap = new Map<string, UserProfile>();

        // Seed with local users
        localUsers.forEach(u => mergedMap.set(u.uid, u));

        // Merge online users (taking online version or newer)
        onlineUsers.forEach(ou => {
          if (ou && ou.uid) {
            const existing = mergedMap.get(ou.uid);
            if (!existing || (ou.deviceSyncedAt || 0) >= (existing.deviceSyncedAt || 0)) {
              mergedMap.set(ou.uid, ou);
            }
          }
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(mergedList));

        // If current active user exists in updated set, refresh
        if (this.currentUser) {
          const updatedActive = mergedMap.get(this.currentUser.uid);
          if (updatedActive) {
            this.currentUser = updatedActive;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedActive));
            this.notifySubscribers();
          }
        }

        return mergedList;
      }
    } catch (err) {
      console.warn('Failed to fetch users from Firebase RTDB:', err);
    }
    return this.getAllLocalUsers();
  }

  /**
   * Push all local accounts to the online Firebase Realtime Database
   */
  public async syncAllToFirebaseRtdb(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    const all = this.getAllLocalUsers();
    return await firebaseRtdbService.syncAllUsers(all);
  }

  // Login with Email and Password (Strict Verification)
  public async login(email: string, pass: string, requiredRole?: UserRole): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Firebase Auth if configured
    const { auth, db, isConfigured } = initFirebase();
    if (auth && isConfigured) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const fbUid = userCred.user.uid;

        // Fetch cloud profile
        if (db) {
          const userDoc = await getDoc(doc(db, 'users', fbUid));
          if (userDoc.exists()) {
            const cloudUser = userDoc.data() as UserProfile;
            if (requiredRole && cloudUser.role !== requiredRole) {
              throw new Error(`ACCESS_RESTRICTED: Account does not have required permissions for role: ${requiredRole}`);
            }
            await this.persistUser(cloudUser);
            return cloudUser;
          }
        }
      } catch (fbErr: any) {
        console.info('Firebase auth attempt note:', fbErr.message);
      }
    }

    // 2. Try Online Firebase Realtime Database lookup
    let rtdbUser: UserProfile | null = null;
    try {
      rtdbUser = await firebaseRtdbService.getUserByEmail(cleanEmail);
    } catch (rtdbErr) {
      console.info('Firebase RTDB lookup note:', rtdbErr);
    }

    // 3. Local accounts database
    const localUsers = this.getAllLocalUsers();
    const localUser = localUsers.find(u => u.email.toLowerCase() === cleanEmail);

    // Merge or pick found user
    const foundUser: UserProfile | null = rtdbUser || localUser || null;

    // Strict Account Validation: IF NO ACCOUNT FOUND, THROW ERROR!
    if (!foundUser) {
      // Check admin seed fallback
      if (cleanEmail === 'admin@signify.edu') {
        const adminSeed = DEFAULT_USERS.find(u => u.email === 'admin@signify.edu');
        if (adminSeed && (pass === 'admin' || pass === 'admin123')) {
          await this.persistUser(adminSeed);
          return adminSeed;
        }
      }
      throw new Error('NO_ACCOUNT_FOUND: No account registered with this email. Please check your spelling or sign up.');
    }

    // Strict Password Verification
    const expectedPass = foundUser.password;
    let isPassCorrect = false;

    if (expectedPass) {
      isPassCorrect = (expectedPass === pass);
    } else {
      if (cleanEmail === 'admin@signify.edu') {
        isPassCorrect = (pass === 'admin' || pass === 'admin123');
      } else {
        isPassCorrect = true; // Fallback for previously registered users without password
      }
    }

    if (!isPassCorrect) {
      throw new Error('INCORRECT_PASSWORD: The password you entered is incorrect. Please verify and try again.');
    }

    if (requiredRole && foundUser.role !== requiredRole) {
      throw new Error(`ACCESS_RESTRICTED: This account does not have "${requiredRole}" permissions.`);
    }

    await this.persistUser(foundUser);
    return foundUser;
  }

  // Register a new Account (Starts fresh at 0 stats)
  public async register(name: string, email: string, pass: string, role: UserRole = 'user'): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!pass || pass.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    // Check if account already exists
    const existingLocal = this.getAllLocalUsers().find(u => u.email.toLowerCase() === cleanEmail);
    if (existingLocal) {
      throw new Error('ACCOUNT_EXISTS: An account with this email already exists. Please sign in instead.');
    }
    try {
      const existingRtdb = await firebaseRtdbService.getUserByEmail(cleanEmail);
      if (existingRtdb) {
        throw new Error('ACCOUNT_EXISTS: An account with this email already exists in the cloud database. Please sign in instead.');
      }
    } catch {
      // Continue
    }

    // Try Firebase Auth registration if configured
    let uid = 'user-' + Date.now();
    const { auth, isConfigured } = initFirebase();
    if (auth && isConfigured) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        uid = userCred.user.uid;
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: cleanName });
        }
      } catch (err: any) {
        console.warn('Firebase registration notice:', err.message);
      }
    }

    // Fresh new user starting at 0 stats
    const newUser: UserProfile = {
      uid,
      email: cleanEmail,
      displayName: cleanName || cleanEmail.split('@')[0],
      password: pass,
      role,
      avatar: role === 'admin' ? '🛡️' : '🌟',
      createdAt: Date.now(),
      lastActiveDate: '',
      streak: 0,
      xp: 0,
      level: 1,
      completedSigns: [],
      dailyPracticedSigns: {},
      completedModules: [],
      bestSpeedRecords: {},
      averageSpeedMs: 0,
      trophies: 0,
      deviceSyncedAt: Date.now()
    };

    await this.persistUser(newUser);
    return newUser;
  }

  // Logout
  public async logout(): Promise<void> {
    const { auth } = initFirebase();
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
    }
    this.currentUser = null;
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      // ignore
    }
    this.notifySubscribers();
  }

  /**
   * Core Progress Tracker & Duplicate XP Prevention (Requirement 1.1)
   * Prevents duplicate XP when practicing the same sign on the same day.
   */
  public async recordSignPractice(
    signId: string,
    signXp: number = 15,
    elapsedMs?: number
  ): Promise<{
    xpEarned: number;
    isDuplicateToday: boolean;
    streak: number;
    newTotalXp: number;
    moduleCompleted?: string;
    isPersonalBest?: boolean;
    user: UserProfile;
  }> {
    if (!this.currentUser) {
      throw new Error('Please sign in to record progress and practice.');
    }

    const user = { ...this.currentUser };
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    // Check duplicate practice today
    if (!user.dailyPracticedSigns) {
      user.dailyPracticedSigns = {};
    }
    const todaySigns = user.dailyPracticedSigns[today] || [];
    const isDuplicateToday = todaySigns.includes(signId);

    let xpEarned = 0;
    if (!isDuplicateToday) {
      // Award XP only if not completed today!
      xpEarned = signXp;
      user.dailyPracticedSigns[today] = [...todaySigns, signId];
      user.xp = (user.xp || 0) + xpEarned;

      // Update streak
      if (!user.streak || user.streak === 0) {
        user.streak = 1;
      } else if (user.lastActiveDate === yesterday) {
        user.streak = (user.streak || 0) + 1;
      } else if (user.lastActiveDate !== today) {
        user.streak = 1;
      }
      user.lastActiveDate = today;

      // Add to completed signs list if not present
      if (!user.completedSigns) user.completedSigns = [];
      if (!user.completedSigns.includes(signId)) {
        user.completedSigns.push(signId);
      }
    }

    // Check speed records (even if practiced earlier today, allow setting faster Personal Best!)
    let isPersonalBest = false;
    if (elapsedMs !== undefined && elapsedMs > 0) {
      const validElapsed = Math.max(150, Math.min(30000, Math.round(elapsedMs)));
      if (!user.bestSpeedRecords) user.bestSpeedRecords = {};
      const prevBest = user.bestSpeedRecords[signId];
      if (!prevBest || validElapsed < prevBest) {
        user.bestSpeedRecords[signId] = validElapsed;
        isPersonalBest = true;
      }

      // Recompute average speed across all recorded best speed signs
      const values = Object.values(user.bestSpeedRecords);
      if (values.length > 0) {
        const sum = values.reduce((acc, v) => acc + v, 0);
        user.averageSpeedMs = Math.round(sum / values.length);
      }
    }

    // Check if any curriculum module was just completed!
    let moduleCompleted: string | undefined = undefined;
    if (!user.completedModules) user.completedModules = [];
    CURRICULUM_MODULES.forEach(mod => {
      if (!user.completedModules.includes(mod.id)) {
        const allSignsDone = mod.signs.every(s => user.completedSigns.includes(s.letter) || user.completedSigns.includes(s.id));
        if (allSignsDone) {
          user.completedModules.push(mod.id);
          user.xp += 100; // Module completion bonus!
          moduleCompleted = mod.title;
        }
      }
    });

    // Level formula: 1 level per 100 XP
    user.level = Math.max(1, Math.floor(user.xp / 100) + 1);

    await this.persistUser(user);

    return {
      xpEarned,
      isDuplicateToday,
      streak: user.streak,
      newTotalXp: user.xp,
      moduleCompleted,
      isPersonalBest,
      user
    };
  }

  public async addDirectXp(amount: number): Promise<UserProfile | null> {
    if (!this.currentUser) return null;
    const user = { ...this.currentUser };
    user.xp = (user.xp || 0) + amount;
    user.level = Math.max(1, Math.floor(user.xp / 100) + 1);
    await this.persistUser(user);
    return user;
  }

  // Admin Tools: Update any user or reset
  public async adminUpdateUser(updatedUser: UserProfile): Promise<void> {
    if (!this.isAdmin()) throw new Error('Admin role required');
    const all = this.getAllLocalUsers();
    const idx = all.findIndex(u => u.uid === updatedUser.uid);
    if (idx >= 0) {
      all[idx] = updatedUser;
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(all));
    }
    // Also update online Firebase RTDB
    await firebaseRtdbService.saveUser(updatedUser).catch(() => {});
  }

  public async adminDeleteUser(uid: string): Promise<void> {
    if (!this.isAdmin()) throw new Error('Admin role required');
    let all = this.getAllLocalUsers();
    all = all.filter(u => u.uid !== uid);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(all));
    // Also remove from online Firebase RTDB
    await firebaseRtdbService.deleteUser(uid).catch(() => {});
  }

  // Test Firebase connection (RTDB & Cloud Sync)
  public async testFirebase(): Promise<{ 
    success: boolean; 
    message: string; 
    url?: string;
    latencyMs?: number; 
    status?: string;
  }> {
    const rtdbRes = await firebaseRtdbService.testConnection();
    if (rtdbRes.success) {
      return {
        success: true,
        message: `Connected to Firebase Realtime Database (${rtdbRes.latencyMs}ms)! Real-time progress syncing is active.`,
        url: rtdbRes.url,
        latencyMs: rtdbRes.latencyMs,
        status: rtdbRes.status,
      };
    }

    if (rtdbRes.status === 'PERMISSION_DENIED') {
      return {
        success: false,
        message: `Firebase Database server reachable (${rtdbRes.latencyMs}ms) at ${rtdbRes.url}, but returned 401 Permission Denied. In Firebase Console, set Rules to public read/write for test evaluation.`,
        url: rtdbRes.url,
        latencyMs: rtdbRes.latencyMs,
        status: rtdbRes.status,
      };
    }

    return {
      success: false,
      message: rtdbRes.message || 'Could not connect to Firebase Realtime Database.',
      url: rtdbRes.url,
      latencyMs: rtdbRes.latencyMs,
      status: rtdbRes.status,
    };
  }
}

export const authSyncService = new AuthSyncService();
