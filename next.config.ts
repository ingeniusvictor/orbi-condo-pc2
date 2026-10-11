import type { NextConfig } from "next";

const securityHeaders=[
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
 {key:"X-Frame-Options",value:"SAMEORIGIN"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"}
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
