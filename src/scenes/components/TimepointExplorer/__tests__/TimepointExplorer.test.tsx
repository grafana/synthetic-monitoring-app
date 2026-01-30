// eslint-disable-next-line simple-import-sort/imports
import './TimepointExplorer.mocks';

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { DataTestIds } from 'test/dataTestIds';
import { mockFeatureToggles } from 'test/utils';
import { FeatureName } from 'types';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

const baseTime = new Date('2024-01-01T12:00:00Z').getTime();
const mockTimepoints: StatelessTimepoint[] = [
  {
    adjustedTime: baseTime - 300000, // 5 minutes before base time
    timepointDuration: 60000,
    index: 0,
    config: {
      frequency: 60000,
      from: baseTime - 400000,
      to: baseTime - 300000,
      type: undefined,
    },
  },
  {
    adjustedTime: baseTime - 240000, // 4 minutes before base time
    timepointDuration: 60000,
    index: 1,
    config: {
      frequency: 60000,
      from: baseTime - 300000,
      to: baseTime - 240000,
      type: undefined,
    },
  },
  {
    adjustedTime: baseTime - 180000, // 3 minutes before base time
    timepointDuration: 60000,
    index: 2,
    config: {
      frequency: 60000,
      from: baseTime - 240000,
      to: baseTime - 180000,
      type: undefined,
    },
  },
];

jest.mock('scenes/components/TimepointExplorer/TimepointExplorer.hooks', () => ({
  ...jest.requireActual('scenes/components/TimepointExplorer/TimepointExplorer.hooks'),
  useTimepoints: jest.fn(() => mockTimepoints),
}));

jest.mock('scenes/components/TimepointExplorer/TimepointViewer.hooks', () => ({
  useTimepointLogs: jest.fn(() => ({
    data: [],
    isFetching: false,
    isLoading: false,
    refetch: jest.fn(),
  })),
}));

const mockScrollIntoView = jest.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

function renderTimepointExplorer() {
  return <TimepointExplorer check={BASIC_HTTP_CHECK} />;
}

describe('TimepointExplorer', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear();
  });

  it(`should not render if the feature flag is off`, async () => {
    render(renderTimepointExplorer());
    await waitFor(() => screen.queryByTestId(DataTestIds.TimepointList));
    expect(screen.queryByTestId(DataTestIds.TimepointList)).not.toBeInTheDocument();
    expect(screen.queryByTestId(DataTestIds.TimepointViewer)).not.toBeInTheDocument();
  });

  it('should render if the feature flag is on', async () => {
    mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });
    render(renderTimepointExplorer());
    await waitFor(() => screen.findByTestId(DataTestIds.TimepointList));
    await waitFor(() => screen.findByTestId(DataTestIds.TimepointViewer));
  });

  it(`should not show empty state message after a timepoint is selected`, async () => {
    mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });
    const { user } = render(renderTimepointExplorer());

    await waitFor(() => screen.queryByTestId(DataTestIds.TimepointList));
    await waitFor(() => screen.findByTestId(DataTestIds.TimepointViewer));

    expect(screen.getByText('Click on a data point above to view detailed logs.')).toBeInTheDocument();

    const timepointButton = await waitFor(() => screen.findByTestId(`${DataTestIds.TimepointListEntryBar}-${mockTimepoints[2].index}`));
    await user.click(timepointButton);

    expect(screen.queryByText('Click on a data point above to view detailed logs.')).not.toBeInTheDocument();

  });

  it(`should call scrollIntoView when a timepoint with data is clicked`, async () => {
    mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });
    const { user } = render(renderTimepointExplorer());

    expect(mockScrollIntoView).not.toHaveBeenCalled();

    const timepointButton = await waitFor(() => screen.findByTestId(`${DataTestIds.TimepointListEntryBar}-${mockTimepoints[2].index}`));
    await user.click(timepointButton);

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

});
