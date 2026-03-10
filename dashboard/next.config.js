/** @type {import('next').NextConfig} */
const nextConfig = {
  // ローカルの画像ファイルにアクセスするための設定
  images: {
    unoptimized: true,
  },
  // プロジェクトルートのファイルを読むためにfsが使える環境を確保
  experimental: {
    serverComponentsExternalPackages: ['fs'],
  },
}

module.exports = nextConfig
