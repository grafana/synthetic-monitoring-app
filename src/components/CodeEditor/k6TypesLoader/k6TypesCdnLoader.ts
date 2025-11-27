interface K6ModuleDefinition {
  name: string;
  path: string;
}
const K6_MODULES: K6ModuleDefinition[] = [
  { name: 'k6', path: 'index.d.ts' },
  { name: 'k6/options', path: 'options/index.d.ts' },
  { name: 'k6/ws', path: 'ws/index.d.ts' },
  { name: 'k6/http', path: 'http/index.d.ts' },
  { name: 'k6/net/grpc', path: 'net/grpc/index.d.ts' },
  { name: 'k6/html', path: 'html/index.d.ts' },
  { name: 'k6/metrics', path: 'metrics/index.d.ts' },
  { name: 'k6/timers', path: 'timers/index.d.ts' },
  { name: 'k6/execution', path: 'execution/index.d.ts' },
  { name: 'k6/encoding', path: 'encoding/index.d.ts' },
  { name: 'k6/data', path: 'data/index.d.ts' },
  { name: 'k6/crypto', path: 'crypto/index.d.ts' },
  { name: 'k6/browser', path: 'browser/index.d.ts' },
  { name: 'k6/experimental/csv', path: 'experimental/csv/index.d.ts' },
  { name: 'k6/experimental/fs', path: 'experimental/fs/index.d.ts' },
  { name: 'k6/experimental/redis', path: 'experimental/redis/index.d.ts' },
  { name: 'k6/experimental/streams', path: 'experimental/streams/index.d.ts' },
  { name: 'k6/experimental/websockets', path: 'experimental/websockets/index.d.ts' },
];

const CDN_BASE_URL = 'https://unpkg.com/@types/k6';

export async function fetchK6TypesFromCDN(channelId: string): Promise<Record<string, string>> {
  const types: Record<string, string> = {};
  const failedModules: string[] = [];

  const fetchPromises = K6_MODULES.map(async (module) => {
    try {
      const url = `${CDN_BASE_URL}@${channelId}/${module.path}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        failedModules.push(module.name);
        return;
      }
      
      const content = await response.text();
      types[module.name] = content;
    } catch (error) {
      failedModules.push(module.name);
    }
  });

  await Promise.all(fetchPromises);
  
  const successCount = Object.keys(types).length;
  
  
  if (successCount === 0) {
    throw new Error(`Failed to fetch any k6 types for channel ${channelId}`);
  }
  
  return types;
}
