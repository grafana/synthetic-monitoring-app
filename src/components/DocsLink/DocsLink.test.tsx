import React from 'react';
import { render, screen } from '@testing-library/react';

import { appendTrackingParams } from 'components/DocsLink/DocsLink.utils';

import { DocsLink } from './DocsLink';

const href = 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/';
const text = 'Synthetic Monitoring docs';

describe('DocsLink', () => {
  it('should render correctly', () => {
    render(
      <DocsLink href={href} source="test">
        {text}
      </DocsLink>
    );

    const link = screen.getByText(text);
    expect(link).toBeInTheDocument();
  });

  it('should append tracking params to the href', () => {
    const href = 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/';
    const text = 'Synthetic Monitoring docs';

    render(
      <DocsLink href={href} source="test">
        {text}
      </DocsLink>
    );

    const link = screen.getByText(text);
    expect(link).toHaveAttribute('href', appendTrackingParams(href));
  });

  it(`should not append tracking params to the href if it's not a valid URL`, () => {
    const href = 'invalid-url';
    const text = 'Synthetic Monitoring docs';

    render(
      <DocsLink href={href} source="test">
        {text}
      </DocsLink>
    );

    const link = screen.getByText(text);
    expect(link).toHaveAttribute('href', href);
  });
});
