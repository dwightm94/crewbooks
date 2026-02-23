"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const r = useRouter();
  useEffect(() => {
    const tokens = localStorage.getItem("crewbooks_tokens");
    if (tokens) { r.replace("/dashboard"); }
    else { window.location.href = "/landing.html"; }
  }, [r]);
  return null;
}
