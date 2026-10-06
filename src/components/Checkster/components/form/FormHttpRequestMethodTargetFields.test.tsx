import { screen } from '@testing-library/react';

import { formTestRenderer } from './__test__/formTestRenderer';
import { FormHttpRequestMethodTargetFields } from './FormHttpRequestMethodTargetFields';

function renderTargetField(formValues: any = { target: '' }) {
  return formTestRenderer(FormHttpRequestMethodTargetFields, { field: 'target' }, formValues);
}

describe('FormHttpRequestMethodTargetFields - protocol hint', () => {
  it('does not show a hint while the user is still typing out a protocol', async () => {
    const user = renderTargetField();
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'https');

    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  });

  it('hints both protocol variants once the value looks like a valid hostname', async () => {
    const user = renderTargetField();
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'grafana.com');

    expect(await screen.findByText(/Did you mean/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'https://grafana.com' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'http://grafana.com' })).toBeInTheDocument();
  });

  it('does not show a hint once the value already has a complete protocol', async () => {
    const user = renderTargetField();
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'https://grafana.com');

    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  });

  it('resumes hinting once the value diverges from a protocol prefix', async () => {
    const user = renderTargetField();
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'httpbin.org');

    expect(await screen.findByRole('button', { name: 'https://httpbin.org' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'http://httpbin.org' })).toBeInTheDocument();
  });

  it('does not show a hint when the value would not be a valid target even with a protocol', async () => {
    const user = renderTargetField();
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'not a valid host');

    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  });

  it('keeps the hint visible after the input loses focus, like the validation error', async () => {
    const user = renderTargetField();
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'quickpizza.com');
    expect(await screen.findByText(/Did you mean/)).toBeInTheDocument();

    await user.tab();

    expect(screen.getByText(/Did you mean/)).toBeInTheDocument();
  });

  it('fills in the target with the selected protocol hint and dismisses the hint', async () => {
    const user = renderTargetField();
    const targetInput = screen.getByLabelText('Request target', { exact: false }) as HTMLInputElement;

    await user.type(targetInput, 'grafana.com');
    await user.click(await screen.findByRole('button', { name: 'https://grafana.com' }));

    expect(targetInput).toHaveValue('https://grafana.com');
    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  });

  it('disables the protocol hint buttons when the form is disabled', () => {
    renderTargetField({ target: 'quickpizza.com', disabled: true });

    expect(screen.getByRole('button', { name: 'https://quickpizza.com' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'http://quickpizza.com' })).toBeDisabled();
  });

  it('trims surrounding whitespace before suggesting a protocol', async () => {
    const user = renderTargetField();
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'quickpizza.com ');

    const suggestion = await screen.findByRole('button', { name: /https:\/\/quickpizza\.com/ });
    expect(suggestion.textContent).toBe('https://quickpizza.com');
  });

  it('does not mark the hint as a live region, to avoid re-announcing it on every keystroke', async () => {
    const user = renderTargetField();
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'quickpizza.com');

    const hint = await screen.findByText(/Did you mean/);
    expect(hint.closest('[aria-live]')).toBeNull();
  });
});
