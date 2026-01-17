// PM2 Ecosystem Configuration
// Using .cjs extension for CommonJS in ES Module project

module.exports = {
    apps: [
        {
            name: 'shaadi-api',
            script: 'server.js',
            instances: 'max', // Use all CPU cores
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                PORT: 8080,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 8080,
            },
            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
            // Logging
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: '/var/log/pm2/shaadi-api-error.log',
            out_file: '/var/log/pm2/shaadi-api-out.log',
            merge_logs: true,
            // Restart policy
            exp_backoff_restart_delay: 100,
            max_restarts: 10,
        },
    ],
};
