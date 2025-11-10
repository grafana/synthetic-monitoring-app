// AppContainer.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';

import { AppContainer } from './AppContainer';
import { useAppSplitter } from './AppContainer.hooks';

// Mock the custom hooks
jest.mock('./AppContainer.hooks', () => ({
  useAppSplitter: jest.fn(),
}));

jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  useStyles2: jest.fn(() => ({
    wrapper: 'wrapper-class',
    container: 'container-class',
  })),
}));

const mockSplitterProps = {
  containerProps: { className: 'test-container' },
  primaryProps: {},
  secondaryProps: {},
  splitterProps: {},
};

describe('AppContainer', () => {
  beforeEach(() => {
    (useAppSplitter as jest.Mock).mockReturnValue(mockSplitterProps);
  });

  it('renders children when provided', () => {
    const testText = 'child';

    render(
      <AppContainer>
        <div>{testText}</div>
      </AppContainer>
    );

    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <AppContainer isLoading>
        <div>Test Child</div>
      </AppContainer>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error alert when error is provided', () => {
    const testError = new Error('Test error message');
    render(
      <AppContainer error={testError}>
        <div>Test Child</div>
      </AppContainer>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('displays unknown error when error message is undefined', () => {
    const testError = new Error();
    render(
      <AppContainer error={testError}>
        <div>Test Child</div>
      </AppContainer>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Unknown error')).toBeInTheDocument();
  });

  it('applies correct className to container', () => {
    render(
      <AppContainer>
        <div>Test Child</div>
      </AppContainer>
    );

    const container = screen.getByText('Test Child').parentElement;
    expect(container).toHaveClass('test-container');
    expect(container).toHaveClass('container-class');
  });
});
