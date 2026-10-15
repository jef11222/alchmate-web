# AGENTS.md — AlchMate Web Application Architecture & Agent Guide

This document is the authoritative guide for AI coding agents working on the **`alchmate-web`** repository.

---

## 1. Project Tech Stack & Overview

* **Framework:** Next.js 16 (App Router)
* **Frontend:** React, Tailwind CSS, Lucide Icons, TypeScript
* **State Management:** React hooks (`useState`, `useMemo`, `useCallback`, `useEffect`), Browser Storage
* **Backend Routes:** Next.js Route Handlers (`src/app/api/prices/route.ts`, `src/app/api/sync/route.ts`)
* **Cloud Database:** Supabase PostgreSQL (`profiles`, `characters`, `alch_sessions`, `daily_stats`)
* **Deployment Target:** Vercel (HTTPS production)

---

## 2. Inviolable Web Architecture & Security Rules

### A. Browser Sandbox & Network Boundaries (CORS / PNA)
* When running in production over HTTPS (`https://alchmate-web.vercel.app`), modern browsers (Chrome, Edge, Firefox, Safari) enforce strict **Private Network Access (PNA)** and **Mixed Content** blocking.
* **RULE:** Web code MUST NEVER attempt direct fetch calls to `http://127.0.0.1:18833` from client components.
* All live integration from RuneLite clients MUST flow through the cloud sync endpoint:
  `POST /api/sync` authenticated via `Bearer <sync_token>` or `?token=<sync_token>`.

### B. OSRS Grand Exchange Tax Rule
* In OSRS, GE tax is **strictly 1%**, capped at $5,000,000\text{ gp}$.
* **RULE:** Always use `Math.floor(gross_sell * 0.99)` for net GE revenue calculations.
* **NEVER use `0.98`** (which falsely takes 2% tax).

### C. DOM & Table Rendering Performance
* The High Alch table and Crafting tables process thousands of items.
* **RULE:** Never render $>150$ complex table rows with tooltips and event listeners into the DOM simultaneously without pagination or virtualization.
* Use pagination (`Page X of Y`, 50 / 100 / All items per page) or virtualization so the page maintains 60 FPS scrolling and low memory usage.

### D. Browser LocalStorage Quota Guardrail
* Browsers impose a hard **5 MB quota** on `localStorage`.
* **RULE:** Do not accumulate thousands of raw session objects into `localStorage.setItem('alchmate_session_log')`.
* For long-term historical records, retrieve and persist sessions through the Supabase cloud sync endpoints (`/api/sync`), keeping only recent sessions in local cache.

---

## 3. API Route Specifications

### 1. `/api/prices` (GET)
* **Purpose:** Serves latest OSRS prices, high alch margins, 5m volume velocity, and bond metrics.
* **Caching:** In-memory server cache with a minimum 60-second TTL.
* **External Header:** Must provide `User-Agent: AlchMate-Web/1.0 (contact: github.com/jef11222)` to the Weird Gloop API.
* **Data Sources:** Parallel fetches from Wiki `/latest`, `/mapping`, `/volumes`, `/5m`, and `/timeseries?timestep=1h&id=13190`.

### 2. `/api/sync` (GET & POST)
* **Purpose:** Ingests live events from RuneLite clients and returns character wealth, runes, and batch session history.
* **Authentication:** Private `sync_token` provisioned per user profile.
* **Supabase Client:** Uses `supabaseAdmin` with service role / anon key for row upserts into:
  - `profiles`: `id`, `sync_token`, `created_at`
  - `characters`: `user_id`, `rsn`, `coins`, `nature_runes`, `total_wealth`, `world`, `is_members`, `last_seen`
  - `alch_sessions`: `user_id`, `rsn`, `item_id`, `item_name`, `qty`, `buy_price`, `nat_price`, `alch_val`, `profit`, `xp`, `cost_basis_type`
  - `daily_stats`: `user_id`, `rsn`, `date`, `total_alchs`, `total_profit`, `total_xp`

---

## 4. UI & Component Standards

* **Color Palette:**
  - Background: Deep Dark `#0c0e14` / Card `#14171f` / Border `#242b3b`
  - Accents: Gold/Amber `#f59e0b` (Primary Alch), Emerald `#10b981` (Profit/Complete), Rose `#f43f5e` (Loss/Warning), Cyan `#06b6d4` (Velocity/Magic)
* **Interactive Modals:**
  - All modals must trap Escape key, provide a background click dismissal, and prevent background body scrolling when open.
* **Tooltips:**
  - Full explainer `<Tooltip>` component on all table headers explaining what the metric means and how it is derived.
