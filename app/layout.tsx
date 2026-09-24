import type { Metadata } from "next";
import { Inter, Libre_Baskerville, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

// 1. Configure the Google Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const libreBaskerville = Libre_Baskerville({ 
  weight: ["400", "700"], 
  subsets: ["latin"], 
  variable: "--font-heading" 
});

const shareTechMono = Share_Tech_Mono({ 
  weight: "400", 
  subsets: ["latin"], 
  variable: "--font-tag" 
});

export const metadata: Metadata = {
  title: "TracelyResearchBoard",
  description: "Collaborative research and evidence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 2. Inject the font variables into the app body */}
      <body className={`${inter.variable} ${libreBaskerville.variable} ${shareTechMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}