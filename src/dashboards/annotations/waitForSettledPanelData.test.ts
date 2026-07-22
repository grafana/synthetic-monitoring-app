import { LoadingState, PanelData, toUtc } from '@grafana/data';
import { firstValueFrom, of, Subject } from 'rxjs';

import { waitForSettledPanelData } from './executeDashboardAnnotations';

describe('waitForSettledPanelData', () => {
  const timeRange = {
    from: toUtc(0),
    to: toUtc(60_000),
    raw: { from: 'now-1h', to: 'now' },
  };

  it('skips the initial Loading emission and resolves with Done data', async () => {
    const loading: PanelData = {
      state: LoadingState.Loading,
      series: [],
      timeRange,
    };
    const done: PanelData = {
      state: LoadingState.Done,
      series: [
        {
          name: 'ALERTS',
          fields: [],
          length: 0,
        },
      ],
      timeRange,
    };

    const subject = new Subject<PanelData>();
    const resultPromise = firstValueFrom(waitForSettledPanelData(subject));

    subject.next(loading);
    subject.next(done);

    await expect(resultPromise).resolves.toEqual(done);
  });

  it('resolves Error state so callers are not left hanging on Loading', async () => {
    const errored: PanelData = {
      state: LoadingState.Error,
      series: [],
      timeRange,
      error: { message: 'boom' },
    };

    await expect(firstValueFrom(waitForSettledPanelData(of(errored)))).resolves.toEqual(errored);
  });
});
