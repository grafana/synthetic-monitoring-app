import { PluginExtensionTypes } from '@grafana/data';

import type { Slo } from 'scenes/Common/useSmCheckSlos.types';

function getRuntimeModule(): typeof import('@grafana/runtime') {
  return require('@grafana/runtime');
}

export function spyUsePluginFunctionsForSlos(resolve: Slo[], options?: { notFound?: boolean }) {
  const apiStub = options?.notFound
    ? {
        getSlos: async () => ({
          error: { status: 404 },
          data: undefined,
        }),
        updateSlo: jest.fn().mockResolvedValue({ data: resolve[0] }),
        deleteSlo: jest.fn().mockResolvedValue({ data: {} }),
      }
    : {
        getSlos: async () => ({
          data: { slos: resolve },
        }),
        updateSlo: jest.fn().mockImplementation(async (slo: Slo) => ({ data: slo })),
        deleteSlo: jest.fn().mockResolvedValue({ data: {} }),
      };

  const fn = async () => apiStub;

  return jest.spyOn(getRuntimeModule(), 'usePluginFunctions').mockReturnValue({
    isLoading: false,
    functions: [
      {
        id: 'grafana-slo-app/slo-api/v1:test',
        type: PluginExtensionTypes.function,
        title: 'SLO API',
        description: '',
        pluginId: 'grafana-slo-app',
        fn,
      },
    ],
  });
}
