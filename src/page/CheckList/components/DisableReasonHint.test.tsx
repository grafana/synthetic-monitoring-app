import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DisableReasonHint } from './DisableReasonHint';

describe('DisableReasonHint', () => {
  it('renders badge and shows user-friendly message for FREE_LIMIT_EXCEEDED', async () => {
    const user = userEvent.setup();
    render(<DisableReasonHint disableReason="FREE_LIMIT_EXCEEDED" />);

    const badge = screen.getByText('Disabled');
    expect(badge).toBeInTheDocument();

    await user.hover(badge);
    expect(
      screen.getByText(
        'This check was disabled because you have exceeded the free tier limit. Upgrade your plan to re-enable checks.'
      )
    ).toBeInTheDocument();
  });

  it('renders badge and shows fallback message for unknown disable reason', async () => {
    const user = userEvent.setup();
    render(<DisableReasonHint disableReason="UNKNOWN_REASON" />);

    const badge = screen.getByText('Disabled');
    expect(badge).toBeInTheDocument();

    await user.hover(badge);
    expect(screen.getByText('This check has been disabled.')).toBeInTheDocument();
  });

  it('does not render when disableReason is empty string', () => {
    const { container } = render(<DisableReasonHint disableReason="" />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when disableReason is null', () => {
    const { container } = render(<DisableReasonHint disableReason={null} />);
    expect(container.firstChild).toBeNull();
  });
});
