"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY, type Theme } from "@/lib/themeStore";

// ─────────────────────────────────────────────────────────────────────────────
// Device preview (dev only — the route is gated in page.tsx).
//
// The point of this screen is to see the REAL breakpoints without owning a
// 1440px monitor. Each frame is an iframe with a genuine CSS viewport width —
// 1440 for desktop, 390 for the phone — and the whole frame is then scaled down
// with a transform to fit whatever space this window actually has. Scaling the
// picture after layout is what keeps `@media (min-width: 1024px)` honest; a
// zoomed-out browser window or a `width: 100%` iframe would not.
// ─────────────────────────────────────────────────────────────────────────────

type Mode = "desktop" | "mobile" | "both";

const DESKTOP = { w: 1440, h: 900 };
const MOBILE = { w: 390, h: 844 };

/** Browser title bar height, and the bezel thickness around the phone. */
const CHROME_H = 34;
const BEZEL = 13;

/** Caption above each frame — part of the box, so it counts toward the fit. */
const LABEL_H = 26;

const DESKTOP_BOX = { w: DESKTOP.w, h: DESKTOP.h + CHROME_H + LABEL_H };
const MOBILE_BOX = { w: MOBILE.w + BEZEL * 2, h: MOBILE.h + BEZEL * 2 + LABEL_H };

const GAP = 40;
const STAGE_PAD = 28;

const ROUTES: { label: string; path: string }[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Fitness", path: "/fitness" },
  { label: "Profile", path: "/fitness/profile" },
  { label: "Nutrition", path: "/nutrition" },
  { label: "Chat", path: "/chat" },
  { label: "Settings", path: "/settings" },
  { label: "Labs", path: "/lab" },
];

const MODES: { key: Mode; label: string }[] = [
  { key: "desktop", label: "Desktop" },
  { key: "mobile", label: "Mobile" },
  { key: "both", label: "Side-by-side" },
];

// The preview chrome is deliberately its own little design system. It must stay
// readable whichever theme the framed app is showing, so it does not consume the
// app's tokens.
const UI = {
  bg: "#15161a",
  bar: "#1d1f25",
  line: "#2c2f38",
  lineSoft: "#24272f",
  text: "#e7e9ee",
  dim: "#8f96a6",
  on: "#3f8f75",
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "var(--font-inter), system-ui, sans-serif";

// The app shell renders a docked rail and a floating theme toggle into <body>
// for every route. On this screen they would sit on top of the preview, so they
// are switched off for as long as it is mounted. Scoped by an attribute this
// component owns, and written before paint so nothing flashes.
const SHELL_RESET = `
  body[data-dev-preview] { padding-left: 0 !important; overflow: hidden; }
  body[data-dev-preview] > aside,
  body[data-dev-preview] > button { display: none !important; }
`;

function useShellReset() {
  useLayoutEffect(() => {
    document.body.setAttribute("data-dev-preview", "");
    return () => document.body.removeAttribute("data-dev-preview");
  }, []);
}

// The persisted theme, read as an external store rather than mirrored into
// state. localStorage cannot be read during render on the server, and seeding it
// from an effect would both flash and trip the cascading-render rule — so the
// server snapshot is the app's own default and the client reads the real value
// on the first commit. `notify` is called by the toggle; the storage event
// covers the value being changed in another tab.
type Listener = () => void;
let themeListeners: Listener[] = [];

const themeSource = {
  subscribe(cb: Listener) {
    themeListeners.push(cb);
    window.addEventListener("storage", cb);
    return () => {
      themeListeners = themeListeners.filter((l) => l !== cb);
      window.removeEventListener("storage", cb);
    };
  },
  get(): Theme {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  },
  server(): Theme {
    return "dark";
  },
  notify() {
    for (const l of themeListeners) l();
  },
};

/** Available stage size, tracked so the frames rescale as the window changes. */
function useStageSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
}

