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
    icon: "/table-favicon.svg",
    // An opaque 180x180 PNG adapted from the uploaded The Table icon.
    // The unique path prevents iOS from retaining its older distorted icon.
    apple: [{ url: "/table-apple-home-v3.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
