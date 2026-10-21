import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProtocolSuggestionHint } from './ProtocolSuggestionHint';

// Mimics how a real consumer uses this component: selecting a suggestion updates the value,
// which empties `suggestions` on the next render and unmounts the hint (and the button the
// user just activated).
function Harness({ initialSuggestions }: { initialSuggestions: string[] }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);

  return (
    <div>
      <input id="target-input" aria-label="Target" />
      <ProtocolSuggestionHint suggestions={suggestions} onSelect={() => setSuggestions([])} inputId="target-input" />
    </div>
  );
}

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

  it('returns focus to the associated input after a mouse-selected suggestion unmounts the hint', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuggestions={['https://grafana.com']} />);

    await user.click(screen.getByRole('button', { name: 'https://grafana.com' }));

    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Target' })).toHaveFocus();
  });

  it('returns focus to the associated input after selecting a suggestion via keyboard (Enter)', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuggestions={['https://grafana.com']} />);

    await user.tab(); // focuses the input
    await user.tab(); // focuses the suggestion button
    expect(screen.getByRole('button', { name: 'https://grafana.com' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Target' })).toHaveFocus();
  });
});
