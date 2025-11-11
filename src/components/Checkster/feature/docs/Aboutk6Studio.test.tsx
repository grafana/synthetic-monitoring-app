import React from 'react';
import { render, screen } from '@testing-library/react';

import { Aboutk6Studio } from 'components/Checkster/feature/docs/Aboutk6Studio';
import { appendTrackingParams } from 'components/DocsLink/DocsLink.utils';

describe('Aboutk6Studio', () => {
  it('should render correctly', () => {
    render(<Aboutk6Studio source="test" />);
    const link = screen.getByRole('link', { name: 'Install k6 Studio' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', appendTrackingParams(`https://grafana.com/docs/k6-studio/set-up/install/`));
  });
});
