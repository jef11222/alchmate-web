'use client';

import React, { useState, useEffect } from 'react';
import { Heart, X, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';

export default function CommunityTierBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem('alchmate_dismiss_tier_banner');
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch {}
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('alchmate_dismiss_tier_banner', 'true');
    } catch {}
  };

  if (dismissed && !showModal) return null;

  return (
    <>
      {!dismissed && (
        <div className="bg-gradient-to-r from-amber-950/40 via-[#181d28] to-amber-950/40 border-b border-amber-500/20 px-4 py-2 text-xs font-sans text-neutral-300 select-none">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <p className="truncate text-neutral-300">
                <strong className="text-amber-400 font-semibold">Community Free-Tier Notice:</strong>{' '}
                AlchMate is free &amp; open-source. Hosted on free server tiers — if monthly limits are reached, live syncing may temporarily pause until renewal.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowModal(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Heart className="w-3 h-3 text-rose-400 fill-rose-400/50" />
                <span>Support Server</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#202738] transition cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support & Server Tier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-[#141720] border border-[#2a3449] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative text-neutral-200 text-sm font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#181d28] border-b border-[#232b3b] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Community Server Support
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Keeping AlchMate 100% free, fast, and accessible
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202738] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs leading-relaxed text-neutral-300">
              <div className="bg-[#181d28] p-3.5 rounded-xl border border-[#2a3449] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Why this notice exists</span>
                </div>
                <p>
                  AlchMate is developed independently for the Old School RuneScape community with zero ads, zero paywalls, and zero tracking. 
                  All serverless APIs and databases currently run on <strong>free community tiers</strong> (Vercel &amp; Supabase).
                </p>
                <p>
                  As more players connect multiple accounts and run live alch sessions simultaneously, serverless compute and database limits could be reached near the end of a billing cycle, causing temporary downtime.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  How Community Support Helps
                </h3>
                <ul className="space-y-1.5 list-disc list-inside text-neutral-300">
                  <li>Upgrades hosting to <strong>Vercel Pro</strong> ($20/mo) for unlimited invocations &amp; global edge speed.</li>
                  <li>Upgrades database to <strong>Supabase Pro</strong> ($25/mo) with automated daily backups and zero pause timers.</li>
                  <li>Funds dedicated high-speed RuneLite cloud bridge servers.</li>
                </ul>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 text-center space-y-2">
                <span className="font-bold text-amber-300 block text-xs">
                  Want to contribute or help cover hosting?
                </span>
                <p className="text-[11px] text-neutral-400">
                  Community donations directly fund cloud infrastructure renewals.
                </p>
                <div className="pt-1 flex items-center justify-center gap-2">
                  <a
                    href="https://github.com/jef11222"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition text-xs shadow-md"
                  >
                    <Heart className="w-3.5 h-3.5 fill-black" />
                    <span>Support on GitHub / Donate</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#181d28] border-t border-[#232b3b] flex items-center justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#202738] hover:bg-[#2a3449] text-white font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
