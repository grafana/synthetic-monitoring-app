// eslint-disable-next-line simple-import-sort/imports
import './TimepointExplorer.mocks';

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { checksLogs1 } from 'test/fixtures/httpCheck/checkLogs';
import {
  createUniqueConfigFrame,
  createUniqueConfigsResponse,
  createMaxProbeDurationFrame,
  createMaxProbeDurationResponse,
} from 'test/fixtures/httpCheck/promUniqueConfigs';

import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { DataTestIds } from 'test/dataTestIds';
import { mockFeatureToggles } from 'test/utils';
import { FeatureName } from 'types';
import {
  REF_ID_EXECUTION_LIST_LOGS,
  REF_ID_EXECUTION_VIEWER_LOGS,
  REF_ID_MAX_PROBE_DURATION,
  REF_ID_UNIQUE_CHECK_CONFIGS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

const baseTime = Date.now();

function setupMSWHandlers() {
  server.use(
    apiRoute('getHttpDashboard', {
      result: async (req) => {
        const url = new URL(req.url);
        const refId = url.searchParams.get('refId');

        if (refId === REF_ID_UNIQUE_CHECK_CONFIGS) {
          const frame = createUniqueConfigFrame({
            configVersion: String((baseTime - 360000) * 1_000_000),
            frequency: '60000',
            timestamps: [baseTime - 360000],
            values: [1],
          });

          return {
            json: createUniqueConfigsResponse([frame]),
          };
        }

        if (refId === REF_ID_MAX_PROBE_DURATION) {
          const frame = createMaxProbeDurationFrame({
            refId: REF_ID_MAX_PROBE_DURATION,
            job: BASIC_HTTP_CHECK.job,
            instance: BASIC_HTTP_CHECK.target,
            probe: 'atlanta',
            timestamps: [baseTime],
            values: [2.5],
          });

          return {
            json: createMaxProbeDurationResponse(REF_ID_MAX_PROBE_DURATION, [frame]),
          };
        }

        if (refId?.startsWith(REF_ID_EXECUTION_LIST_LOGS)) {
          return { json: checksLogs1(refId) };
        }

        if (refId?.startsWith(REF_ID_EXECUTION_VIEWER_LOGS)) {
          return { json: checksLogs1(refId) };
        }

        return { json: { results: {} } };
      },
    })
  );
}



function renderTimepointExplorer() {
  return <TimepointExplorer check={BASIC_HTTP_CHECK} />;
}

const mockScrollIntoView = jest.fn();

describe('TimepointExplorer', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = mockScrollIntoView;
    jest.spyOn(Date, 'now').mockReturnValue(baseTime);
    setupMSWHandlers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it(`should call scrollIntoView when a timepoint with data is clicked`, async () => {
    mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });
    const { user } = render(renderTimepointExplorer());

    expect(mockScrollIntoView).not.toHaveBeenCalled();

    const timepointButtons = await screen.findAllByTestId(new RegExp(`${DataTestIds.TimepointListEntryBar}-`));

    await user.click(timepointButtons[0]);

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });
});
