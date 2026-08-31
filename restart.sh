#!/usr/bin/env bash
# Kills any stuck dev server holding port 3000, then starts a fresh one with
# file-polling so code changes actually reload.
echo "→ Stopping any running dev servers…"
lsof -ti tcp:3000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti tcp:3001 2>/dev/null | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 1
echo "→ Starting fresh on http://localhost:3000 …"
WATCHPACK_POLLING=true npm run dev
