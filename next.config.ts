import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["officeparser", "pdfjs-dist"],
};

export default nextConfig;
