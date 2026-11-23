import type { NextConfig } from "next";

const config: NextConfig = {
  async redirects() {
    return [{
      source: "/:path*",
      destination: "https://globe-bridge-offer-desk.mohamedaloui01984.chatgpt.site/:path*",
      permanent: false,
    }];
  },
};

export default config;
