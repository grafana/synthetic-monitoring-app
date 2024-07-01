import { config } from '@grafana/runtime';

type GrafanaVersion = {
  major: number;
  minor: number;
  patch: string;
};

function parseVersion(version: string): GrafanaVersion | undefined {
  try {
    const [major, minor, patch] = version.split('.');
    return {
      major: parseInt(major, 10),
      minor: parseInt(minor, 10),
      patch,
    };
  } catch (e) {
    return;
  }
}

export function useGrafanaVersion() {
  const version = config.buildInfo.version;
  return parseVersion(version) ?? { major: 0, minor: 0, patch: '' };
}
