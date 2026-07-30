# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are **root-cause seekers** — adults frustrated with conventional care who are dealing with persistent, non-acute complaints (fatigue, poor sleep, gut issues, hormone imbalance, stress/anxiety, brain fog, cravings) and want natural, root-cause answers rather than symptom management. They are health-motivated, willing to log details and read guidance, and comfortable acting on their own health decisions. Onboarding profiles them across goals, symptoms, diet, sleep, stress, activity, pregnancy/nursing status, and existing conditions.

The experience is built mobile-first (installable/PWA-style: apple-touch-icon, fullscreen web-app meta, viewport-fit cover), so the usage scene is a phone in hand day-to-day, with a capable desktop layout.

## Product Purpose

NŪRA is a personal wellness platform ("Your Personal Health OS") that gives people direct, personalized natural-wellness guidance and unifies the signals that inform it. It exists to help someone understand what is driving how they feel and take specific, natural action on it. Success means the user gets guidance they trust and act on, and returns to NŪRA as the place they think through their health.

## Positioning

NŪRA is an **unfiltered natural-wellness AI**: it gives direct, root-cause, holistic guidance that mainstream health apps avoid — herbs, supplements, nutritional therapy, essential oils, movement, and lifestyle protocols — grounded in a curated wellness knowledge base rather than generic web output. The AI guide's stated philosophy is that the body has self-healing capacity given the right inputs, drawing on both traditional wisdom and modern research, and addressing root causes over symptoms. The defensible edge is the combination: a willing, opinionated natural-wellness voice + a curated knowledge base + the user's own profile and data, in one product.

## Operating Context

A single logged-in user works across an integrated set of surfaces:

- **AI guide** — conversational chat (text, voice, and photo input such as snapping a supplement label), with saved sessions.
- **Health dashboard** — Apple-Health-style metric tiles and detail views (heart rate, resting HR, HRV, respiratory rate, blood oxygen, blood pressure, body temperature as deviation from personal baseline, sleep, steps, movement, active energy, cardio fitness), plus an **Overall Health Score** blended from six pillars with a personalized plan.
- **Bloodwork / lab** — upload results, biomarker interpretation and narration against wellness ranges (educational, explicitly non-diagnostic).
- **Nutrition** — recipes, meal plans, grocery lists, nutrition markers, saved items; personalization reads the user's real marker values.
- **Supplements** — barcode scanning and label capture, logging, stats, and a product catalog.
- **Fitness** — AI program generation, training calendar, muscle-group map, progress tracking, exercise how-to/GIF comparison.
- **Account** — onboarding, settings, integrations, Stripe billing, and legal/consent flows (terms, privacy, medical disclaimer, accept-terms).
- **Admin** — internal tooling to curate the knowledge base, lab/biomarker data, nutrition, recipes, and product catalog that power the user-facing surfaces.

## Capabilities and Constraints

- **Not medical advice — binding.** All content (AI responses, bloodwork analysis, supplement suggestions, protocols) is general wellness and educational only, never diagnosis, treatment, or prescription. NŪRA is not a licensed provider or telehealth service, is not for emergencies, and directs users to qualified providers. This framing must be preserved in all future work; do not phrase features as clinical, diagnostic, or prescriptive.
- **Personalization is real and central.** Guidance references the user's onboarding profile, goals/symptoms, marker values, and metrics; body temperature is modeled as deviation from a personal baseline, and several dashboards use personal baselines/reference lines.
- **Knowledge base is curated (RAG).** Guidance is grounded in an admin-ingested knowledge base with embeddings/search, not open-web scraping.
- **Subscription-gated.** A free tier plus **NŪRA Pro** ($9.99/mo, 3-day free trial) which unlocks unlimited AI conversations, advanced bloodwork analysis, full knowledge-base access, unlimited saved protocols/stacks, and priority support.

## Brand Commitments

- **Name:** NŪRA (styled with the macron on the "U": NŪRA). Operated under WLKS Ventures.
- **Voice:** a knowledgeable, caring natural-wellness guide — direct and "unfiltered," root-cause oriented, warm but not clinical. It personalizes without reciting the user's profile back at them.
- Existing app icons and manifest assets live in `public/` (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).

## Evidence on Hand

- **Real / functional:** AI chat (Anthropic + OpenAI) with a defined system persona; bloodwork upload + narration; supplement barcode lookup and scanning; Stripe billing and subscription status; curated knowledge base with embeddings; AI fitness-program generation; the full onboarding profile. HTML design references exist in `design-reference/` and `mockups/`.
- **Sample / not yet real — do not present as live user data:** the health-metric dashboards currently run on representative **sample/seeded data** (e.g. dashboard data marked "SAMPLE seeds for now"). Wearable / device sync (Apple Health, etc.) is the roadmap intent but is **not yet connected**. Future work must not imply live wearable data or fabricate metrics, benchmarks, testimonials, or user counts.

## Product Principles

- **Root cause over symptom.** Frame guidance around what's driving how the user feels, not quick fixes.
- **Unfiltered but responsible.** Give direct, opinionated natural-wellness guidance while always holding the educational, not-medical-advice line.
- **Personal by default.** Every surface should reflect this specific user's profile, goals, and data — generic output is a failure.
- **One connected system.** Metrics, bloodwork, nutrition, supplements, and fitness inform each other; they are one health picture, not siloed tools.
- **Grounded, not generic.** Prefer the curated knowledge base and the user's real data over unsourced claims.

## Accessibility & Inclusion

No product-specific accessibility standard has been established yet; treat WCAG AA as the working baseline for future work and confirm any stricter requirement before relying on it.
