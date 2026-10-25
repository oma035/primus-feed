/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@primuslabs/network-core-sdk", "ethers"],
    outputFileTracingIncludes: {
      "/api/**/*": ["./scripts/attest.cjs", "./node_modules/@primuslabs/network-core-sdk/**/*", "./node_modules/ethers/**/*", "./node_modules/ws/**/*"],
      "/dashboard": ["./scripts/attest.cjs", "./node_modules/@primuslabs/network-core-sdk/**/*", "./node_modules/ethers/**/*", "./node_modules/ws/**/*"],
    },
  },
};
export default nextConfig;
