import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Table",
  description: "Your shared household menu and grocery list.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "The Table",
    statusBarStyle: "default",
  },
  // app/apple-icon.tsx generates a fresh, cache-keyed iOS icon URL automatically.
  // Do not point iOS at the old public/apple-touch-icon.png.
  icons: { icon: "/table-favicon.svg" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
