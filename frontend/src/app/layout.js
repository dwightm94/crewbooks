import "@/styles/globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ThemeInit } from "@/components/layout/ThemeInit";

export const metadata = {
  title: "CrewBooks",
  description: "Track every dollar. Know who owes you.",
  manifest: "/manifest.json",
  themeColor: "#F59E0B",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen transition-colors">
        <ThemeInit />
        <AuthGuard>
          <main className="pb-20 max-w-lg mx-auto">{children}</main>
          <BottomNav />
        </AuthGuard>
      </body>
    </html>
  );
}
