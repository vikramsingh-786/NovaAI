import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { clerkAppearance } from "./clerk-theme";
import CustomToast from "./CustomToast";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NovaAI Platform",
  description: "Advanced AI Assistant",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  other: {
    "msapplication-TileColor": "#603cba",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <ThemeProvider>
            <SubscriptionProvider>
              <ChatProvider>
                {children}
                <CustomToast />
              </ChatProvider>
            </SubscriptionProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
