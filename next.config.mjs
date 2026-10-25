import fs from "node:fs";
import path from "node:path";

// scripts/attest.cjs is spawned at runtime, so Next's file tracer can't see its imports.
// Walk the full npm dependency closure of the SDK + ethers and ship all of it.
function depClosure(roots) {
  const seen = new Set();
  const stack = roots.map((n) => [n, process.cwd()]);
  while (stack.length) {
    const [name, from] = stack.pop();
    let dir = from, pkgDir = null;
    while (true) {
      const cand = path.join(dir, "node_modules", name);
      if (fs.existsSync(path.join(cand, "package.json"))) { pkgDir = cand; break; }
      const up = path.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
    if (!pkgDir || seen.has(pkgDir)) continue;
    seen.add(pkgDir);
    const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
    for (const d of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies })) stack.push([d, pkgDir]);
  }
  return [...seen].map((p) => "./" + path.relative(process.cwd(), p) + "/**/*");
}
const attestFiles = ["./scripts/attest.cjs", ...depClosure(["@primuslabs/network-core-sdk", "ethers", "ws"])];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@primuslabs/network-core-sdk", "ethers"],
    outputFileTracingIncludes: { "/api/**/*": attestFiles, "/dashboard": attestFiles },
  },
};
export default nextConfig;
