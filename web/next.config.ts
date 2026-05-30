import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 단일 이미지 배포용 — .next/standalone 출력
  output: "standalone",
};

export default nextConfig;
