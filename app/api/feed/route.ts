import { NextResponse } from "next/server";
import { getFeed } from "@/lib/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const feed = await getFeed();
  // Let Vercel's CDN serve this snapshot until it expires, so every instance/viewer
  // shares one attestation instead of each re-attesting (each costs gas + fee).
  const ttl = Math.max(5, Math.floor((feed.cachedUntil - Date.now()) / 1000));
  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=60`,
      "Access-Control-Allow-Origin": "*",
      "X-Proof-Status": feed.proofStatus,
    },
  });
}
