import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RopeWallet – Secure Digital Wallet",
  description: "RopeWallet is a secure, modern digital wallet platform for managing deposits, withdrawals, and P2P transfers.",
  icons: {
    icon: [
      { url: "/ropewallet.png", type: "image/png", sizes: "512x512" },
      { url: "/ropewallet.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/ropewallet.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/ropewallet.png",
  },
  openGraph: {
    title: "RopeWallet – Secure Digital Wallet",
    description: "Manage your money securely with RopeWallet.",
    images: [{ url: "/ropewallet.png", width: 512, height: 512, alt: "RopeWallet Logo" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0B0F1A]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