function scaleFor(mode: Mode, stage: { w: number; h: number }): number {
  if (!stage.w || !stage.h) return 1;
  const avail = { w: stage.w - STAGE_PAD * 2, h: stage.h - STAGE_PAD * 2 };
  const need =
    mode === "desktop" ? DESKTOP_BOX
      : mode === "mobile" ? MOBILE_BOX
        : { w: DESKTOP_BOX.w + GAP + MOBILE_BOX.w, h: Math.max(DESKTOP_BOX.h, MOBILE_BOX.h) };
  return Math.min(1, avail.w / need.w, avail.h / need.h);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PreviewClient() {
  useShellReset();

  const [mode, setMode] = useState<Mode>("desktop");
  const [route, setRoute] = useState(ROUTES[0].path);
  const theme = useSyncExternalStore(themeSource.subscribe, themeSource.get, themeSource.server);

  const [stageRef, stage] = useStageSize();
  const scale = scaleFor(mode, stage);

  const desktopRef = useRef<HTMLIFrameElement>(null);
  const mobileRef = useRef<HTMLIFrameElement>(null);
  const frames = useCallback(
    () => [desktopRef.current, mobileRef.current].filter(Boolean) as HTMLIFrameElement[],
    [],
  );

  // Route changes navigate the two iframes in place. `location.replace` rather
  // than a `src` prop: React would keep the element either way, but replace()
  // also avoids stacking history entries inside the frame. Nothing here touches
  // the preview page itself, so the toolbar state survives.
  useEffect(() => {
    for (const f of frames()) {
      if (f.contentWindow && f.getAttribute("data-loaded") === "1") {
        f.contentWindow.location.replace(route);
      } else {
        f.src = route;
        f.setAttribute("data-loaded", "1");
      }
    }
  }, [route, frames]);

  // The framed app resolves its theme from localStorage in a pre-paint script
  // and then hydrates a store from the same value. Both live inside the frame's
  // own JS context, so the honest way to switch it is: write the shared
  // same-origin key, then reload the frames. That reloads the PREVIEWED app,
  // not this page.
  const applyTheme = useCallback((next: Theme) => {
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* ignore */ }
    themeSource.notify();
    for (const f of frames()) {
      if (f.getAttribute("data-loaded") === "1") f.contentWindow?.location.reload();
    }
  }, [frames]);

  const showDesktop = mode !== "mobile";
  const showMobile = mode !== "desktop";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      display: "flex", flexDirection: "column",
      background: UI.bg, color: UI.text, fontFamily: SANS,
    }}>
      <style>{SHELL_RESET}</style>
      <style>{`
        .dp-seg { display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: #14151a; border: 1px solid ${UI.lineSoft}; }
        .dp-seg button { appearance: none; border: none; cursor: pointer; border-radius: 7px;
          padding: 6px 13px; font-size: 12.5px; font-weight: 600; font-family: inherit;
          background: transparent; color: ${UI.dim}; transition: background 140ms, color 140ms; }
        .dp-seg button:hover { color: ${UI.text}; }
        .dp-seg button[data-on="1"] { background: ${UI.on}; color: #fff; }
        .dp-frame-label { height: ${LABEL_H}px; line-height: ${LABEL_H - 9}px;
          font-family: ${MONO}; font-size: 11px; letter-spacing: .08em;
          text-transform: uppercase; color: ${UI.dim}; text-align: center; }
      `}</style>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <header style={{
        flex: "none", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
        padding: "11px 18px", background: UI.bar, borderBottom: `1px solid ${UI.line}`,
      }}>
        <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".14em", color: UI.dim }}>
          NŪRA · PREVIEW
        </span>

        <div className="dp-seg" role="group" aria-label="Device">
          {MODES.map((m) => (
            <button key={m.key} data-on={mode === m.key ? "1" : "0"} onClick={() => setMode(m.key)}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="dp-seg" role="group" aria-label="Route">
          {ROUTES.map((r) => (
            <button key={r.path} data-on={route === r.path ? "1" : "0"} onClick={() => setRoute(r.path)}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="dp-seg" role="group" aria-label="Theme" style={{ marginLeft: "auto" }}>
          {(["light", "dark"] as Theme[]).map((t) => (
            <button key={t} data-on={theme === t ? "1" : "0"} onClick={() => applyTheme(t)}>
              {t === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>

        <span style={{ fontFamily: MONO, fontSize: 11, color: UI.dim, whiteSpace: "nowrap" }}>
          {Math.round(scale * 100)}%
        </span>
      </header>

      {/* ── Stage ───────────────────────────────────────────────────────── */}
      <div
        ref={stageRef}
        style={{
          flex: 1, position: "relative", overflow: "auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: GAP * scale, padding: STAGE_PAD,
          backgroundImage: `radial-gradient(${UI.lineSoft} 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
        }}
      >
        {/* Both frames stay mounted for the whole session. The hidden one keeps
            its box (and therefore its viewport width), so switching device or
            going side-by-side never reloads or re-measures anything. */}
        <Slot show={showDesktop} box={DESKTOP_BOX} scale={scale} label={`Desktop · ${DESKTOP.w}px`}>
          <BrowserFrame route={route}>
            <iframe
              ref={desktopRef}
              title="Desktop preview"
              style={{ width: DESKTOP.w, height: DESKTOP.h, border: "none", display: "block", background: "#0d0d0e" }}
            />
          </BrowserFrame>
        </Slot>

        <Slot show={showMobile} box={MOBILE_BOX} scale={scale} label={`iPhone · ${MOBILE.w}px`}>
          <PhoneFrame>
            <iframe
              ref={mobileRef}
              title="Mobile preview"
              style={{ width: MOBILE.w, height: MOBILE.h, border: "none", display: "block", background: "#0d0d0e" }}
            />
          </PhoneFrame>
        </Slot>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * One scaled device slot.
 *
 * The outer element takes the SCALED size so the flex row lays the frames out
 * at the size they actually occupy; the inner element keeps the true pixel size
 * and is shrunk with a transform. Hiding is opacity + taking the slot out of
 * flow — not `display: none`, which would collapse the iframe to a zero-width
 * viewport and make every component inside it re-measure on the way back.
 */
function Slot({ show, box, scale, label, children }: {
  show: boolean;
  box: { w: number; h: number };
  scale: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden={!show}
      style={{
        flex: "none",
        width: box.w * scale,
        height: box.h * scale,
        ...(show ? {} : {
          position: "absolute", left: 0, top: 0, zIndex: -1,
          opacity: 0, pointerEvents: "none",
        }),
      }}
    >
      <div style={{ width: box.w, height: box.h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div className="dp-frame-label">{label}</div>
        {children}
      </div>
    </div>
  );
}

/** Desktop chrome: title bar, traffic lights, address pill. */
function BrowserFrame({ route, children }: { route: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 12, overflow: "hidden", background: "#26282f",
      border: `1px solid ${UI.line}`, boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
    }}>
      <div style={{
        height: CHROME_H, display: "flex", alignItems: "center", gap: 10, padding: "0 12px",
        background: "#2b2e36", borderBottom: `1px solid ${UI.line}`,
      }}>
        <span style={{ display: "flex", gap: 6 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <i key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "block" }} />
          ))}
        </span>
        <span style={{
          flex: 1, height: 20, borderRadius: 6, background: "#1b1d23",
          display: "flex", alignItems: "center", padding: "0 9px",
          fontFamily: MONO, fontSize: 11, color: UI.dim,
        }}>
          localhost:3000{route}
        </span>
      </div>
      {children}
    </div>
  );
}

/** Phone chrome: bezel, dynamic island, home indicator. */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "relative", padding: BEZEL, borderRadius: 54, background: "#0a0b0d",
      border: "1px solid #383c46", boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
    }}>
      <div style={{ borderRadius: 42, overflow: "hidden", position: "relative" }}>
        {children}
        {/* Dynamic island — pointer-events off so it never eats a click meant
            for the app underneath. */}
        <span style={{
          position: "absolute", top: 9, left: "50%", transform: "translateX(-50%)",
          width: 96, height: 26, borderRadius: 999, background: "#0a0b0d", pointerEvents: "none",
        }} />
        <span style={{
          position: "absolute", bottom: 7, left: "50%", transform: "translateX(-50%)",
          width: 128, height: 4.5, borderRadius: 999, background: "rgba(255,255,255,0.4)", pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}
