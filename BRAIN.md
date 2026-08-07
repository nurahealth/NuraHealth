# 🧠 NŪRA — Brain / Source of Truth

> Bridged from Austin's Obsidian vault ("Austin's-2nd-Brain"). The **vault is the master**; keep this file in sync when durable facts change. Last synced 2026-08-06.

## What this is
NŪRA App — AI-powered **natural wellness app** (Austin's #1 venture). RAG over herbal medicine, nutritional therapy, holistic protocols. Positioned as a **"Personal Health OS."** Subscription, iOS + web. Pre-launch, targeting **Oct 2026**.

## Brand
- **NŪRA** (macron on the U, ®) is the parent brand; **nūra botanicals** (clean personal-care line) and **WLKS Collective** (agency) are siblings.
- Voice: "unfiltered natural-wellness guide."
- Wellness/educational only — **never** give medical advice. Preserve that line everywhere.

## Product truth
- Subscription: **Pro $9.99/mo, 3-day free trial**. `isUserPro` = true for both "trialing" AND "active".
- Signature feature — **Lab Reports**: product-safety scoring with a **Purity Score + separate Evidence Grade**, strict **no-extrapolation** (score tied to a specific SKU/formulation), penalties anchored to FDA/EPA/Prop 65. Legal-sensitive — avoid any trade-libel exposure.
- Dashboards currently run on **sample seed data** — do NOT design or build as if live wearable data exists.
- Compliance: **MHMDA** consumer-health-data privacy + opt-in consent (Washington's private right of action = highest risk). HIPAA N/A (DTC manual upload).

## Design system (LOCKED — match exactly)
Palette: background near-black **#0d0d0e**, accent **sage #9bb0a5**, text warm off-white **#ebe6d8**. Logo: lowercase "nūra", Poppins Bold.

- **TWO LAWS (locked 2026-08-05):** (1) **DARK MODE IS FROZEN** — no prompt changes dark values without Austin's explicit approval. (2) **ONE DESIGN, TWO SKINS** — light/dark share identical chart geometry; only rendering differs. Every visual Claude Code prompt carries both laws at the top.
- **Mockup-first (locked):** visual changes get an HTML mockup approved by Austin BEFORE any Claude Code run; the run implements exact approved values.
- **Light mode = premium "Luminous" system** (approved via mockups 2026-08-05/06):
  - Text is ink **#1a1a1a** / AA-compliant gray. **No sage headings or stat numbers in light mode.**
  - Charts: three-tone sage — deep #4e6a5c (gradient #35523f→#5d7b6b, peaks/current/lines), mid #7d968a (gradient #71897c→#8aa093), quiet = **cool sage mist #dfe5e0** (NEVER warm gray — reads brown). Tracks #e8ede9. Emphasis bars get 1.4px white inner top-edge highlight.
  - **Luminous aura** on emphasis marks only (goal-hit/peak/latest bars, rings, latest-point dots): #7d968a blur 3-4.5, opacity ~.40, beneath the mark. Standard/mist marks get none. Cards carry sage-tinted shadow (0 10px 28px rgba(125,150,138,.16)).
  - **Health Score dial = HALO design, both modes** (fine tick texture ring + 13px score arc r118 + luminous halo + inner-edge highlight + end dot; light uses double halo blur13/.55 + blur4/.30, arc #2f4a39→#86a292). Dial is the strongest glow on the page — keep it king.
  - **No text inside the plot, ever** — baselines/ranges live in chips/chrome above the chart, never painted over data.
  - Canvas **#faf9f6**, cards **#ffffff**. Contrast floors: marks ≥ 3:1, text ≥ 4.5:1.
  - Status trio reserved for status chips only — **never** as chart/categorical colors (caused the amber-Activity and amber-Awake bugs).
- One central **theme token system** (CSS variables) owns every color, light + dark. No component hardcodes its palette.
- **Never downgrade components** — match the onboarding aesthetic app-wide. Onboarding = 6-step flow, locked.
- Desktop: one centered measure per page (`NuraPageShell` `desktopMaxWidth`), 40px gutter, 24px between stacked blocks. **Health Score dial is the hero.** Use dev-only **`/dev/preview`** to check 1440 + 390 viewports before committing layout.

## Tech — READ BEFORE BUILDING
- Stack: **Next.js (App Router, TypeScript) / Supabase / Stripe.** iOS + web. Apple Health + Google Health Connect. Early offline Ollama. Bloodwork/lab upload.
- ⚠️ This Next.js has breaking changes vs. training data — see `AGENTS.md`; read `node_modules/next/dist/docs/` before writing code.
- **Git:** active branch is **`app-build`** — always confirm `git branch --show-current` first (multiple Claude Code sessions share this folder). `main` stays clean until launch. **Never `git checkout` while `npm run dev` is running** — it poisons the `.next` cache (blank screen). Fix: stop server, `rm -rf .next`, restart.
- **Supabase** project "Nura Health App" (ref `obkhzgvhxjdgbihuglrx`, us-east-1). Schema was built by hand in the SQL editor — **`supabase/migrations/` files are STALE, do NOT match the live DB, and must NOT be applied.**
- Known bug: the in-app "strength logging needs a migration" message is an **app-code bug** — `workout_logs` + `set_logs` already exist and are correct; the Finish button writes `workout_completions` but not the detailed sets. Fix is **app code only**, no DB change.
- Apple Sign-In JWT **expires Nov 23, 2026 — regenerate ~Nov 16, 2026.**

## Marketing funnel
Free **condition books** (e.g. the Alpha-Gal Recovery Roadmap) capture emails → the app converts them to subscribers → **nūra botanicals** sells physical product to the same audience.

## Skills to build with
Installed live in Claude Code — use them:
- **Impeccable** — `/impeccable document | polish <surface> | critique <surface>`; design-slop detector runs on edits.
- **UI UX Pro Max** — design knowledge base (161 reasoning rules, 84 UI styles, per-stack guidance for Next.js/React/shadcn).

Reference libraries in the Obsidian vault (`~/Austin's-2nd-Brain`) — pull via Austin or Claude in Cowork:
- **Design Skills** (Taste): Redesign, Soft, Stitch, Minimalist — premium UI direction.
- **Marketing / Social Skills**: launch, ASO, paywalls, lifecycle, content.

## Keeping this current
This file mirrors the vault (the source of truth). When a durable fact changes (design token, pricing, stack, launch date), update the vault note first, then refresh this file. Ask Claude in Cowork to re-sync.
