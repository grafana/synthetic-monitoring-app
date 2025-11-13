import { screen, waitFor } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { mockFeatureToggles,probeToMetadataProbe } from 'test/utils';

import { CheckType, FeatureName } from 'types';

import { goToSection, renderNewForm,TARGET_MAP } from './checkForm';

interface FillMandatoryFieldsOptions {
  user: UserEvent;
  fieldsToOmit?: Array<'job' | 'target' | 'probes'>;
  checkType: CheckType;
}

export async function fillMandatoryFields({ user, fieldsToOmit = [], checkType }: FillMandatoryFieldsOptions) {
  await goToSection(user, 1);

  if (!fieldsToOmit.includes('job')) {
    const jobNameInput = screen.getByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `MANDATORY JOB NAME`);
  }

  if (!fieldsToOmit.includes('target')) {
    const targetInput = screen.getByLabelText(`Instance`, { exact: false });
    await user.type(targetInput, TARGET_MAP[checkType]);
  }

  await goToSection(user, 5);

  if (!fieldsToOmit.includes('probes')) {
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);
  }
}

// Channel testing helpers for scripted checks
export const mockChannelsResponse = {
  channels: [
    {
      id: 'v1',
      name: 'v1',
      default: true,
      deprecatedAfter: '2025-12-31T00:00:00Z',
      manifest: 'k6>=1,k6<2',
    },
    {
      id: 'v2',
      name: 'v2',
      default: false,
      deprecatedAfter: '2026-12-31T00:00:00Z',
      manifest: 'k6>=2',
    },
  ],
};

export const setupChannelTest = () => {
  mockFeatureToggles({
    [FeatureName.VersionManagement]: true,
  });

  server.use(
    apiRoute('listK6Channels', { 
      result: () => ({ json: mockChannelsResponse }) 
    })
  );
};

export const setupFormWithChannelSelector = async (checkType: CheckType) => {
  const { read, user } = await renderNewForm(checkType);
  await fillMandatoryFields({ user, fieldsToOmit: [], checkType });
  await goToSection(user, 1);
  
  await waitFor(() => {
    expect(screen.getByLabelText(/k6 version/i)).toBeInTheDocument();
  }); 
  
  const channelSelector = screen.getByLabelText(/k6 version/i);
  
  await user.selectOptions(channelSelector, 'v1');
  await waitFor(() => {
    expect(channelSelector).toHaveValue('v1');
  });
  
  return { read, user, channelSelector };
};
