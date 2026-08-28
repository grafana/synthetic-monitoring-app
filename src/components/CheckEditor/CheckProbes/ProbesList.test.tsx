import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen } from '@testing-library/react';
import { DB } from 'test/db';
import { render } from 'test/render';
import { probeToMetadataProbe } from 'test/utils';

import { CheckFormValues, ProbeWithMetadata } from 'types';

import { ProbesList } from './ProbesList';

function ProbeSelection() {
  const form = useForm<CheckFormValues>();
  const probes: ProbeWithMetadata[] = [
    probeToMetadataProbe(DB.probe.build({ id: 1, name: 'Calgary' })),
    probeToMetadataProbe(DB.probe.build({ id: 2, name: 'Montreal' })),
  ];
  const [selectedProbes, setSelectedProbes] = useState([probes[0].id!]);

  return (
    <FormProvider {...form}>
      <ProbesList
        title="AMER"
        probes={probes}
        selectedProbes={selectedProbes}
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
