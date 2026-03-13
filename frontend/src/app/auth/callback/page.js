"use client";
import { useEffect } from "react";

export default function CallbackPage() {
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        window.location.href = "/auth/login";
        return;
      }

      try {
        const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
        const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
        const redirectUri = "https://crewbooksapp.com/auth/callback";

        const res = await fetch(`${domain}/oauth2/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            redirect_uri: redirectUri,
            code,
          }),
        });

        const tokens = await res.json();

        if (tokens.access_token) {
          localStorage.setItem("accessToken", tokens.access_token);
          localStorage.setItem("idToken", tokens.id_token);
          localStorage.setItem("refreshToken", tokens.refresh_token);
          window.location.href = "/dashboard";
        } else {
          console.error("Token exchange failed", tokens);
          window.location.href = "/auth/login";
        }
      } catch (e) {
        console.error("Callback error", e);
        window.location.href = "/auth/login";
      }
    };

    run();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #F59E0B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontSize: 14, color: "#717190" }}>Signing you in...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
