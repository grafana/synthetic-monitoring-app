// eslint-disable-next-line simple-import-sort/imports
import './TimepointExplorer.mocks';

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { DataTestIds } from 'test/dataTestIds';

function renderTimepointExplorer() {
  return <TimepointExplorer check={BASIC_HTTP_CHECK} />;
}

describe('TimepointExplorer', () => {
  it('should render', async () => {
    render(renderTimepointExplorer());
    await waitFor(() => screen.findByTestId(DataTestIds.TIMEPOINT_LIST));
    screen.debug();
  });
});
