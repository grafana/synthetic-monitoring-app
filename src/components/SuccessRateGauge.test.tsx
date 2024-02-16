import React from 'react';
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { DEFAULT_PROBES } from 'test/fixtures/probes';
import { render } from 'test/render';

import * as utils from 'utils';
import { SuccessRateTypes } from 'contexts/SuccessRateContext';

import { SuccessRateContextProvider } from './SuccessRateContextProvider';
import { SuccessRateGauge } from './SuccessRateGauge';

const renderSuccessRateGauge = () => {
  return waitFor(() =>
    render(
      <SuccessRateContextProvider probes={DEFAULT_PROBES}>
        <SuccessRateGauge
          title="Reachability"
          id={BASIC_HTTP_CHECK.id!}
          type={SuccessRateTypes.Checks}
          height={200}
          width={200}
          onClick={jest.fn()}
        />
      </SuccessRateContextProvider>
    )
  );
};
test('shows a value if data', async () => {
  await renderSuccessRateGauge();

  const value = await screen.findByText('100%');
  expect(value).toBeInTheDocument();
});

// test('shows N/A if no data', async () => {
//   // TODO: MSW THIS
//   jest.spyOn(utils, 'queryMetric').mockImplementation(() =>
//     Promise.resolve({
//       data: [
//         {
//           metric: {
//             job: 'burritos',
//             instance: 'tacos',
//           },
//           value: [],
//         },
//       ],
//     })
//   );
//   await renderSuccessRateGauge();
//   await waitForElementToBeRemoved(() => screen.queryByText('loading...'));
//   const value = await screen.findByText('N/A');
//   expect(value).toBeInTheDocument();
// });
