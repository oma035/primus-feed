"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
export default function AutoRefresh({ generatedAt }: { generatedAt: number }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    const r = setInterval(() => router.refresh(), 30000);
    return () => { clearInterval(t); clearInterval(r); };
  }, [router]);
  const age = now == null ? null : Math.max(0, Math.round((now - generatedAt) / 1000));
  return (
    <button onClick={() => router.refresh()} className="rounded-full border border-white/10 px-2.5 py-0.5 text-zinc-400 hover:text-white">
      {age == null ? "snapshot" : `snapshot ${age}s ago`} · refresh
    </button>
  );
}
