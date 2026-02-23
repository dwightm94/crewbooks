import "@/styles/globals.css";
import { Providers } from "@/components/Providers";
export const metadata = { title: "CrewBooks", description: "Track every dollar. Know who owes you.", manifest: "/manifest.json", themeColor: "#F59E0B" };
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" /></head>
      <body className="min-h-screen"><Providers>{children}</Providers></body>
    </html>
  );
}
