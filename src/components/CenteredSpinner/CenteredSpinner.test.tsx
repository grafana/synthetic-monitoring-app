import React from 'react';
import { render, screen } from '@testing-library/react';

import { UI_TEST_ID } from '../../test/dataTestIds';;
import { CenteredSpinner } from './CenteredSpinner';

describe('CenteredSpinner', () => {
  it('should render spinner with default styles', () => {
    render(<CenteredSpinner />);

    const spinner = screen.getByTestId(UI_TEST_ID.centeredSpinner);
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    });
  });

  it('should have accessible loading indicator (aria-label)', () => {
    render(<CenteredSpinner />);

    const spinner = screen.getByTestId(UI_TEST_ID.centeredSpinner);
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('should allow custom aria-label', () => {
    const customLabel = 'Custom loading label';
    render(<CenteredSpinner aria-label={customLabel} />);

    const spinner = screen.getByTestId(UI_TEST_ID.centeredSpinner);
    expect(spinner).toHaveAttribute('aria-label', customLabel);
  });

  it('should have aria-hidden set to false', () => {
    render(<CenteredSpinner />);

    const spinner = screen.getByTestId(UI_TEST_ID.centeredSpinner);
    expect(spinner).toHaveAttribute('aria-hidden', 'false'); // important if the parent element uses aria-busy="true"
  });
});
