import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppSidebar from "@/components/AppSidebar";

export const metadata: Metadata = {
  title: "NŪRA — Your Personal Health OS",
  description: "Unfiltered AI wellness platform",
};

// Pre-hydration script — sets data-theme before React renders to prevent FOUC.
const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem('nura-theme');
  if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
} catch(e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
