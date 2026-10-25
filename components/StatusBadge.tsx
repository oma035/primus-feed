import type { ProofStatus } from "@/lib/feed";
const MAP: Record<ProofStatus, { label: string; cls: string; dot: string }> = {
  verified: { label: "zkTLS verified", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-400" },
  "unverified-demo": { label: "unverified – demo", cls: "border-amber-400/30 bg-amber-400/10 text-amber-300", dot: "bg-amber-400" },
  failed: { label: "attestation failed", cls: "border-rose-400/30 bg-rose-400/10 text-rose-300", dot: "bg-rose-400" },
};
export default function StatusBadge({ status }: { status: ProofStatus }) {
  const m = MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot} ${status === "verified" ? "animate-pulse" : ""}`} />
      {m.label}
    </span>
  );
}
