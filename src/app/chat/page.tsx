"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The session-less /chat route just bounces you back to the composer on /.
export default function ChatIndex() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return <div style={{ minHeight: "100dvh", background: "#0d0d0e" }} />;
}
