'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Zap
} from 'lucide-react';
import { useAlchMate } from '../context/AlchMateContext';

interface LinkRuneLiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LinkRuneLiteModal({ isOpen, onClose }: LinkRuneLiteModalProps) {
  const { 
    syncToken, 
    setSyncToken, 
    showToast,
    userCoins,
    userNats,
    allAccounts,
    activeAccount,
    isLocalServer,
    syncedCharacters
  } = useAlchMate();

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(syncToken);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'checking' | 'connected' | 'waiting'>('checking');
  const [lastCharacter, setLastCharacter] = useState<any>(null);

  const endpointUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/sync` 
    : 'https://alchmate-web.vercel.app/api/sync';

  // Check sync status whenever modal opens, syncToken changes, or isLocalServer changes
  useEffect(() => {
    if (!isOpen) return;

    if (isLocalServer && syncedCharacters.length > 0) {
      setSyncStatus('connected');
      setLastCharacter(syncedCharacters.find((c) => c.rsn === activeAccount) || syncedCharacters[0]);
      return;
    }

    if (!syncToken) {
      setSyncStatus('waiting');
      return;
    }

    let isMounted = true;
    const checkSync = async () => {
      try {
        setSyncStatus('checking');
        const res = await fetch(`/api/sync?token=${encodeURIComponent(syncToken)}`);
        if (!res.ok) throw new Error('Failed to query sync');
        const data = await res.json();
        if (isMounted) {
          if (data?.character || (data?.characters && data.characters.length > 0)) {
            setSyncStatus('connected');
            setLastCharacter(data.character || data.characters[0]);
          } else {
            setSyncStatus('waiting');
          }
        }
      } catch {
        if (isMounted) setSyncStatus('waiting');
      }
    };

    checkSync();
    const interval = setInterval(checkSync, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, syncToken, isLocalServer, syncedCharacters, activeAccount]);

  // Keep input in sync
  useEffect(() => {
    setCustomKeyInput(syncToken);
  }, [syncToken]);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    if (!syncToken) return;
    navigator.clipboard.writeText(syncToken);
    setCopiedKey(true);
    showToast('🔑 Copied Cloud Sync Key to clipboard!');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopiedUrl(true);
    showToast('🌐 Copied API Endpoint URL to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleGenerateNewKey = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const newKey = `alch_${randomHex}`;
    setSyncToken(newKey);
    setCustomKeyInput(newKey);
    setIsEditingKey(false);
    showToast('✨ Generated new Cloud Sync Key!');
  };

  const handleSaveCustomKey = () => {
    if (!customKeyInput.trim()) return;
    setSyncToken(customKeyInput.trim());
    setIsEditingKey(false);
    showToast('💾 Saved custom Sync Key!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#141720] border border-[#2a3449] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative text-neutral-200 text-sm font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#181d28] border-b border-[#232b3b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                RuneLite Cloud Sync & API Key
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Official Bridge
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Connect the in-game RuneLite plugin to your web dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202738] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Connection Status Banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            syncStatus === 'connected'
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-[#181d28] border-[#2a3449] text-neutral-300'
          }`}>
            <div className="flex items-center gap-2.5">
              {syncStatus === 'connected' ? (
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
              ) : syncStatus === 'checking' ? (
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
              )}
              <div>
                <span className="font-bold text-xs uppercase tracking-wider block">
                  {isLocalServer ? '⚡ RuneLite Local Server Connected (0ms Latency)' : syncStatus === 'connected' ? '🟢 Plugin Connected & Active' : syncStatus === 'checking' ? '🟡 Checking Live Link...' : '⚪ Waiting for RuneLite Link'}
                </span>
                {syncStatus === 'connected' && lastCharacter && (
                  <span className="text-[11px] text-emerald-400/80 font-mono">
                    Character: <strong>{lastCharacter.rsn}</strong> | Liquid: <strong>{Number(lastCharacter.coins || 0).toLocaleString()} gp</strong> | Nats: <strong>{Number(lastCharacter.nature_runes || 0).toLocaleString()}</strong>
                  </span>
                )}
                {syncStatus === 'waiting' && (
                  <span className="text-[11px] text-neutral-400">
                    Paste the key below into RuneLite settings to start syncing.
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSyncStatus('checking');
                fetch(`/api/sync?token=${encodeURIComponent(syncToken)}`)
                  .then((r) => r.json())
                  .then((d) => {
                    if (d?.character || (d?.characters && d.characters.length > 0)) {
                      setSyncStatus('connected');
                      setLastCharacter(d.character || d.characters[0]);
                      showToast('🟢 Sync verified successfully!');
                    } else {
                      setSyncStatus('waiting');
                      showToast('No active events received yet. Check RuneLite plugin settings.');
                    }
                  })
                  .catch(() => setSyncStatus('waiting'));
              }}
              className="text-xs px-2.5 py-1 rounded bg-[#202738] hover:bg-[#283248] text-neutral-300 border border-[#34415d] transition font-mono"
            >
              Test Link
            </button>
          </div>

          {/* Sync Key Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="text-amber-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Your Private Cloud Sync Key
              </label>
              <div className="flex items-center gap-2">
                {isEditingKey ? (
                  <button
                    onClick={handleSaveCustomKey}
                    className="text-emerald-400 hover:underline text-[11px]"
                  >
                    Save Key
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingKey(true)}
                    className="text-neutral-400 hover:text-white hover:underline text-[11px]"
                  >
                    Edit / Paste Custom
                  </button>
                )}
                <span className="text-neutral-600">|</span>
                <button
                  onClick={handleGenerateNewKey}
                  className="text-amber-400 hover:underline text-[11px]"
                >
                  Generate New
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly={!isEditingKey}
                  value={isEditingKey ? customKeyInput : syncToken}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  className={`w-full bg-[#181d28] border ${
                    isEditingKey ? 'border-amber-400 ring-1 ring-amber-400' : 'border-[#2a3449]'
                  } rounded-xl px-3.5 py-2.5 font-mono text-xs text-white tracking-wider focus:outline-none`}
                  placeholder="alch_live_..."
                />
              </div>

              <button
                onClick={handleCopyKey}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs transition shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>
          </div>

          {/* Cloud API Endpoint Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 block">
              Cloud API Endpoint
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={endpointUrl}
                className="w-full bg-[#181d28] border border-[#2a3449] rounded-xl px-3.5 py-2 font-mono text-xs text-neutral-400 focus:outline-none select-all"
              />
              <button
                onClick={handleCopyUrl}
                className="bg-[#202738] hover:bg-[#283248] text-neutral-200 border border-[#34415d] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-[#181d28] border border-[#2a3449] rounded-xl p-4 space-y-2.5">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>📖</span> How to Link RuneLite in 3 Steps:
            </h3>
            <ol className="text-xs space-y-2 text-neutral-300 list-decimal list-inside leading-relaxed font-sans">
              <li>
                In your <strong>RuneLite Client</strong>, click the <strong>Configuration (wrench)</strong> icon on the right side toolbar.
              </li>
              <li>
                Search for <strong>AlchMate</strong> in your plugin list and click its settings gear.
              </li>
              <li>
                Turn ON <strong>Enable Cloud Sync</strong> and paste your <strong>Cloud Sync Key</strong> into the box.
              </li>
            </ol>
            <div className="pt-1 text-[11px] text-amber-300/90 font-mono">
              ✨ That's it! Your coins, nature runes, 4h GE timers, and active alch session logs will now stream directly to this web dashboard in real-time.
            </div>
          </div>

          {/* Privacy & Hub Compliance Guarantee */}
          <div className="bg-[#0f121a] border border-blue-500/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-neutral-400">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-200 block mb-0.5">RuneLite Plugin Hub Compliant & Secure</strong>
              <span>
                Sync is strictly opt-in via your private token. In accordance with RuneLite Hub rules, no passwords, account credentials, or bank PINs are ever transmitted or stored.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#181d28] border-t border-[#232b3b] flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-mono text-[11px]">
            Key ID: {syncToken ? `${syncToken.slice(0, 8)}...` : 'None'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
