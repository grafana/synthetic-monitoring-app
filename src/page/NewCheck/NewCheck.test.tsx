import React, { ReactNode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { CheckTypeGroup } from '../../types';
import { CheckForm } from 'components/CheckForm/CheckForm';

import { PluginPageNotFound } from '../NotFound';
import { NewCheck } from './NewCheck';

enum NewCheckTestIds {
  Ready = 'NewCheck.Ready',
  CheckForm = 'NewCheck.CheckForm',
  PluginPageNotFound = 'NewCheck.PluginPageNotFound',
}

function ReadyComponent({ children }: { children: ReactNode }) {
  return <div data-testid={NewCheckTestIds.Ready}>{children}</div>;
}

jest.mock('components/CheckForm/CheckForm', () => ({
  CheckForm: jest.fn().mockImplementation(() => (
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
  const result = render(<NewCheck />, options);
  await waitFor(() => expect(screen.getByTestId(NewCheckTestIds.Ready)).toBeInTheDocument());

  return result;
}

// The <NewCheck /> acts as a safe-guard for the check form, ensuring that the check type group is valid before rendering
describe('<NewCheck />', () => {
  it(`should render without props`, async () => {
    const { container } = await renderNewCheck();
    expect(container).toBeInTheDocument();
  });

  it.each(Object.values(CheckTypeGroup))(
    'should render <CheckForm /> for valid check type groups (%s)',
    async (checkTypeGroup) => {
      await renderNewCheck({ route: ':checkTypeGroup', path: checkTypeGroup });
      expect(screen.getByTestId(NewCheckTestIds.CheckForm)).toBeInTheDocument();
      expect(CheckForm).toHaveBeenCalledTimes(1);
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
