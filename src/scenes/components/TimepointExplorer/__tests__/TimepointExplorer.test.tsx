// eslint-disable-next-line simple-import-sort/imports
import './TimepointExplorer.mocks';

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { UI_TEST_ID } from 'test/dataTestIds';
import { mockFeatureToggles } from 'test/utils';
import { FeatureName } from 'types';

function renderTimepointExplorer() {
  return <TimepointExplorer check={BASIC_HTTP_CHECK} />;
}

describe('TimepointExplorer', () => {
  it(`should not render if the feature flag is off`, async () => {
    render(renderTimepointExplorer());
    await waitFor(() => screen.queryByTestId(UI_TEST_ID.timepointList));
    expect(screen.queryByTestId(UI_TEST_ID.timepointList)).not.toBeInTheDocument();
  });

  it('should render if the feature flag is on', async () => {
    mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });
    render(renderTimepointExplorer());
    await waitFor(() => screen.findByTestId(UI_TEST_ID.timepointList));
  });
});
