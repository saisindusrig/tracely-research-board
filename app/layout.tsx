import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Kalam, Newsreader } from "next/font/google";
import Toaster from "@/components/Toaster";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
});

const newsreader = Newsreader({
  weight: ["400", "500", "600"],
  style: ["normal"],
  subsets: ["latin"],
  variable: "--font-newsreader",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
});

// Handwriting, used only for margin notes and annotations.
const kalam = Kalam({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-kalam",
});

export const metadata: Metadata = {
  title: {
    template: "%s · Warrant",
    default: "Warrant: a research notebook for claims and evidence",
  },
  description:
    "Warrant is a visual research notebook. Pin claims, sources and notes to one page, draw the lines between them, and see what the evidence actually says.",
  applicationName: "Warrant",
};

export const viewport: Viewport = {
  themeColor: "#f4efe3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plexSans.variable} ${newsreader.variable} ${plexMono.variable} ${kalam.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
