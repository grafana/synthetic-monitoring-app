import React from 'react';
import { render, screen } from '@testing-library/react';

import { DisableReasonHint } from './DisableReasonHint';

describe('DisableReasonHint', () => {
  it('renders badge when disableReason is provided', () => {
    render(<DisableReasonHint disableReason="This check was disabled due to free tier overage" />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('does not render when disableReason is empty string', () => {
    const { container } = render(<DisableReasonHint disableReason="" />);
    expect(container.firstChild).toBeNull();
  });
});
