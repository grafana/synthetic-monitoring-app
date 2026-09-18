import { PluginExtensionTypes } from '@grafana/data';

import type { SLO } from 'scenes/Common/grafanaSLOApp.types';

function getRuntimeModule(): typeof import('@grafana/runtime') {
  return require('@grafana/runtime');
}

/** Mirrors the SLO app contract: methods resolve with plain values and reject on failure. */
export function spyUsePluginFunctionsForSLOs(resolve: SLO[], options?: { notFound?: boolean }) {
  const apiStub = {
    getSlos: async () => {
      if (options?.notFound) {
        throw Object.assign(new Error('not found'), { status: 404 });
      }
      return { slos: resolve };
    },
    getSlo: jest.fn().mockImplementation(async (uuid: string) => resolve.find((slo) => slo.uuid === uuid)),
    addSlo: jest.fn().mockImplementation(async (slo: SLO) => ({ message: 'created', uuid: slo.uuid })),
    updateSlo: jest.fn().mockResolvedValue(undefined),
    deleteSlo: jest.fn().mockImplementation(async (uuid: string) => ({ uuid })),
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
