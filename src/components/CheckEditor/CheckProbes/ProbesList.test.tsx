import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen } from '@testing-library/react';
import { DB } from 'test/db';
import { render } from 'test/render';
import { probeToMetadataProbe } from 'test/utils';

import { CheckFormValues, ProbeWithMetadata } from 'types';

import { ProbesList } from './ProbesList';

function ProbeSelection({
  deprecated = false,
  assignedProbes = [],
  initialProbes = [1],
}: {
  deprecated?: boolean;
  assignedProbes?: number[];
  initialProbes?: number[];
}) {
  const form = useForm<CheckFormValues>();
  const probes: ProbeWithMetadata[] = [
    probeToMetadataProbe(DB.probe.build({ id: 1, name: 'Calgary' })),
    probeToMetadataProbe(DB.probe.build({ id: 2, name: 'Montreal', deprecated })),
  ];
  const [selectedProbes, setSelectedProbes] = useState(initialProbes);

  return (
    <FormProvider {...form}>
      <ProbesList
        title="AMER"
        probes={probes}
        selectedProbes={selectedProbes}
        assignedProbes={assignedProbes}
        onSelectionChange={setSelectedProbes}
      />
    </FormProvider>
  );
}

describe('<ProbesList />', () => {
  it('shows the region header as checked after the final probe is selected', async () => {
    const { user } = render(<ProbeSelection />);
    const header = await screen.findByRole('checkbox', { name: /AMER/ });

    expect(header).toBePartiallyChecked();

    await user.click(await screen.findByRole('checkbox', { name: /Montreal/ }));

    expect(header).toBeChecked();
    expect(header).not.toBePartiallyChecked();
  });
});

it('excludes deprecated probes from region selection and disables their checkbox', async () => {
  const { user } = render(<ProbeSelection deprecated initialProbes={[]} />);
  const header = await screen.findByRole('checkbox', { name: /AMER/ });
  expect(screen.getByRole('checkbox', { name: /Montreal/ })).toBeDisabled();
  await user.click(header);
  expect(screen.getByRole('checkbox', { name: /Calgary/ })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /Montreal/ })).not.toBeChecked();
  expect(header).toBeChecked();
  await user.click(header);
  expect(screen.getByRole('checkbox', { name: /Calgary/ })).not.toBeChecked();
});

it('lets users remove and undo removal of a saved deprecated assignment', async () => {
  const { user } = render(<ProbeSelection deprecated assignedProbes={[2]} initialProbes={[2]} />);
  const probe = await screen.findByRole('checkbox', { name: /Montreal/ });
  expect(probe).toBeChecked();
  await user.click(probe);
  expect(probe).not.toBeChecked();
  expect(probe).toBeEnabled();
  await user.click(probe);
  expect(probe).toBeChecked();
});
