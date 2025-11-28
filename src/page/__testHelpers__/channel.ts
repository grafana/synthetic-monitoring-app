// Mock k6 types CDN loader to avoid real external fetch calls to unpkg.com
// Channel tests enable VersionManagement which renders CodeEditor that fetches k6 types
jest.mock('components/CodeEditor/k6TypesLoader/k6TypesCdnLoader', () => ({
  fetchK6TypesFromCDN: jest.fn().mockResolvedValue({}),
}));

import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { CheckType, FeatureName } from 'types';
import { gotoSection } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';

import { renderNewFormV2 } from './checkForm';
import { fillMandatoryFields } from './v2.utils';

// Mock channel data for tests - simpler than the full fixture, focused on testing channel selection
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

// Channel testing helpers for scripted and browser checks in v2 editor
export const setupChannelTest = () => {
  mockFeatureToggles({
    [FeatureName.VersionManagement]: true,
  });

  server.use(
    apiRoute('listK6Channels', {
      result: () => ({ json: mockChannelsResponse }),
    })
  );
};

export const setupFormWithChannelSelector = async (checkType: CheckType) => {
  setupChannelTest(); // Ensure feature flag and API are mocked
  const { read, user } = await renderNewFormV2(checkType);
  await fillMandatoryFields({ user, fieldsToOmit: [], checkType });
  await gotoSection(user, FormSectionName.Check);

  await waitFor(() => {
    expect(screen.getByLabelText(/k6 version/i)).toBeInTheDocument();
  });

  const channelCombobox = screen.getByLabelText(/k6 version/i);

  return { read, user, channelCombobox };
};

