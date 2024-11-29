# Deployment Guide for VPS
# Created by Chosenhack

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Nginx (for reverse proxy)
- PM2 (for process management)
- Ubuntu 20.04 or newer

## Initial Server Setup

1. Update system and install essential packages:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential postgresql nginx
```

2. Install Node.js 18:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. Install PM2 globally:
```bash
sudo npm install -g pm2
```

## Database Setup

1. Configure PostgreSQL:
```bash
sudo -u postgres psql
```

2. Create database and user:
```sql
CREATE DATABASE subscription_manager;
CREATE USER subscription_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE subscription_manager TO subscription_user;
\c subscription_manager
GRANT ALL ON ALL TABLES IN SCHEMA public TO subscription_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO subscription_user;
ALTER USER subscription_user WITH SUPERUSER;
\q
```

3. Configure PostgreSQL for remote connections (if needed):
```bash
sudo nano /etc/postgresql/12/main/postgresql.conf
```
Update:
```
listen_addresses = '*'
max_connections = 100
shared_buffers = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB
effective_cache_size = 768MB
```

4. Configure client authentication:
```bash
sudo nano /etc/postgresql/12/main/pg_hba.conf
```
Add:
```
# IPv4 local connections:
host    subscription_manager    subscription_user    127.0.0.1/32    md5
# Allow remote connections only from your application server
host    subscription_manager    subscription_user    your_app_server_ip/32    md5
```

5. Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Application Setup

1. Create application directory and set permissions:
```bash
sudo mkdir -p /var/www/subscription-manager
sudo chown -R $USER:$USER /var/www/subscription-manager
sudo chmod -R 755 /var/www/subscription-manager
```

2. Clone and setup application:
```bash
cd /var/www/subscription-manager
git clone <repository-url> .
npm ci --production
```

3. Create production environment file:
```bash
cp .env.example .env
nano .env
```

Update with production values:
```env
NODE_ENV=production
PORT=3000

# Database
DB_USER=subscription_user
DB_HOST=localhost
DB_NAME=subscription_manager
DB_PASSWORD=your_secure_password
DB_PORT=5432

# JWT
JWT_SECRET=your_secure_random_string_at_least_32_chars

# Frontend
VITE_API_URL=/api
```

4. Build the application:
```bash
npm run build
```

## Nginx Configuration

1. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/subscription-manager
```

2. Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/subscription-manager/dist;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;";

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Increase max body size for file uploads
    client_max_body_size 10M;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";
}
```

3. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/subscription-manager /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## PM2 Setup

1. Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

2. Add configuration:
```javascript
module.exports = {
  apps: [{
    name: 'subscription-manager',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/subscription-manager-error.log',
    out_file: '/var/log/pm2/subscription-manager-out.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

3. Create log directory:
```bash
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

4. Start the application:
```bash
# Run database migrations
NODE_ENV=production npm run migrate

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

## SSL Configuration (Let's Encrypt)

1. Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos --email your-email@domain.com
```

## Security Measures

1. Configure firewall:
```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

2. Set up automatic security updates:
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

3. Secure PostgreSQL:
```bash
sudo nano /etc/postgresql/12/main/postgresql.conf
```
Add:
```
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
password_encryption = scram-sha-256
```

4. Set up fail2ban:
```bash
sudo apt install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
```

## Monitoring

1. Setup PM2 monitoring:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

2. Install and configure monitoring tools:
```bash
sudo apt install -y htop iotop nethogs
```

3. Monitor application:
```bash
pm2 monit
```

4. View logs:
```bash
pm2 logs subscription-manager
```

## Backup Strategy

1. Create backup script:
```bash
sudo nano /usr/local/bin/backup-subscription-manager
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/subscription-manager"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
DB_USER="subscription_user"
DB_NAME="subscription_manager"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD="your_secure_password" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Backup application files
tar -czf "$BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz" -C /var/www subscription-manager

# Remove old backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# Check backup size
du -sh $BACKUP_DIR
```

2. Set permissions and create cron job:
```bash
sudo chmod +x /usr/local/bin/backup-subscription-manager
sudo nano /etc/cron.d/subscription-manager-backup
```

Add:
```
0 3 * * * root /usr/local/bin/backup-subscription-manager >> /var/log/subscription-manager-backup.log 2>&1
```

## Maintenance

1. Create maintenance script:
```bash
sudo nano /usr/local/bin/maintain-subscription-manager
```

Add:
```bash
#!/bin/bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Update Node.js dependencies
cd /var/www/subscription-manager
npm ci --production
npm audit fix

# Rebuild application
npm run build

# Restart services
pm2 reload all
sudo systemctl restart nginx

# Clean up
npm cache clean --force
journalctl --vacuum-time=7d
```

2. Set up weekly maintenance:
```bash
sudo chmod +x /usr/local/bin/maintain-subscription-manager
sudo nano /etc/cron.weekly/subscription-manager-maintenance
```

Add:
```bash
#!/bin/bash
/usr/local/bin/maintain-subscription-manager >> /var/log/subscription-manager-maintenance.log 2>&1
```

## Health Checks

1. Create health check script:
```bash
sudo nano /usr/local/bin/check-subscription-manager
```

Add:
```bash
#!/bin/bash
# Check Node.js application
if ! pm2 pid subscription-manager > /dev/null; then
    pm2 restart subscription-manager
    echo "Application restarted at $(date)" >> /var/log/subscription-manager-health.log
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    sudo systemctl restart nginx
    echo "Nginx restarted at $(date)" >> /var/log/subscription-manager-health.log
fi

# Check PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    sudo systemctl restart postgresql
    echo "PostgreSQL restarted at $(date)" >> /var/log/subscription-manager-health.log
fi
```

2. Set up periodic health checks:
```bash
sudo chmod +x /usr/local/bin/check-subscription-manager
sudo nano /etc/cron.d/subscription-manager-health
```

Add:
```
*/5 * * * * root /usr/local/bin/check-subscription-manager
```

## Troubleshooting

Common issues and solutions:

1. Application not starting:
```bash
# Check logs
pm2 logs subscription-manager
# Check system resources
htop
# Check disk space
df -h
```

2. Database connection issues:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-12-main.log
```

3. Nginx issues:
```bash
# Check configuration
sudo nginx -t
# Check logs
sudo tail -f /var/log/nginx/error.log
```

4. Performance issues:
```bash
# Monitor system load
top
# Monitor disk I/O
iotop
# Monitor network usage
nethogs
```