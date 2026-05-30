import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker icin kucuk, bagimsiz calisabilir cikti uretir.
  output: "standalone",
};

export default nextConfig;
