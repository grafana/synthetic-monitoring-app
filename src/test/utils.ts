import { OrgRole } from '@grafana/data';
import { config } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import { type Probe } from 'types';

export const UPDATED_VALUES: Pick<Probe, 'name' | 'latitude' | 'longitude' | 'region' | 'labels'> = {
  latitude: 19.05758,
  longitude: 72.89654,
  name: 'Shiny excellent probe',
  region: 'APAC',
  labels: [{ name: 'UPDATED', value: 'PROBE' }],
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
  regionInput.focus();
  await user.clear(regionInput);
  await user.paste(UPDATED_VALUES.region);
  await user.type(regionInput, '{enter}');

  const addLabelButton = await screen.findByRole('button', { name: /Add label/ });
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
}

export function runTestAsViewer() {
  // this gets reset to editor in afterEach in jest-setup.js
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
    featureToggles: {
      ...config.featureToggles,
      topnav: true,
    },
  });
}
