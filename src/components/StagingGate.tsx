'use client';

import React, { useState, useEffect, useMemo } from 'react';

const STAGING_SECRET_KEYS = ['alch-dev-2026-vault', 'alch_dev_982f1b4c91'];

export default function StagingGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    // Check URL parameters: ?key=... or ?pass=...
    const params = new URLSearchParams(window.location.search);
    const keyParam = params.get('key') || params.get('pass');
    if (keyParam && STAGING_SECRET_KEYS.includes(keyParam.trim())) {
      localStorage.setItem('alchmate_dev_unlocked', 'true');
      setIsUnlocked(true);
      return;
    }

    const saved = localStorage.getItem('alchmate_dev_unlocked');
    if (saved === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0d0f12]" />;
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4 text-[#e0e6ed] font-sans">
        <div className="max-w-md w-full bg-[#12151e] border border-[#262e40] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl text-amber-400">
            🔒
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-white tracking-wide">Access Restricted</h1>
            <p className="text-xs text-neutral-400">Private Staging Environment</p>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Please enter your access key to continue:
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = keyInput.trim();
              if (STAGING_SECRET_KEYS.includes(trimmed)) {
                localStorage.setItem('alchmate_dev_unlocked', 'true');
                setIsUnlocked(true);
              } else {
                setError('Access denied. Invalid key.');
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              placeholder="Enter access key"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setError(null);
              }}
              className="w-full bg-[#181d28] border border-[#2a3449] rounded-xl px-4 py-3 text-white text-center font-mono text-sm focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
              autoFocus
            />
            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Authorize Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
