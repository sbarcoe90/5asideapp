import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "5-a-side Picker & Team Generator | Football Team Picker & Payment Tracker",
  description: "The easiest 5-a-side team picker and payment tracker. Instantly generate random football teams, track payments, and share teams for WhatsApp. Perfect for casual games, futsal, and more!",
  keywords: [
    "5 a side picker",
    "team picker",
    "football team generator",
    "random team picker",
    "futsal team picker",
    "soccer team picker",
    "team randomizer",
    "payment tracker",
    "whatsapp team picker",
    "casual football app"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* SEO Meta Tags */}
        <title>5-a-side Picker & Team Generator | Football Team Picker & Payment Tracker</title>
        <meta name="description" content="The easiest 5-a-side team picker and payment tracker. Instantly generate random football teams, track payments, and share teams for WhatsApp. Perfect for casual games, futsal, and more!" />
        <meta name="keywords" content="5 a side picker, team picker, football team generator, random team picker, futsal team picker, soccer team picker, team randomizer, payment tracker, whatsapp team picker, casual football app" />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GKRZJEBZTM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GKRZJEBZTM');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
