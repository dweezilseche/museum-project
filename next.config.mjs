/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  // Keep libSQL (and its optional native binding) out of the bundle so it is
  // required at runtime instead of being traced/bundled by Turbopack.
  serverExternalPackages: ["@libsql/client", "libsql"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;
