import type { NextConfig } from "next";

function parseEnvOrigin(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function buildCspValue() {
  const connectSources = new Set<string>(["'self'"]);
  const supabaseOrigin = parseEnvOrigin("NEXT_PUBLIC_SUPABASE_URL");

  if (supabaseOrigin) {
    connectSources.add(supabaseOrigin);
    const { host, protocol } = new URL(supabaseOrigin);
    if (protocol === "https:") {
      connectSources.add(`wss://${host}`);
    }
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${Array.from(connectSources).join(" ")}`,
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

const securityHeaders = [
  // Best-effort fingerprint reduction for scanners that flag software disclosure.
  // Infrastructure (CDN/proxy/runtime) may still inject their own Server header.
  { key: "Server", value: "" },
  { key: "X-Powered-By", value: "" },
  { key: "Content-Security-Policy", value: buildCspValue() },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Referrer-Policy",
    value: "no-referrer",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
