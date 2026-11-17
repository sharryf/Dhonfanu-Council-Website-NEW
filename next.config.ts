import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Admin uploads (PDFs up to 20 MB) are posted through Server Actions.
    serverActions: { bodySizeLimit: "25mb" },
    // /admin requests pass through middleware, which buffers bodies up to this size.
    middlewareClientMaxBodySize: "25mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
