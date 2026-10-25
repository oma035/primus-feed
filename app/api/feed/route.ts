import { NextResponse } from "next/server";
import { getFeed } from "@/lib/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const feed = await getFeed();
  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=240",
      "Access-Control-Allow-Origin": "*",
      "X-Proof-Status": feed.proofStatus,
    },
  });
}
