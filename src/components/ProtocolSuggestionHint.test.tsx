import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProtocolSuggestionHint } from './ProtocolSuggestionHint';

describe('ProtocolSuggestionHint', () => {
  it('renders nothing when there are no suggestions', () => {
    render(<ProtocolSuggestionHint suggestions={[]} onSelect={jest.fn()} />);

    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  });

  it('renders a clickable suggestion for each target and calls onSelect with it', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<ProtocolSuggestionHint suggestions={['https://grafana.com', 'http://grafana.com']} onSelect={onSelect} />);

    expect(screen.getByText(/Did you mean/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'https://grafana.com' }));

    expect(onSelect).toHaveBeenCalledWith('https://grafana.com');
  });

  it('disables the suggestion buttons when disabled', () => {
    render(<ProtocolSuggestionHint suggestions={['https://grafana.com']} onSelect={jest.fn()} disabled />);

    expect(screen.getByRole('button', { name: 'https://grafana.com' })).toBeDisabled();
  });

  it('does not mark the hint as a live region, to avoid re-announcing it on every keystroke', () => {
    render(<ProtocolSuggestionHint suggestions={['https://grafana.com']} onSelect={jest.fn()} />);

    expect(screen.getByText(/Did you mean/).closest('[aria-live]')).toBeNull();
  });

  it('renders without error when a marginBottom is provided for layouts without a gap-ed Stack', () => {
    render(<ProtocolSuggestionHint suggestions={['https://grafana.com']} onSelect={jest.fn()} marginBottom={2} />);

    expect(screen.getByText(/Did you mean/)).toBeInTheDocument();
  });
});
