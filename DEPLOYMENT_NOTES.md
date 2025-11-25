# Ayiti Ecosystem - Deployment Notes

## Server Information
- **IP**: 31.97.102.196
- **SSH**: root (password in secure location)
- **Domain**: poukwapa.org
- **Process Manager**: PM2
- **Web Server**: Nginx with SSL (Let's Encrypt/Certbot)

## Deployed Apps

| App | Port | Subdomain | PM2 Name |
|-----|------|-----------|----------|
| VPN | 3008 | vpn.poukwapa.org | ayiti-vpn |
| Trivia | 3002 | trivia.poukwapa.org | ayiti-trivia |
| Academy | 3001 | academy.poukwapa.org | ayiti-academy |
| Home | 3000 | poukwapa.org | (not deployed) |

---

## Common Issues & Solutions

### 1. Google OAuth "Unknown authentication strategy" Error

**Symptom**: Error when clicking "Login with Google"

**Cause**: Different `passport` instances being used. When `require('passport')` is called from different locations, Node.js module resolution can load different copies.

**Solution**:
1. Require passport at the TOP of the main server.js file
2. Pass the passport instance explicitly to `setupAuth()`

```javascript
// At top of server.js
const passport = require('passport');

// When setting up auth
setupAuth(app, passport, { callbackURL: '...' });
```

### 2. Google OAuth Callback Not Working (Page Just Refreshes)

**Symptom**: User clicks login, goes to Google, comes back, but stays logged out. Page just refreshes.

**Cause**: The callback URL is NOT registered in Google Cloud Console.

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add the callback URL under **Authorized redirect URIs**:
   ```
   https://[subdomain].poukwapa.org/auth/google/callback
   ```
5. Also add the origin under **Authorized JavaScript origins**:
   ```
   https://[subdomain].poukwapa.org
   ```

**Note**: Changes may take 5 minutes to a few hours to propagate.

### 3. Session Not Persisting Behind Nginx Proxy

**Symptom**: User logs in successfully but session is lost on redirect.

**Cause**: Secure cookies require proper proxy trust settings.

### 3b. Session Not Persisting - Nginx Headers Corrupted

**Symptom**: OAuth callback succeeds (logs show user email) but `/api/user` returns `user: null`. Each request has a different session ID.

**Cause**: Nginx proxy headers were corrupted - `$scheme`, `$host`, `$remote_addr` variables replaced with backticks (`` ` ``). This breaks `X-Forwarded-Proto` which is essential for secure cookies.

**How to diagnose**:
```bash
# Check nginx config for corrupted variables
cat /etc/nginx/sites-available/[app].poukwapa.org | grep proxy_set_header
```

If you see:
```nginx
proxy_set_header X-Forwarded-Proto `;  # WRONG!
```

Instead of:
```nginx
proxy_set_header X-Forwarded-Proto $scheme;  # CORRECT
```

**Solution**: Rewrite the nginx config with proper variables:
```bash
cat > /etc/nginx/sites-available/[app].poukwapa.org << 'NGINX'
server {
    server_name [app].poukwapa.org;
    location / {
        proxy_pass http://localhost:[PORT];
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/[app].poukwapa.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/[app].poukwapa.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
server {
    if ($host = [app].poukwapa.org) { return 301 https://$host$request_uri; }
    listen 80;
    server_name [app].poukwapa.org;
    return 404;
}
NGINX

nginx -t && systemctl reload nginx
```

**Important**: Use `<< 'NGINX'` (quoted heredoc) to prevent shell variable expansion when writing the config.

**Solution**: Add these settings to server.js:

```javascript
const app = express();

// Trust proxy for secure cookies behind Nginx
app.set('trust proxy', 1);

// Session configuration
app.use(session({
  name: 'appname.sid',  // Unique session name per app!
  secret: process.env.SESSION_SECRET || 'your-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true,  // Trust the reverse proxy
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    sameSite: 'lax'  // Allows OAuth redirects
  }
}));
```

**Important**: Give each app a unique session name (e.g., `trivia.sid`, `vpn.sid`) to avoid cookie conflicts between subdomains.

### 4. Port Already in Use (EADDRINUSE)

**Symptom**: PM2 shows app crashing with `Error: listen EADDRINUSE`

**Solution**:
```bash
# Kill the process using the port
fuser -k 3002/tcp

# Then restart with PM2
pm2 restart app-name
```

### 5. Nginx Configuration for New Subdomain

**Template** for `/etc/nginx/sites-available/[app]-poukwapa`:

```nginx
server {
    server_name [app].poukwapa.org;

    location / {
        proxy_pass http://127.0.0.1:[PORT];
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 80;
}
```

**Setup commands**:
```bash
# Create symlink
ln -s /etc/nginx/sites-available/[app]-poukwapa /etc/nginx/sites-enabled/

# Test config
nginx -t

# Reload nginx
systemctl reload nginx

# Get SSL certificate
certbot --nginx -d [app].poukwapa.org
```

### 6. DNS Setup for New Subdomain

Add an A record in your DNS provider (Hostinger):
- **Type**: A
- **Name**: [subdomain] (e.g., `trivia`)
- **Value**: 31.97.102.196
- **TTL**: 14400 (or auto)

DNS propagation can take up to 24 hours but usually works within minutes.

---

## Deployment Checklist for New Apps

1. [ ] **DNS**: Add A record for subdomain pointing to server IP
2. [ ] **Upload code**: `scp -r app/ root@31.97.102.196:/var/www/ayiti-ecosystem/`
3. [ ] **Install dependencies**: `cd /var/www/ayiti-ecosystem/[app] && npm install`
4. [ ] **Update server.js**:
   - Add `app.set('trust proxy', 1)`
   - Set unique session name
   - Configure proper callback URL for OAuth
5. [ ] **Google Cloud Console**: Add callback URL and origin for new subdomain
6. [ ] **Nginx**: Create config and enable site
7. [ ] **SSL**: Run certbot for the new subdomain
8. [ ] **PM2**: Start the app with `pm2 start server.js --name [app-name]`
9. [ ] **Test**: Verify health endpoint and OAuth login

---

## Useful Commands

```bash
# Check PM2 status
pm2 status

# View app logs
pm2 logs [app-name] --lines 50

# Restart app
pm2 restart [app-name]

# Flush logs
pm2 flush [app-name]

# Check nginx status
systemctl status nginx

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx

# Check SSL certificate
certbot certificates

# Renew SSL certificates
certbot renew --dry-run
```

---

## Environment Variables (.env)

Located at `/var/www/ayiti-ecosystem/.env` (shared by all apps):

```
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ayiti_ecosystem

# Google OAuth
GOOGLE_CLIENT_ID=666836475202-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=https://vpn.poukwapa.org/auth/google/callback

# Session
SESSION_SECRET=your-secret-here

# Environment
NODE_ENV=production

# App-specific ports
VPN_PORT=3008
TRIVIA_PORT=3002
ACADEMY_PORT=3001
HOME_PORT=3000
```

**Note**: Each app can override the `GOOGLE_CALLBACK_URL` by passing it directly to `setupAuth()`.

---

## Admin Dashboard

- **URL**: https://vpn.poukwapa.org/admin
- **Credentials**: admin / Admin2024
- **Features**: Users management, VPN clients, subscriptions, usage analytics, plans
