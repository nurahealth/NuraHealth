import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppSidebar from "@/components/AppSidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "NŪRA — Your Personal Health OS",
  description: "Unfiltered AI wellness platform",
  appleWebApp: {
    capable: true,
    title: "NŪRA",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  // Matches --nura-bg for the default (dark) theme; ThemeProvider rewrites this
  // meta tag on the client whenever the theme changes.
  themeColor: "#0d0d0e",
  viewportFit: "cover",
};

// Pre-paint theme script.
//
// Runs synchronously while the <head> is being parsed — before the browser
// paints the body, and before React hydrates — so the correct palette is on
// screen from the very first frame with no flash.
//
// This is a plain inline <script>, not next/script: `strategy="beforeInteractive"`
// explicitly "does not block page hydration from occurring", which is too weak a
// guarantee for something that must land before first paint.
const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('nura-theme')==='light'){document.documentElement.setAttribute('data-theme','light')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is scoped to <html>'s own attributes (it does not
    // cascade to descendants). It is required, not a band-aid: the persisted
    // theme lives in localStorage, which the server cannot read, so the
    // pre-paint script above intentionally mutates data-theme before React
    // hydrates. Without this, React flags that deliberate difference on every
    // light-mode load. The genuine mismatches — components rendering different
    // markup from the theme store — are fixed at the source in lib/themeStore.ts.
    // (Removing this entirely would mean moving the preference to a cookie so
    // the server could render data-theme itself; that is a persistence change,
    // not a rendering fix, and is deliberately out of scope here.)
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, minHeight: "100vh" }}>
        <ThemeProvider>
          {children}
          <AppSidebar />
        </ThemeProvider>
      </body>
    </html>
  );
}
