import type { Metadata } from "next";
import "./globals.css";
import "./clean-app.css";
import "./polish.css";
import {Appearance} from "@/components/appearance";

export const metadata: Metadata = {
  title: "The Table",
  description: "Your shared household menu and grocery list.",
  manifest: "/table/app/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "The Table",
    statusBarStyle: "default",
  },
  icons:{icon:[{url:'/table/app/table-home-palette-v6.ico'},{url:'/table/app/table-home-palette-v6-32.png',sizes:'32x32',type:'image/png'}],apple:[{url:'/table/app/table-home-palette-v6-180.png',sizes:'180x180',type:'image/png'}]},
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Appearance>{children}</Appearance></body></html>;
}

