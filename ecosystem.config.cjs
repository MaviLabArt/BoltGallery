module.exports = {
  apps: [
    {
      name: "bolt-gallery",
      cwd: "./server",
      script: "index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
