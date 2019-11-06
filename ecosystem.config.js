module.exports = {
  apps : [{
    name: 'friend_computer_twitch',
    script: 'index.js',
    cwd: '/opt/friend_computer_twitch/dist',

    // Options reference: https://doc.pm2.io/en/runtime/reference/ecosystem-file/
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    exec_mode: 'fork'
  }],
};
