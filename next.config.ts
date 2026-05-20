import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent the page from being embedded in iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information sent with requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by this app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Force HTTPS in production (ignored over HTTP in dev)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,

  async headers() {
    return [
      // Security headers on all pages
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // CORS on API routes — credentials require an explicit origin, not wildcard
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // Wildcard + credentials is a security misconfiguration.
            // In production, replace with your actual domain via ALLOWED_ORIGINS env var.
            value: process.env.ALLOWED_ORIGINS?.split(",")[0] ?? "http://localhost:3000",
          },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
