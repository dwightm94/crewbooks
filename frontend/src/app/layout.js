import "@/styles/globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthGuard } from "@/components/layout/AuthGuard";
export const metadata = { title: "CrewBooks", description: "Track every dollar. Know who owes you.", manifest: "/manifest.json", themeColor: "#102A43" };
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head><meta name="apple-mobile-web-app-capable" content="yes" /><link rel="apple-touch-icon" href="/icons/icon-192.png" /></head>
      <body className="min-h-screen bg-navy-900">
        <AuthGuard><main className="pb-20">{children}</main><BottomNav /></AuthGuard>
      </body>
    </html>
  );
}
