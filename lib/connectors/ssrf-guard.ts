import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// Blocks a connector from being pointed at internal/infra addresses —
// localhost, private/link-local ranges, and (by extension) Supabase's own
// infrastructure, which lives in the same private address space. Checked
// both on the literal host and on whatever it resolves to, since a
// hostname can point at a private IP just as easily as a literal one.

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain']);

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true; // malformed -> reject

  const [a, b] = parts;

  if (a === 127) return true; // loopback
  if (a === 10) return true; // RFC1918
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 0) return true; // "this network"
  if (a >= 224) return true; // multicast/reserved

  return false;
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::1') return true; // loopback
  if (normalized.startsWith('fe80:')) return true; // link-local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
  if (normalized.startsWith('::ffff:')) {
    // IPv4-mapped address — check the embedded IPv4 part too.
    const mapped = normalized.split(':').pop();
    if (mapped && isIP(mapped) === 4) return isPrivateOrReservedIpv4(mapped);
  }
  return false;
}

export class SsrfGuardError extends Error {}

export async function assertHostIsAllowed(host: string): Promise<void> {
  const lowerHost = host.toLowerCase().trim();

  if (BLOCKED_HOSTNAMES.has(lowerHost)) {
    throw new SsrfGuardError('This host can’t be reached.');
  }

  const ipVersion = isIP(lowerHost);
  if (ipVersion === 4 && isPrivateOrReservedIpv4(lowerHost)) {
    throw new SsrfGuardError('This host can’t be reached.');
  }
  if (ipVersion === 6 && isPrivateOrReservedIpv6(lowerHost)) {
    throw new SsrfGuardError('This host can’t be reached.');
  }

  if (ipVersion === 0) {
    // Hostname, not a literal IP — resolve and check every address it
    // could land on, since DNS can return multiple/rotating records.
    let resolved: { address: string; family: number }[];
    try {
      resolved = await lookup(lowerHost, { all: true });
    } catch {
      throw new SsrfGuardError('This host can’t be reached.');
    }

    for (const { address, family } of resolved) {
      if (family === 4 && isPrivateOrReservedIpv4(address)) {
        throw new SsrfGuardError('This host can’t be reached.');
      }
      if (family === 6 && isPrivateOrReservedIpv6(address)) {
        throw new SsrfGuardError('This host can’t be reached.');
      }
    }
  }
}
