import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Table",
  description: "Plan meals and keep a grocery list in one place.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "The Table",
    statusBarStyle: "default",
  },
  icons:{icon:[{url:'/table-home-palette-v6.ico'},{url:'/table-home-palette-v6-32.png',sizes:'32x32',type:'image/png'}],apple:[{url:'/table-home-palette-v6-180.png',sizes:'180x180',type:'image/png'}]},
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

