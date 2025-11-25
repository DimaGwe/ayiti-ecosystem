/**
 * Sync WireGuard Statistics to Database
 * Run via cron: every 5 minutes
 * Example: crontab -e, add: 0,5,10,15,20,25,30,35,40,45,50,55 * * * * node /var/www/ayiti-ecosystem/vpn/scripts/sync-stats.js
 *
 * This script:
 * 1. Fetches current stats from WireGuard
 * 2. Updates VpnClient records with current bandwidth/handshake
 * 3. Creates VpnUsageLog entries for tracking
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { execSync } = require('child_process');
const sequelize = require('../../shared/config/database');
const { VpnClient, VpnUsageLog } = require('../models');

/**
 * Parse WireGuard dump output
 * Format: publicKey\tpresharedKey\tendpoint\tallowedIPs\tlastHandshake\tbytesReceived\tbytesSent\tpersistentKeepalive
 */
function parseWgDump() {
  try {
    const output = execSync('sudo wg show wg0 dump', { encoding: 'utf8' });
    const lines = output.trim().split('\n');

    // Skip first line (server info)
    const peers = {};
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      if (parts.length >= 7) {
        const publicKey = parts[0];
        peers[publicKey] = {
          endpoint: parts[2] !== '(none)' ? parts[2] : null,
          allowedIPs: parts[3],
          lastHandshake: parts[4] !== '0' ? new Date(parseInt(parts[4], 10) * 1000) : null,
          bytesReceived: parseInt(parts[5], 10) || 0,
          bytesSent: parseInt(parts[6], 10) || 0
        };
      }
    }

    return peers;
  } catch (error) {
    console.error('Failed to get WireGuard stats:', error.message);
    return {};
  }
}

/**
 * Sync stats for all clients
 */
async function syncStats() {
  console.log(`[${new Date().toISOString()}] Starting stats sync...`);

  try {
    // Get all clients from database
    const clients = await VpnClient.findAll({
      where: { status: 'enabled' }
    });

    if (clients.length === 0) {
      console.log('No enabled clients found');
      return;
    }

    // Get current WireGuard stats
    const wgPeers = parseWgDump();

    let updated = 0;
    let logsCreated = 0;

    for (const client of clients) {
      const peerStats = wgPeers[client.publicKey];

      if (!peerStats) {
        console.log(`  Peer not found in WireGuard: ${client.name} (${client.publicKey.substring(0, 20)}...)`);
        continue;
      }

      // Calculate delta since last sync
      const bytesReceivedDelta = peerStats.bytesReceived - (client.bytesReceived || 0);
      const bytesSentDelta = peerStats.bytesSent - (client.bytesSent || 0);

      // Only update if there's activity
      const hasActivity = bytesReceivedDelta > 0 || bytesSentDelta > 0 || peerStats.lastHandshake;

      if (hasActivity) {
        // Update client record with cumulative stats
        client.bytesReceived = peerStats.bytesReceived;
        client.bytesSent = peerStats.bytesSent;

        if (peerStats.lastHandshake) {
          client.lastHandshake = peerStats.lastHandshake;
        }

        await client.save();
        updated++;

        // Create usage log if there's meaningful activity (> 1KB)
        if (bytesReceivedDelta > 1024 || bytesSentDelta > 1024) {
          await VpnUsageLog.create({
            clientId: client.id,
            sessionStart: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago (sync interval)
            sessionEnd: new Date(),
            bytesReceived: bytesReceivedDelta > 0 ? bytesReceivedDelta : 0,
            bytesSent: bytesSentDelta > 0 ? bytesSentDelta : 0
          });
          logsCreated++;
        }

        console.log(`  Updated: ${client.name} - ↓${formatBytes(peerStats.bytesReceived)} ↑${formatBytes(peerStats.bytesSent)}`);
      }
    }

    console.log(`[${new Date().toISOString()}] Sync complete: ${updated} clients updated, ${logsCreated} logs created`);

  } catch (error) {
    console.error('Sync error:', error);
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run sync
syncStats()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
