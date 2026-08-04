import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#0B0F1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ropewallet.com"),
  title: {
    default: "RopeWallet – Enterprise Digital Wallet & Settlement Platform",
    template: "%s | RopeWallet",
  },
  description:
    "RopeWallet is an ultra-secure enterprise digital wallet platform for instant deposit settlements, withdrawals, and 256-bit encrypted card payments.",
  keywords: [
    "RopeWallet",
    "digital wallet",
    "enterprise wallet",
    "payment gateway",
    "instant settlement",
    "secure wallet",
    "mobile wallet app",
    "RJN Tech",
    "crypto wallet",
    "fintech platform",
  ],
  authors: [{ name: "RopeWallet Team", url: "https://www.ropewallet.com" }],
  creator: "RJN",
  publisher: "RopeWallet Enterprise",
  category: "Finance & Fintech",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    title: "RopeWallet – Enterprise Digital Wallet & Settlement Platform",
    description:
      "Manage your money securely with RopeWallet. Ultra-fast deposit settlements, instant payment gateways, and enterprise-grade 256-bit encryption.",
    url: "https://www.ropewallet.com",
    siteName: "RopeWallet",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/ropewallet.png",
        width: 1200,
        height: 630,
        alt: "RopeWallet Enterprise Logo & Digital Wallet Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RopeWallet – Enterprise Digital Wallet & Settlement Platform",
    description:
      "Ultra-secure digital wallet platform for automated deposits, real-time balance tracking, and enterprise security.",
    images: ["/ropewallet.png"],
    creator: "@ropewallet",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.ropewallet.com/#organization",
        "name": "RopeWallet",
        "url": "https://www.ropewallet.com",
        "logo": "https://www.ropewallet.com/ropewallet.png",
        "sameAs": [
          "https://twitter.com/ropewallet"
        ],
        "description": "RopeWallet provides ultra-secure enterprise digital wallet solutions, instant payment settlement, and mobile app integration."
      },
      {
        "@type": "WebSite",
        "@id": "https://www.ropewallet.com/#website",
        "url": "https://www.ropewallet.com",
        "name": "RopeWallet",
        "publisher": {
          "@id": "https://www.ropewallet.com/#organization"
        },
        "inLanguage": "en-US"
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.ropewallet.com/#application",
        "name": "RopeWallet Mobile & Web App",
        "operatingSystem": "Android, iOS, Web",
        "applicationCategory": "FinanceApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    ]
  };

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0B0F1A]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
