import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { CHECKSTER_TEST_ID, DataTestIds } from 'test/dataTestIds';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { CheckType } from 'types';
import { getCheckTypeGroup } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { gotoSection } from 'components/Checkster/__testHelpers__/formHelpers';
import { doAdhocCheck } from 'components/Checkster/feature/adhoc-check/__testHelpers__/adhocCheck';
import { FormSectionName } from 'components/Checkster/types';
import { NewCheckV2 } from 'page/NewCheck/NewCheckV2';

let probeRequests: Request[] = [];

function buildLokiLogsResponse() {
  return {
    results: {
      A: {
        status: 200,
        frames: [
          {
            schema: {
              fields: [
                { name: 'timestamp', type: 'time' },
                { name: 'body', type: 'string' },
              ],
            },
            data: {
              values: [
                [1704067202000],
                [
                  JSON.stringify({
                    id: 'adhoc-1',
                    level: 'info',
                    target: 'https://grafana.com/',
                    probe: PRIVATE_PROBE.name,
                    check_name: 'JOB FIELD',
                    message: 'done',
                    logs: [
                      {
                        level: 'info',
                        msg: 'second log',
                        time: '2024-01-01T00:00:02Z',
                        status_code: '202',
                      },
                    ],
                    timeseries: [
                      { name: 'probe_success', help: 'success', type: 1, metric: [{ gauge: { value: 1 } }] },
                    ],
                  }),
                ],
              ],
            },
          },
        ],
      },
    },
  };
}

describe('adhoc-check', () => {
  beforeEach(() => {
    const { record, requests } = getServerRequests();
    probeRequests = requests;

    server.use(
      apiRoute(
        'listProbes',
        {
          result: () => ({
            json: [PRIVATE_PROBE],
          }),
        },
        record
      )
    );

    server.use(
      apiRoute('testCheck', {
        result: () => ({
          json: {
            id: 'adhoc-1',
            probes: [PRIVATE_PROBE.id!],
            timeout: 1000,
          },
        }),
      })
    );

    server.use(
      http.post(new RegExp('^http://localhost.*/api/ds/query(?:\\?.*)?$'), async () => {
        return HttpResponse.json(buildLokiLogsResponse());
      })
    );
  });

  async function renderHttpNewCheckForm() {
    const checkType = CheckType.Http;
    const checkTypeGroup = getCheckTypeGroup(checkType);
    const result = render(<NewCheckV2 />, {
      path: `${generateRoutePath(AppRoutes.NewCheck)}/${checkTypeGroup}?checkType=${checkType}`,
      route: `${getRoute(AppRoutes.NewCheck)}/:checkTypeGroup`,
    });

    await waitFor(() => {
      expect(screen.getByTestId(DataTestIds.PageReady)).toBeInTheDocument();
    });

    return result;
  }

  it('does not reset open test logs when probes refresh for the same adhoc request', async () => {
    const { user, queryClient } = await renderHttpNewCheckForm();

    const jobField = screen.getByLabelText(/Job name/);
    await user.click(jobField);
    await user.paste('JOB FIELD');

    const targetField = screen.getByLabelText(/Request target/);
    await user.click(targetField);
    await user.paste('https://grafana.com/');

    await gotoSection(user, FormSectionName.Execution);
    const probeCheckbox = await screen.findByRole('checkbox', { name: new RegExp(PRIVATE_PROBE.name) });
    await user.click(probeCheckbox);

    await doAdhocCheck(user);

    await waitFor(() => {
      expect(screen.getByText('Logs: 1, Metrics: 1')).toBeInTheDocument();
    });

    await user.click(screen.getAllByText(PRIVATE_PROBE.name).at(-1)!);
    await user.click(screen.getByText('second log'));

    expect(screen.getByTestId('preformatted')).toHaveTextContent('status_code: 202');

    const initialProbeRequestCount = probeRequests.length;

    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['probes'] });
    });

    await waitFor(() => {
      expect(probeRequests.length).toBeGreaterThan(initialProbeRequestCount);
    });

    expect(screen.getByTestId(CHECKSTER_TEST_ID.feature.adhocCheck.TestButton.root)).toBeInTheDocument();
    expect(screen.getByText('Logs: 1, Metrics: 1')).toBeInTheDocument();
    expect(screen.getByTestId('preformatted')).toHaveTextContent('status_code: 202');
  });
});
