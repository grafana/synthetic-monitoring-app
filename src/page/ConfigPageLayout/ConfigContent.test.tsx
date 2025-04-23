import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';

import { ConfigContent } from './ConfigContent';

describe('ConfigContent', () => {
  it('should render children when not loading', () => {
    render(
      <ConfigContent>
        <p>Test Content</p>
      </ConfigContent>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.queryByTestId(DataTestIds.CONFIG_CONTENT_LOADING)).not.toBeInTheDocument();
  });

  it('should render loading spinner when loading is true', () => {
    render(<ConfigContent loading={true} />);

    const loadingSpinner = screen.getByTestId(DataTestIds.CONFIG_CONTENT_LOADING);
    expect(loadingSpinner).toBeInTheDocument();
    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
  });

  it('should render title and actions when provided', () => {
    render(
      <ConfigContent title="Test Title" actions={<button>Test Action</button>}>
        <p>Test Content</p>
      </ConfigContent>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test Action' })).toBeInTheDocument();
  });

  it('should apply custom aria-loading label', () => {
    render(<ConfigContent loading={true} ariaLoadingLabel="Custom Loading Label" />);

    expect(screen.getByLabelText('Custom Loading Label')).toBeInTheDocument();
  });

  it('should render without title and actions when not provided', () => {
    render(
      <ConfigContent>
        <p>Test Content</p>
      </ConfigContent>
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render ConfigContent.Section with title and children', () => {
    render(
      <ConfigContent.Section title="Section Title">
        <p>Section Content</p>
      </ConfigContent.Section>
    );

    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText('Section Content')).toBeInTheDocument();
  });

  it('should render ConfigContent.Section without title', () => {
    render(
      <ConfigContent.Section>
        <p>Section Content</p>
      </ConfigContent.Section>
    );

    expect(screen.getByText('Section Content')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
