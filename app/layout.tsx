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
  icons: {
    icon: [{ url: "/table-blue-ivory-v5.svg", type: "image/svg+xml" }, { url: "/table-blue-ivory-v5-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/table-blue-ivory-v5-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

