import React, { ReactNode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { Check, CheckType, CheckTypeGroup, IpVersion } from '../../types';

import { Checkster } from '../../components/Checkster';
import { PluginPageNotFound } from '../NotFound';
import { mergePrefilledCheck, NewCheckV2 } from './NewCheckV2';

enum NewCheckTestIds {
  Ready = 'NewCheck.Ready',
  CheckForm = 'NewCheck.CheckForm',
  PluginPageNotFound = 'NewCheck.PluginPageNotFound',
}

function ReadyComponent({ children }: { children: ReactNode }) {
  return <div data-testid={NewCheckTestIds.Ready}>{children}</div>;
}

jest.mock('components/Checkster', () => ({
  Checkster: jest.fn().mockImplementation(() => (
    <ReadyComponent>
      <div data-testid={NewCheckTestIds.CheckForm} />
    </ReadyComponent>
  )),
}));

jest.mock('page/NotFound', () => ({
  PluginPageNotFound: jest.fn().mockImplementation(() => (
    <ReadyComponent>
      <div data-testid={NewCheckTestIds.PluginPageNotFound} />
    </ReadyComponent>
  )),
}));

async function renderNewCheck(options?: any) {
  const result = render(<NewCheckV2 />, options);
  await waitFor(() => expect(screen.getByTestId(NewCheckTestIds.Ready)).toBeInTheDocument());

  return result;
}

// The <NewCheck /> acts as a safe-guard for the check form, ensuring that the check type group is valid before rendering
describe('<NewCheckV2 />', () => {
  it(`should render without props`, async () => {
    const { container } = await renderNewCheck();
    expect(container).toBeInTheDocument();
  });

  it.each(Object.values(CheckTypeGroup))(
    'should render <CheckFormV2 /> for valid check type groups (%s)',
    async (checkTypeGroup) => {
      await renderNewCheck({ route: ':checkTypeGroup', path: checkTypeGroup });
      expect(screen.getByTestId(NewCheckTestIds.CheckForm)).toBeInTheDocument();
      expect(Checkster).toHaveBeenCalledTimes(1);
    }
  );

  it('should render not found page for invalid check type group', async () => {
    await renderNewCheck({ route: ':checkTypeGroup', path: 'this-is-not-a-check-type-group' });
    expect(screen.getByTestId(NewCheckTestIds.PluginPageNotFound)).toBeInTheDocument();
    expect(PluginPageNotFound).toHaveBeenCalledTimes(1);
  });

  it('should render not found page when :checkTypeGroup param is missing', async () => {
    await renderNewCheck();
    expect(screen.getByTestId(NewCheckTestIds.PluginPageNotFound)).toBeInTheDocument();
    expect(PluginPageNotFound).toHaveBeenCalledTimes(1);
  });
});

describe('mergePrefilledCheck (prefilled draft handling)', () => {
  const draftBase = {
    job: 'my-check',
    target: 'https://example.com',
    enabled: true,
    probes: [],
    labels: [],
  } as unknown as Check;

  it('fills required settings defaults omitted by the draft (HTTP ipVersion)', () => {
    const result = mergePrefilledCheck(
      { ...draftBase, settings: { http: { method: 'GET' } } } as unknown as Check,
      CheckType.Http
    );
    const http = (result.settings as Record<string, any>).http;
    expect(http.method).toBe('GET');
    expect(http.ipVersion).toBe(IpVersion.V4);
    expect(result.job).toBe('my-check');
    expect(result.target).toBe('https://example.com');
  });

  it('normalizes a legacy `k6` settings key to `scripted`', () => {
    const result = mergePrefilledCheck(
      { ...draftBase, settings: { k6: { script: 'export default () => {};' } } } as unknown as Check,
      CheckType.Http
    );
    expect(result.settings).toHaveProperty('scripted');
    expect(result.settings).not.toHaveProperty('k6');
    expect((result.settings as Record<string, any>).scripted.script).toBe('export default () => {};');
  });

  it('uses the fallback check type when the draft has no settings', () => {
    const result = mergePrefilledCheck({ ...draftBase } as unknown as Check, CheckType.Browser);
    expect(result.settings).toHaveProperty('browser');
    expect(result.settings).not.toHaveProperty('http');
  });

  it('uses the fallback check type when settings is empty (does not default to HTTP)', () => {
    const result = mergePrefilledCheck(
      { ...draftBase, settings: {} } as unknown as Check,
      CheckType.Scripted
    );
    expect(result.settings).toHaveProperty('scripted');
    expect(result.settings).not.toHaveProperty('http');
  });
});
