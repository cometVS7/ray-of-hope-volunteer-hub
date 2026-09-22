import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'child_process';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Resilient Database URL Resolver for Neon PostgreSQL.
 * If local network DNS (e.g. university or institutional Wi-Fi) refuses resolution
 * for AWS Neon subdomains, this falls back to public DNS (8.8.8.8 / 1.1.1.1) and passes
 * the project endpoint identifier seamlessly.
 */
function resolveDatabaseUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.includes('neon.tech')) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname;
    const match = hostname.match(/^(ep-[a-z0-9-]+?)(?:-pooler)?\./);
    const endpointId = match ? match[1] : undefined;

    let failed = false;
    try {
      execFileSync('ping', ['-n', '1', '-w', '500', hostname], { stdio: 'ignore' });
    } catch {
      failed = true;
    }

    if (failed && endpointId) {
      const script = `const { Resolver } = require('dns'); const r = new Resolver(); r.setServers(['8.8.8.8', '1.1.1.1']); r.resolve4('${hostname}', (err, addrs) => { if (!err && addrs && addrs[0]) process.stdout.write(addrs[0]); });`;
      const ip = execFileSync(process.execPath, ['-e', script], { encoding: 'utf-8' }).trim();
      if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        parsed.hostname = ip;
        parsed.searchParams.delete('channel_binding');
        parsed.searchParams.set('options', `project=${endpointId}`);
        return parsed.toString();
      }
    }
  } catch {
    // Graceful fallback to rawUrl
  }

  return rawUrl;
}

const activeDatabaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL || '');

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
