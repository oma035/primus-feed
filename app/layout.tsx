import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";

const geistSans = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-geist-sans" });
const geistMono = localFont({ src: "./fonts/GeistMonoVF.woff", variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "ProofFeed — provably real market data for AI agents",
  description: "Crypto prices attested with Primus zkTLS, served as JSON for AI agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <Nav />
        {children}
        <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-500">
          ProofFeed · zkTLS attestations by <a className="underline hover:text-zinc-300" href="https://primuslabs.xyz">Primus Network</a> · data from OKX public API · not financial advice
        </footer>
      </body>
    </html>
  );
}
