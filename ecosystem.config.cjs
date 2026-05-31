/**
 * PM2 Application Configuration
 * ============================================================
 * Use this configuration file to deploy and run the app with PM2.
 * Run in production using: pm2 start ecosystem.config.cjs --env production
 */

module.exports = {
  apps: [
    {
      name: 'investigate-agent',
      script: 'server.js',
      // Note: If using SQLite database, run with 1 instance (exec_mode: 'fork')
      // to avoid file write lock conflicts between clustered processes.
      // If using PostgreSQL database, you can scale to 'max' instances in 'cluster' mode.
      instances: 1, 
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
        // Note: Configure database URL, Gmail app passwords, etc. in .env file
        // or add them directly here as environment variables for production.
      }
    }
  ]
};
