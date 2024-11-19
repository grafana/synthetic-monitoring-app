import { OrgRole } from '@grafana/data';
import runTime, { config } from '@grafana/runtime';
import { act, screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import {
  LOGS_DATASOURCE,
  METRICS_DATASOURCE,
  VIEWER_DEFAULT_DATASOURCE_ACCESS_CONTROL,
} from 'test/fixtures/datasources';

import { ExtendedProbe, type Probe } from 'types';

import { FULL_ADMIN_ACCESS, FULL_READONLY_ACCESS, FULL_WRITER_ACCESS } from './fixtures/rbacPermissions';
import { apiRoute } from './handlers';
import { server } from './server';

export const UPDATED_VALUES: Pick<Probe, 'name' | 'latitude' | 'longitude' | 'region' | 'labels' | 'capabilities'> = {
  latitude: 19.05758,
  longitude: 72.89654,
  name: 'Shiny excellent probe',
  region: 'APAC',
  labels: [{ name: 'UPDATED', value: 'PROBE' }],
  capabilities: {
    disableScriptedChecks: true,
    disableBrowserChecks: true,
  },
};

export async function fillProbeForm(user: UserEvent) {
  const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
  await user.clear(nameInput);
  await user.type(nameInput, UPDATED_VALUES.name);

  const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
  await user.clear(latitudeInput);
  await user.type(latitudeInput, UPDATED_VALUES.latitude.toString());

  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  await user.clear(longitudeInput);
  await user.type(longitudeInput, UPDATED_VALUES.longitude.toString());

  const regionInput = await screen.findByLabelText('Region', { exact: false });
  await act(() => regionInput.focus());
  await user.clear(regionInput);
  await user.paste(UPDATED_VALUES.region);
  await user.type(regionInput, '{enter}');

  const addLabelButton = await screen.findByText(/Add label/);
  const existingLabels = await screen.queryAllByTestId(/label-name-/);

  for (let i = 0; i < UPDATED_VALUES.labels.length; i++) {
    await user.click(addLabelButton);
    const label = UPDATED_VALUES.labels[i];

    const humanIndex = existingLabels.length + i + 1;
    const labelNameInput = await screen.findByLabelText(`Label ${humanIndex} name`, { exact: false });

    await user.type(labelNameInput, label.name);

    const labelValueInput = await screen.findByLabelText(`Label ${humanIndex} value`, { exact: false });
    await user.type(labelValueInput, label.value);
  }

  const disableScriptedChecks = await screen.findByLabelText('Disable scripted checks', { exact: false });
  await user.click(disableScriptedChecks);

  const disableBrowserChecks = await screen.findByLabelText('Disable browser checks', { exact: false });
  await user.click(disableBrowserChecks);
}

export function runTestAsSMViewer() {
  // this gets reset in afterEach in jest-setup.js
  const runtime = require('@grafana/runtime');
  jest.replaceProperty(runtime, `config`, {
    ...config,
    bootData: {
      ...config.bootData,
      user: {
        ...config.bootData.user,
        orgRole: OrgRole.Viewer,
      },
    },
  });
}

export function runTestAsLogsViewer() {
  server.use(
    apiRoute(`getLogsDS`, {
      result: () => {
        return {
          json: {
            ...LOGS_DATASOURCE,
            accessControl: VIEWER_DEFAULT_DATASOURCE_ACCESS_CONTROL,
          },
        };
      },
    })
  );
}

export function runTestAsMetricsViewer() {
  server.use(
    apiRoute(`getMetricsDS`, {
      result: () => {
        return {
          json: {
            ...METRICS_DATASOURCE,
            accessControl: VIEWER_DEFAULT_DATASOURCE_ACCESS_CONTROL,
          },
        };
      },
    })
  );
}

export function runTestAsViewer() {
  runTestAsSMViewer();
  runTestAsLogsViewer();
  runTestAsMetricsViewer();
}

export function runTestWithoutMetricsAccess() {
  // this gets reset in afterEach in jest-setup.js
  const runtime = require('@grafana/runtime');
  jest.replaceProperty(runtime, `config`, {
    ...config,
    datasources: {
      [LOGS_DATASOURCE.name]: LOGS_DATASOURCE,
    },
  });
}

export function runTestWithoutLogsAccess() {
  // this gets reset in afterEach in jest-setup.js
  const runtime = require('@grafana/runtime');
  jest.replaceProperty(runtime, `config`, {
    ...config,
    datasources: {
      [METRICS_DATASOURCE.name]: METRICS_DATASOURCE,
    },
  });
}

export function runTestWithoutSMAccess() {
  jest.spyOn(runTime, 'getDataSourceSrv').mockImplementation(() => {
    return {
      ...jest.requireActual('@grafana/runtime').getDatasourceSrv(),
      getList: () => [METRICS_DATASOURCE, LOGS_DATASOURCE],
    };
  });
}

export function runTestAsRbacReader() {
  const runtime = require('@grafana/runtime');
  jest.replaceProperty(runtime, `config`, {
    ...config,
    featureToggles: {
      ...runtime.config.featureToggles,
      accessControlOnCall: true,
    },

    bootData: {
      ...runtime.config.bootData,
      user: {
        permissions: FULL_READONLY_ACCESS,
      },
    },
  });
}

export function runTestAsRbacEditor() {
  const runtime = require('@grafana/runtime');
  jest.replaceProperty(runtime, `config`, {
    ...config,
    featureToggles: {
      ...runtime.config.featureToggles,
      accessControlOnCall: true,
    },

    bootData: {
      ...runtime.config.bootData,
      user: {
        permissions: FULL_WRITER_ACCESS,
      },
    },
  });
}

export function runTestAsRbacAdmin() {
  const runtime = require('@grafana/runtime');
  jest.replaceProperty(runtime, `config`, {
    ...config,
    featureToggles: {
      ...runtime.config.featureToggles,
      accessControlOnCall: true,
    },

    bootData: {
      ...runtime.config.bootData,
      user: {
        permissions: FULL_ADMIN_ACCESS,
      },
    },
  });
}

export function runTestAsHGFreeUserOverLimit() {
  // this gets reset in afterEach in jest-setup.js
  const runtime = require('@grafana/runtime');

  jest.replaceProperty(runtime, `config`, {
    ...config,
    buildInfo: {
      ...config.buildInfo,
      edition: `Cloud Free`,
    },
  });
}

export const getSlider = async (formName: string) => {
  const container = await screen.findByTestId(formName);
  const minutes = await within(container).findByLabelText('minutes');
  const seconds = await within(container).findByLabelText('seconds');
  return [minutes, seconds];
};

type GetSelectProps =
  | {
      label: string | RegExp;
    }
  | {
      text: string | RegExp;
    };

export const getSelect = async (options: GetSelectProps, context?: HTMLElement) => {
  let selector;

  if ('label' in options) {
    if (context) {
      selector = await within(context).findByLabelText(options.label, { exact: false });
    } else {
      selector = await screen.findByLabelText(options.label, { exact: false });
    }
  }

  if ('text' in options) {
    if (context) {
      selector = await within(context).findByText(options.text);
    } else {
      selector = await screen.findByText(options.text);
    }
  }

  const parent = selector!.parentElement?.parentElement?.parentElement as HTMLElement;
  const input = parent.querySelector(`input`) as HTMLInputElement;

  return [parent, input];
};

type SelectOptions = GetSelectProps & {
  option: string;
};

export const selectOption = async (user: UserEvent, options: SelectOptions, context?: HTMLElement) => {
  const [, input] = await getSelect(options, context);

  await user.click(input);
  const option = within(screen.getByLabelText(`Select options menu`)).getByText(options.option);

  await user.click(option);
};

export const probeToExtendedProbe = (probe: Probe, usedByChecks: number[] = []): ExtendedProbe => ({
  ...probe,
  checks: usedByChecks,
});
