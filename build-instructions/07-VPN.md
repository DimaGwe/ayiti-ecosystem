# Ayiti VPN (Pwotek) - Build Instructions

**Phase 1: WireGuard VPN Management Platform**

## Overview
A VPN service management platform built on WireGuard. Users can earn credits through the ecosystem and spend them on VPN subscriptions. Bilingual support (English/Haitian Creole).

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** HTML/CSS/JavaScript (Vanilla)
- **Database:** MySQL (via shared config)
- **VPN:** WireGuard (via child_process)
- **Port:** 3008

## Folder Structure
```
vpn/
├── server.js
├── package.json
├── public/
│   ├── index.html           # Landing page
│   ├── admin/
│   │   └── dashboard.html   # Admin panel
│   ├── customer/
│   │   ├── dashboard.html   # User dashboard
│   │   ├── pricing.html     # Plans & pricing
│   │   └── download.html    # Config download
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── admin.js
│       └── i18n.js          # Translations
├── routes/
│   ├── clients.js           # VPN client management
│   ├── subscriptions.js     # Subscription handling
│   ├── admin.js             # Admin endpoints
│   └── wireguard.js         # WireGuard operations
├── models/
│   ├── VpnClient.js
│   ├── Subscription.js
│   └── index.js
├── utils/
│   └── wireguard.js         # WG key generation, config
├── locales/
│   ├── en.json
│   └── ht.json              # Haitian Creole
└── scripts/
    └── seed.js
```

## Database Tables

### vpn_subscriptions
```sql
CREATE TABLE vpn_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    credits_paid INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES vpn_plans(id)
);
```

### vpn_plans
```sql
CREATE TABLE vpn_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    name_ht VARCHAR(50),
    credits_monthly INT NOT NULL,
    device_limit INT NOT NULL,
    data_limit_gb INT,              -- NULL = unlimited
    features JSON,
    active BOOLEAN DEFAULT TRUE
);
```

### vpn_clients
```sql
CREATE TABLE vpn_clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    private_key TEXT NOT NULL,
    public_key TEXT NOT NULL,
    ip_address VARCHAR(15) NOT NULL UNIQUE,
    status ENUM('enabled', 'paused', 'disabled') DEFAULT 'enabled',
    last_handshake TIMESTAMP,
    bytes_received BIGINT DEFAULT 0,
    bytes_sent BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (subscription_id) REFERENCES vpn_subscriptions(id)
);
```

### vpn_usage_logs
```sql
CREATE TABLE vpn_usage_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    bytes_received BIGINT DEFAULT 0,
    bytes_sent BIGINT DEFAULT 0,
    FOREIGN KEY (client_id) REFERENCES vpn_clients(id)
);
```

## API Endpoints

### Subscriptions
- `GET /api/plans` - List all VPN plans
- `POST /api/subscribe` - Subscribe to plan (deduct credits)
- `GET /api/subscription` - User's current subscription
- `POST /api/subscription/renew` - Renew subscription
- `POST /api/subscription/cancel` - Cancel auto-renew

### VPN Clients
- `GET /api/clients` - User's VPN clients/devices
- `POST /api/clients` - Create new client (generate keys)
- `DELETE /api/clients/:id` - Remove client
- `GET /api/clients/:id/config` - Download WireGuard config
- `PUT /api/clients/:id/status` - Enable/pause/disable

### Admin
- `GET /api/admin/clients` - All clients (admin only)
- `GET /api/admin/stats` - Server stats
- `PUT /api/admin/clients/:id` - Modify any client
- `GET /api/admin/usage` - Usage analytics

### WireGuard (Internal)
- `POST /api/wg/generate-keys` - Generate keypair
- `POST /api/wg/add-peer` - Add peer to WireGuard
- `POST /api/wg/remove-peer` - Remove peer
- `GET /api/wg/status` - WireGuard interface status

## Subscription Plans

| Plan | Credits/Month | Devices | Data |
|------|---------------|---------|------|
| Free | 0 | 1 | 1 GB |
| Basic | 30 | 3 | 10 GB |
| Premium | 50 | 5 | Unlimited |
| Pro | 100 | 10 | Unlimited + Dedicated IP |

## Features (Phase 1)
1. View subscription plans with pricing
2. Subscribe using ecosystem credits
3. Generate VPN client configurations
4. Download WireGuard config files
5. Enable/pause/disable clients
6. View usage statistics
7. Admin dashboard for management
8. Bilingual UI (English/Haitian Creole)
9. Dark/Light theme toggle

## Shared Integration
```javascript
const db = require('../shared/config/database');
const User = require('../shared/models/User');
const { deductCredits, getBalance } = require('../shared/utils/credits');
const { setupAuth, isAuthenticated } = require('../shared/middleware/auth');
```

## WireGuard Utils
```javascript
// utils/wireguard.js
const { execSync } = require('child_process');

function generateKeyPair() {
    const privateKey = execSync('wg genkey').toString().trim();
    const publicKey = execSync(`echo ${privateKey} | wg pubkey`).toString().trim();
    return { privateKey, publicKey };
}

function generateConfig(client, serverConfig) {
    return `[Interface]
Address = ${client.ip_address}/32
PrivateKey = ${client.private_key}
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${serverConfig.publicKey}
Endpoint = ${serverConfig.endpoint}:${serverConfig.port}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;
}

function addPeer(publicKey, ipAddress) {
    execSync(`sudo wg set wg0 peer ${publicKey} allowed-ips ${ipAddress}/32`);
}

function removePeer(publicKey) {
    execSync(`sudo wg set wg0 peer ${publicKey} remove`);
}
```

## UI Design
- Theme: Dark default with light option (#1a1a2e, #16213e, #0f3460)
- Accent: Purple/Blue gradient (#7c3aed, #3b82f6)
- Shield/lock iconography
- Connection status indicators (green/yellow/red)
- Download buttons for configs
- Usage meters/progress bars

## Translations (locales/)
```json
// en.json
{
  "nav.home": "Home",
  "nav.pricing": "Pricing",
  "hero.title": "Secure Your Connection",
  "hero.subtitle": "Fast, private VPN powered by WireGuard",
  "plans.free": "Free",
  "plans.basic": "Basic",
  "plans.premium": "Premium",
  "btn.subscribe": "Subscribe",
  "btn.download": "Download Config"
}

// ht.json
{
  "nav.home": "Lakay",
  "nav.pricing": "Pri",
  "hero.title": "Pwoteje Koneksyon Ou",
  "hero.subtitle": "VPN rapid, prive ak WireGuard",
  "plans.free": "Gratis",
  "plans.basic": "Debaz",
  "plans.premium": "Premyòm",
  "btn.subscribe": "Abòne",
  "btn.download": "Telechaje Konfig"
}
```

## Seed Data
- 4 subscription plans
- Sample admin user
- WireGuard server config template

## Environment Variables
```env
# WireGuard Server Config
WG_SERVER_PUBLIC_KEY=your_server_public_key
WG_SERVER_ENDPOINT=your_server_ip
WG_SERVER_PORT=51820
WG_IP_RANGE=10.0.0.0/24
WG_CONFIG_PATH=/etc/wireguard/wg0.conf
```

## Notes
- WireGuard commands only work on Linux server
- For local dev (Windows), mock the WG operations
- Config generation works locally, just can't apply to real WG
- Production requires sudo access for www-data user

## Build Order
1. Create folder structure
2. Set up Express server with i18n
3. Create database models
4. Build subscription routes
5. Build client management routes
6. Build WireGuard utils (with mock for Windows)
7. Build admin routes
8. Create frontend pages
9. Add translations
10. Seed plans data
