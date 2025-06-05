// app/layout.tsx
import { type Metadata, type Viewport } from "next"; // Import Viewport
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { clerkAppearance } from "./clerk-theme";
import CustomToast from "./CustomToast";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";
// Import the client wrapper
import { SubscriptionProviderClientWrapper } from "./context/SubscriptionProviderClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: 'NovaAI Platform',
  description: 'Advanced AI Assistant',
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: '/site.webmanifest',
  other: {
    "msapplication-TileColor": "#603cba", // Example, adjust to your theme
  }
};

// Added Viewport export for themeColor
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' }, // Your light theme color
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },  // Your dark theme color
  ],
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
            {/* Use the client wrapper here */}
            <SubscriptionProviderClientWrapper>
              <ChatProvider>
                {children}
                <CustomToast />
              </ChatProvider>
            </SubscriptionProviderClientWrapper>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}