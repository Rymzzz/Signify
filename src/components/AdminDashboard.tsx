import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Zap, 
  Trophy, 
  Trash2, 
  ArrowLeft,
  Settings,
  KeyRound,
  UploadCloud,
  DownloadCloud,
  Copy,
  Check,
  ExternalLink,
  Globe
} from 'lucide-react';
import { UserProfile } from '../types/index';
import { authSyncService } from '../services/authSyncService';
import { getSavedFirebaseConfig, saveFirebaseConfig, FirebaseConfigParams, DEFAULT_RTDB_URL } from '../services/firebaseConfig';
import { firebaseRtdbService, RtdbConnectionStatus } from '../services/firebaseRtdbService';

interface AdminDashboardProps {
  onBackToDashboard: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToDashboard }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fbConfig, setFbConfig] = useState<FirebaseConfigParams>(getSavedFirebaseConfig());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number; status?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [dbStatus, setDbStatus] = useState<RtdbConnectionStatus | null>(firebaseRtdbService.getLastStatus());

  const loadUsers = () => {
    setUsers(authSyncService.getAllLocalUsers());
  };

  useEffect(() => {
    loadUsers();
    const unsub = firebaseRtdbService.subscribeStatus(st => setDbStatus(st));
    if (!firebaseRtdbService.getLastStatus()) {
      firebaseRtdbService.testConnection().catch(() => {});
    }
    return unsub;
  }, []);

  const handleTestFirebase = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await authSyncService.testFirebase();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Firebase test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncToOnlineRtdb = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await authSyncService.syncAllToFirebaseRtdb();
      if (res.success) {
        setSyncFeedback(`Successfully pushed ${res.syncedCount} student profiles to Firebase Realtime Database!`);
      } else {
        setSyncFeedback(`Sync note: ${res.error}`);
      }
    } catch (err: any) {
      setSyncFeedback(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromOnlineRtdb = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const updated = await authSyncService.fetchUsersFromFirebaseRtdb();
      setUsers(updated);
      setSyncFeedback(`Successfully fetched and merged ${updated.length} accounts from Firebase!`);
    } catch (err: any) {
      setSyncFeedback(`Fetch error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(fbConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('Are you sure you want to remove this user from the local registry?')) {
      await authSyncService.adminDeleteUser(uid);
      loadUsers();
    }
  };

  const handleExportDatabase = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `signify-users-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 py-2 pb-14">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-2xl bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-emerald-300 hover:text-white transition-colors cursor-pointer"
            title="Return to Learner Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Admin & Database Portal</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Institutional Authority
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 mt-0.5">
              Manage student accounts, track cross-device progress synchronization, and manage Google Cloud Firebase credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportDatabase}
            className="px-4 py-2.5 rounded-xl bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-xs font-bold text-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Database JSON</span>
          </button>

          <button
            onClick={loadUsers}
            className="p-2.5 rounded-xl bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-emerald-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Users List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/70">
            Total Learners
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {users.length}
          </div>
        </div>

        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/70">
            Total XP Distributed
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {users.reduce((acc, u) => acc + (u.xp || 0), 0)} XP
          </div>
        </div>

        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/70">
            Average Streak
          </span>
          <div className="text-2xl sm:text-3xl font-black text-orange-400 font-mono">
            {users.length > 0 
              ? Math.round(users.reduce((acc, u) => acc + (u.streak || 0), 0) / users.length) 
              : 0} Days
          </div>
        </div>

        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/70">
            Cloud Firebase Sync
          </span>
          <div className="text-sm font-bold flex items-center gap-1.5 pt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${
              dbStatus?.status === 'CONNECTED' 
                ? 'bg-emerald-400 animate-pulse' 
                : dbStatus?.status === 'PERMISSION_DENIED'
                ? 'bg-amber-400' 
                : 'bg-emerald-400/60'
            }`} />
            <span className={dbStatus?.status === 'PERMISSION_DENIED' ? 'text-amber-300' : 'text-emerald-300'}>
              {dbStatus?.status === 'CONNECTED' 
                ? 'RTDB Online Synced' 
                : dbStatus?.status === 'PERMISSION_DENIED' 
                ? 'Rules Locked (401)' 
                : 'Offline-First & Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Users Management Registry */}
      <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Registered Learner Directory</h3>
            <p className="text-xs text-emerald-300/80">
              Real-time synchronization status across mobile and web devices.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-[#071F15] px-3 py-1 rounded-xl border border-[#164432]">
            {users.length} Total Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#164432] text-emerald-400/80 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Learner</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Streak</th>
                <th className="py-3 px-3">Experience</th>
                <th className="py-3 px-3">Signs Done</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#164432]/60">
              {users.map(u => (
                <tr key={u.uid} className="hover:bg-[#0E3627]/40 transition-colors">
                  <td className="py-3 px-3 flex items-center space-x-2.5">
                    <span className="text-xl">{u.avatar || '👤'}</span>
                    <div>
                      <span className="font-bold text-white block">{u.displayName}</span>
                      <span className="text-[11px] text-emerald-400/70 font-mono">{u.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-orange-400">
                    {u.streak}d
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-300">
                    {u.xp} XP
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {u.completedSigns?.length || 0} signs
                  </td>
                  <td className="py-3 px-3 text-emerald-300/70 font-mono text-[11px]">
                    {u.lastActiveDate || 'Today'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u.uid)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Cloud Firebase Integration Manager */}
      <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Firebase Realtime Database & Cloud Sync
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  dbStatus?.status === 'CONNECTED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : dbStatus?.status === 'PERMISSION_DENIED'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {dbStatus?.status === 'CONNECTED' ? 'Online Synced' : dbStatus?.status === 'PERMISSION_DENIED' ? 'Rules Locked (401)' : 'Ready'}
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Centralized live database connecting student streaks, XP, modular progress, and speed records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleTestFirebase}
              disabled={testing}
              className="px-3.5 py-2 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {/* Database Endpoint Card */}
        <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-300/80 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Live Database URL (Google Cloud asia-southeast1)
            </span>
            <a 
              href={fbConfig.databaseURL || DEFAULT_RTDB_URL} 
              target="_blank" 
              rel="noreferrer"
              className="text-emerald-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <span>Console Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="font-mono text-xs text-amber-300 select-all break-all bg-[#0B2A1E] px-3.5 py-2.5 rounded-xl border border-[#164432]">
            {fbConfig.databaseURL || DEFAULT_RTDB_URL}
          </div>
        </div>

        {/* Two-Way Push / Pull Sync Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleSyncToOnlineRtdb}
            disabled={syncing}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{syncing ? 'Synchronizing...' : 'Push All Local Learners to Firebase'}</span>
          </button>

          <button
            onClick={handlePullFromOnlineRtdb}
            disabled={syncing}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-emerald-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <DownloadCloud className="w-4 h-4 text-emerald-400" />
            <span>{syncing ? 'Fetching...' : 'Pull Online Accounts from Firebase'}</span>
          </button>
        </div>

        {syncFeedback && (
          <div className="p-3 rounded-xl bg-[#071F15] border border-emerald-500/40 text-xs font-mono text-emerald-300">
            {syncFeedback}
          </div>
        )}

        {testResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
            testResult.success 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200' 
              : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>{testResult.success ? 'Firebase Realtime DB Connected' : 'Firebase Connection Notice'}</span>
              </div>
              {testResult.latencyMs !== undefined && (
                <span className="font-mono bg-[#071F15] px-2 py-0.5 rounded text-[11px] border border-[#164432]">
                  {testResult.latencyMs}ms latency
                </span>
              )}
            </div>
            <p className="pl-6 text-[11px] leading-relaxed">{testResult.message}</p>
          </div>
        )}

        {/* Permission Denied Rules Solution Card */}
        {dbStatus?.status === 'PERMISSION_DENIED' && (
          <div className="bg-[#071F15] border border-amber-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Action Required: Unlock Firebase Realtime Database Rules
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({ rules: { ".read": true, ".write": true } }, null, 2));
                  setCopiedRules(true);
                  setTimeout(() => setCopiedRules(false), 2000);
                }}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedRules ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRules ? 'Copied!' : 'Copy Rule JSON'}</span>
              </button>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Your database at <code className="text-amber-300 bg-[#0B2A1E] px-1.5 py-0.5 rounded font-mono text-[11px]">signify-asl-db-default-rtdb</code> is live! By default, Google Cloud locks writes until rules are specified. In Firebase Console &gt; Realtime Database &gt; Rules, publish:
            </p>
            <pre className="bg-[#0B2A1E] p-3 rounded-xl font-mono text-xs text-emerald-300 border border-[#164432] overflow-x-auto">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
            </pre>
          </div>
        )}

        {/* Database Configuration Form */}
        <form onSubmit={handleSaveFirebaseConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-[#164432] pt-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Firebase Realtime Database URL
            </label>
            <input
              type="text"
              placeholder="https://your-app-default-rtdb.firebaseio.com"
              value={fbConfig.databaseURL || DEFAULT_RTDB_URL}
              onChange={e => setFbConfig({ ...fbConfig, databaseURL: e.target.value })}
              className="w-full px-3 py-2 bg-[#071F15] border border-[#164432] rounded-xl text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400 font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Firebase Project ID
            </label>
            <input
              type="text"
              placeholder="e.g. signify-asl-db"
              value={fbConfig.projectId}
              onChange={e => setFbConfig({ ...fbConfig, projectId: e.target.value })}
              className="w-full px-3 py-2 bg-[#071F15] border border-[#164432] rounded-xl text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400 font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Firebase API Key (Optional for RTDB)
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={fbConfig.apiKey}
              onChange={e => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
              className="w-full px-3 py-2 bg-[#071F15] border border-[#164432] rounded-xl text-white placeholder-emerald-400/40 focus:outline-none focus:border-emerald-400 font-mono text-xs"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-emerald-400/70">
              * Signify synchronizes automatically to the online RTDB endpoint on every progress update.
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md cursor-pointer transition-all text-xs"
            >
              {saveSuccess ? '✓ Saved & Applied!' : 'Save Database Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
