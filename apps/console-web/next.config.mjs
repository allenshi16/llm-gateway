const controlPlaneUrl = process.env.CONTROL_PLANE_URL ?? "http://127.0.0.1:4100";

const nextConfig = {
  transpilePackages: ["@gateway/api-client", "@gateway/brand", "@gateway/ui"],
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/control/:path*", destination: `${controlPlaneUrl}/:path*` },
      { source: "/api/:path*", destination: `${controlPlaneUrl}/:path*` },
    ];
  },
};

export default nextConfig;
