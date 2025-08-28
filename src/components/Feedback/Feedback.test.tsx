import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Feedback } from './Feedback';

describe('Feedback', () => {
  it('should render', () => {
    render(<Feedback feature="test" />);
  });

  it('should show the feedback form when the button is clicked', async () => {
    render(<Feedback feature="test" />);
    await userEvent.click(screen.getByRole('button', { name: 'I love this feature' }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
