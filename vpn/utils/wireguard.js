/**
 * WireGuard Utilities
 * Key generation, config creation, and peer management
 *
 * Note: WireGuard commands only work on Linux with WireGuard installed
 * For local development, mock operations are used
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');

// Server configuration (from environment)
const serverConfig = {
  publicKey: process.env.WG_SERVER_PUBLIC_KEY || 'mock_server_public_key_replace_in_production',
  endpoint: process.env.WG_SERVER_ENDPOINT || 'vpn.ayiti.com',
  port: process.env.WG_SERVER_PORT || 51820,
  ipRange: process.env.WG_IP_RANGE || '10.0.0.0/24',
  configPath: process.env.WG_CONFIG_PATH || '/etc/wireguard/wg0.conf'
};

// Track allocated IPs (in production, query from database)
let nextIpOctet = 2;  // Start from 10.0.0.2 (10.0.0.1 is server)

/**
 * Check if WireGuard is available on the system
 */
const isWireGuardAvailable = () => {
  if (os.platform() !== 'linux') {
    return false;
  }
  try {
    execSync('which wg', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

const wgAvailable = isWireGuardAvailable();
console.log(`[WireGuard] ${wgAvailable ? 'Available' : 'Not available - using mock mode'}`);

/**
 * Generate a WireGuard keypair
 * Uses real wg command on Linux, crypto mock otherwise
 */
const generateKeyPair = () => {
  if (wgAvailable) {
    try {
      const privateKey = execSync('wg genkey', { encoding: 'utf8' }).trim();
      const publicKey = execSync(`echo "${privateKey}" | wg pubkey`, {
        encoding: 'utf8',
        shell: '/bin/bash'
      }).trim();
      return { privateKey, publicKey };
    } catch (error) {
      console.error('[WireGuard] Key generation failed:', error.message);
      // Fall through to mock
    }
  }

  // Mock key generation for development
  const privateKey = crypto.randomBytes(32).toString('base64');
  const publicKey = crypto.createHash('sha256')
    .update(privateKey)
    .digest('base64');

  return { privateKey, publicKey };
};

/**
 * Allocate next available IP address
 * In production, this should query the database for used IPs
 */
const allocateIpAddress = async (VpnClient) => {
  // Get the highest used IP from database
  const lastClient = await VpnClient.findOne({
    order: [['ipAddress', 'DESC']]
  });

  if (lastClient) {
    const parts = lastClient.ipAddress.split('.');
    const lastOctet = parseInt(parts[3], 10);
    nextIpOctet = lastOctet + 1;
  }

  if (nextIpOctet > 254) {
    throw new Error('IP address pool exhausted');
  }

  const ip = `10.0.0.${nextIpOctet}`;
  nextIpOctet++;
  return ip;
};

/**
 * Generate WireGuard client configuration file content
 */
const generateConfig = (client) => {
  return `[Interface]
Address = ${client.ipAddress}/32
PrivateKey = ${client.privateKey}
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${serverConfig.publicKey}
Endpoint = ${serverConfig.endpoint}:${serverConfig.port}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;
};

/**
 * Add peer to WireGuard server
 */
const addPeer = (publicKey, ipAddress) => {
  if (!wgAvailable) {
    console.log(`[WireGuard Mock] Adding peer: ${publicKey.substring(0, 20)}... with IP ${ipAddress}`);
    return { success: true, mock: true };
  }

  try {
    execSync(`sudo wg set wg0 peer ${publicKey} allowed-ips ${ipAddress}/32`, {
      encoding: 'utf8'
    });
    console.log(`[WireGuard] Added peer: ${publicKey.substring(0, 20)}...`);
    return { success: true, mock: false };
  } catch (error) {
    console.error('[WireGuard] Failed to add peer:', error.message);
    throw new Error('Failed to add peer to WireGuard');
  }
};

/**
 * Remove peer from WireGuard server
 */
const removePeer = (publicKey) => {
  if (!wgAvailable) {
    console.log(`[WireGuard Mock] Removing peer: ${publicKey.substring(0, 20)}...`);
    return { success: true, mock: true };
  }

  try {
    execSync(`sudo wg set wg0 peer ${publicKey} remove`, {
      encoding: 'utf8'
    });
    console.log(`[WireGuard] Removed peer: ${publicKey.substring(0, 20)}...`);
    return { success: true, mock: false };
  } catch (error) {
    console.error('[WireGuard] Failed to remove peer:', error.message);
    throw new Error('Failed to remove peer from WireGuard');
  }
};

/**
 * Get WireGuard interface status
 */
const getStatus = () => {
  if (!wgAvailable) {
    return {
      success: true,
      mock: true,
      interface: 'wg0',
      publicKey: serverConfig.publicKey,
      listenPort: serverConfig.port,
      peers: []
    };
  }

  try {
    const output = execSync('sudo wg show wg0', { encoding: 'utf8' });
    return {
      success: true,
      mock: false,
      raw: output
    };
  } catch (error) {
    console.error('[WireGuard] Failed to get status:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get peer statistics (bytes transferred, last handshake)
 */
const getPeerStats = (publicKey) => {
  if (!wgAvailable) {
    // Return mock stats
    return {
      success: true,
      mock: true,
      bytesReceived: Math.floor(Math.random() * 1000000000),
      bytesSent: Math.floor(Math.random() * 500000000),
      lastHandshake: new Date(Date.now() - Math.random() * 3600000)
    };
  }

  try {
    const output = execSync(`sudo wg show wg0 dump | grep ${publicKey}`, {
      encoding: 'utf8',
      shell: '/bin/bash'
    });
    const parts = output.trim().split('\t');
    return {
      success: true,
      mock: false,
      bytesReceived: parseInt(parts[5], 10) || 0,
      bytesSent: parseInt(parts[6], 10) || 0,
      lastHandshake: parts[4] !== '0' ? new Date(parseInt(parts[4], 10) * 1000) : null
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Format bytes to human readable
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  serverConfig,
  isWireGuardAvailable: () => wgAvailable,
  generateKeyPair,
  allocateIpAddress,
  generateConfig,
  addPeer,
  removePeer,
  getStatus,
  getPeerStats,
  formatBytes
};
