module.exports = {
  apps: [
    {
      name: 'ai-studio-plus',
      script: 'prod.server.mjs',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}