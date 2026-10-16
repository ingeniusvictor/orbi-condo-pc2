import type { NextConfig } from "next";

// Structural CSP directives only. We intentionally do not declare script-src,
// style-src or default-src in this cut because Next.js App Router emits inline
// bootstrap/style content that requires a nonce/hash design before enforcement.
const structuralContentSecurityPolicy="base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'";

const securityHeaders=[
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
 {key:"X-Frame-Options",value:"SAMEORIGIN"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
 {key:"Content-Security-Policy",value:structuralContentSecurityPolicy}
];

const privateApiHeaders=[
 {key:"Cache-Control",value:"private, no-store"},
];

const nextConfig:NextConfig={
 reactStrictMode:true,
 poweredByHeader:false,
 async headers(){
  return [
   {source:"/(.*)",headers:securityHeaders},
   {source:"/api/auth/:path*",headers:privateApiHeaders},
   {source:"/api/operations/:path*",headers:privateApiHeaders},
  ];
 }
};

export default nextConfig;
