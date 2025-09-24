import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { Feedback } from './Feedback';

jest.mock('features/tracking/feedbackEvents', () => ({
  trackFeatureFeedback: jest.fn(),
  trackFeatureFeedbackComment: jest.fn(),
}));

import { trackFeatureFeedback, trackFeatureFeedbackComment } from 'features/tracking/feedbackEvents';

describe('Feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly without a link', async () => {
    const about = {
      text: 'Test',
    };
    render(<Feedback feature="test" about={about} />);
    const goodButton = await screen.findByRole('button', { name: 'I love this feature' });
    expect(goodButton).toBeInTheDocument();
    expect(screen.getByText(about.text)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: about.text })).not.toBeInTheDocument();
  });

  it('should render the link correctly', async () => {
    const about = {
      text: 'Test',
      link: 'https://test.com',
      tooltipText: 'Test tooltip',
    };
    const { user } = render(<Feedback feature="test" about={about} />);
    const goodButton = await screen.findByRole('button', { name: 'I love this feature' });
    await user.hover(screen.getByText(about.text));

    expect(goodButton).toBeInTheDocument();
    expect(screen.getByText(about.text)).toBeInTheDocument();
    expect(screen.getByText(about.tooltipText)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: about.text })).toBeInTheDocument();
  });

  describe.each([
    ['good', 'I love this feature'],
    ['bad', "I don't like this feature"],
  ])('%s reaction', (reaction, tooltip) => {
    it('should show the feedback form when clicked', async () => {
      const FEATURE = 'test';
      const { user } = render(<Feedback feature={FEATURE} />);
      const button = await screen.findByRole('button', { name: tooltip });
      await user.click(button);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(trackFeatureFeedback).toHaveBeenCalledWith({ feature: FEATURE, reaction });
    });

    it('should submit feedback comment', async () => {
      const { user } = render(<Feedback feature="test" />);
      const button = await screen.findByRole('button', { name: tooltip });
      await user.click(button);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test comment');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(trackFeatureFeedbackComment).toHaveBeenCalledWith({
        feature: 'test',
        reaction,
        comment: 'Test comment',
      });

      expect(textarea).not.toBeInTheDocument();
    });

    it('should close the form when clicking away', async () => {
      const { user } = render(<Feedback feature="test" />);
      const button = await screen.findByRole('button', { name: tooltip });
      await user.click(button);

      const textarea = screen.getByRole('textbox');
      await user.click(document.body);

      expect(textarea).not.toBeInTheDocument();
    });
  });
});
