import "@/styles/globals.css";
export const metadata = { title: "CrewBooks", description: "Track every dollar. Know who owes you.", manifest: "/manifest.json", themeColor: "#F59E0B" };
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><meta name="mobile-web-app-capable" content="yes" /><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" /></head>
      <body className="min-h-screen">
        {process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.includes('/staging') && (
          <div style={{background:'#EF4444',color:'#fff',textAlign:'center',padding:'4px 0',fontSize:'13px',fontWeight:'700',letterSpacing:'1px',position:'fixed',top:0,left:0,right:0,zIndex:9999}}>
            ⚠️ TEST ENVIRONMENT ⚠️
          </div>
        )}
        {process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.includes('/staging') && (
          <div style={{height:'28px'}} />
        )}
        {children}
      </body>
    </html>
  );
}
