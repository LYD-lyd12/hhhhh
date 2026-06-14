/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 将 /api/v1 请求代理到本地 Express 后端，
  // 使内网穿透/公网部署时前端 API 调用走同一域名
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ];
  },
}

module.exports = nextConfig