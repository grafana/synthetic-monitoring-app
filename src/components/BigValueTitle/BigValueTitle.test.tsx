import React from 'react';
import { render, screen } from '@testing-library/react';

import { BigValueTitle } from './BigValueTitle';

describe('BigValueTitle', () => {
  it('renders the title', () => {
    render(<BigValueTitle title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders info icon and tooltip when infoText is provided', () => {
    render(<BigValueTitle title="Info Title" infoText="Info tooltip" />);
    expect(screen.getByLabelText('Info Title - Info tooltip')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders nothing if no title or infoText is provided', () => {
    const { container } = render(<BigValueTitle />);
    expect(container).toBeEmptyDOMElement();
  });
});
