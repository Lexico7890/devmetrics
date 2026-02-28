import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "@/components/SidebarWrapper";
import TopBarWrapper from "@/components/TopBarWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "DevMetrics - Engineering Analytics",
  description: "A comprehensive developer productivity and engineering analytics platform featuring commit timelines, PR velocity tracking, activity heatmaps, and AI-powered repository insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <div className="flex h-screen overflow-hidden bg-background-dark text-slate-300">
          <SidebarWrapper />
          
          <div className="flex-1 flex flex-col min-w-0">
            <TopBarWrapper />
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-[1400px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
