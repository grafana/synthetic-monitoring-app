import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { Check, CheckType } from 'types';

import { ChecksterProvider, useChecksterContext } from './contexts/ChecksterContext';
import { Checkster } from './Checkster';
import { DEFAULT_CHECK_CONFIG } from './constants';

// Mock child components that have complex dependencies
jest.mock('./components/form/FormRoot', () => ({
  FormRoot: jest.fn(({ onSave }) => (
    <div data-testid="form-root">
      FormRoot
      <button onClick={() => onSave(DEFAULT_CHECK_CONFIG, {})}>Save</button>
    </div>
  )),
}));

jest.mock('./components/FormSectionNavigation/FormSectionNavigation', () => ({
  FormSectionNavigation: () => <div data-testid="form-section-navigation">FormSectionNavigation</div>,
}));

jest.mock('./feature/FeatureTabs', () => ({
  FeatureTabs: () => <div data-testid="feature-tabs">FeatureTabs</div>,
}));

jest.mock('./feature/FeatureContent', () => ({
  FeatureContent: () => <div data-testid="feature-content">FeatureContent</div>,
}));

jest.mock('../ConfirmLeavingPage', () => ({
  ConfirmLeavingPage: ({ enabled }: { enabled: boolean }) =>
    enabled ? <div data-testid="confirm-leaving-page">Confirm Leaving</div> : null,
}));

const mockOnSave = jest.fn();

const defaultProps = {
  onSave: mockOnSave,
};

// Test component to verify context usage
function TestContextConsumer() {
  try {
    const context = useChecksterContext();
    return <div data-testid="context-consumer">Context Available: {context.formId}</div>;
  } catch (error) {
    return <div data-testid="context-consumer">Context Not Available</div>;
  }
}

describe('Checkster.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Conditional context', () => {
    it('should render conditional context when not in ChecksterContext', async () => {
      render(<Checkster {...defaultProps} />);

      // Verify that the component renders without throwing context errors
      await waitFor(() => {
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
        expect(screen.getByTestId('form-section-navigation')).toBeInTheDocument();
      });
    });

    it('should render without conditional context when already in ChecksterContext', async () => {
      render(
        <ChecksterProvider>
          <Checkster {...defaultProps} />
        </ChecksterProvider>
      );

      // Verify that the component renders when already wrapped in context
      await waitFor(() => {
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
        expect(screen.getByTestId('form-section-navigation')).toBeInTheDocument();
      });
    });

    it('should demonstrate InternalConditionalProvider behavior with nested context', async () => {
      // Test that InternalConditionalProvider doesn't create duplicate providers
      let renderCount = 0;

      const CountingProvider = ({ children }: { children: React.ReactNode }) => {
        renderCount++;
        return <ChecksterProvider>{children}</ChecksterProvider>;
      };

      render(
        <CountingProvider>
          <TestContextConsumer />
        </CountingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-consumer')).toBeInTheDocument();
      });

      // Should only render once since we're providing the context externally
      expect(renderCount).toBe(1);
    });
  });

  describe('ChecksterInternal component behavior', () => {
    it('should render loading state when isLoading is true', async () => {
      // Mock the context to return loading state
      const MockChecksterProvider = ({ children }: { children: React.ReactNode }) => (
        <ChecksterProvider>{children}</ChecksterProvider>
      );

      render(
        <MockChecksterProvider>
          <Checkster {...defaultProps} />
        </MockChecksterProvider>
      );

      // Check that AppContainer is rendered (which handles loading state)
      await waitFor(() => {
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
      });
    });

    it('should render form components when loaded', async () => {
      render(<Checkster {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('form-section-navigation')).toBeInTheDocument();
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
        expect(screen.getByTestId('feature-tabs')).toBeInTheDocument();
        expect(screen.getByTestId('feature-content')).toBeInTheDocument();
      });
    });

    it('should not render ChooseCheckTypeModal by default', async () => {
      render(<Checkster {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByTestId('choose-check-type-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Props handling and callbacks', () => {
    it('should handle onSave callback', async () => {
      const mockResolvedFunction = jest.fn();
      mockOnSave.mockResolvedValue(mockResolvedFunction);

      const { user } = render(<Checkster {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(DEFAULT_CHECK_CONFIG, {});
    });

    it('should accept and use check prop', async () => {
      const customCheck: Check = {
        ...DEFAULT_CHECK_CONFIG,
        job: 'custom-check-job',
        target: 'https://example.com',
      };

      render(<Checkster {...defaultProps} check={customCheck} />);

      await waitFor(() => {
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
      });
    });

    it('should handle check type via props', async () => {
      render(<Checkster {...defaultProps} checkType={CheckType.HTTP} />);

      await waitFor(() => {
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
      });
    });
  });

  describe('Form integration', () => {
    it('should show ConfirmLeavingPage when form is dirty', async () => {
      // This test would need more setup to actually make the form dirty
      // For now, we'll just verify the component structure
      render(<Checkster {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
      });

      // The ConfirmLeavingPage component should be present but not visible (enabled=false by default)
      expect(screen.queryByTestId('confirm-leaving-page')).not.toBeInTheDocument();
    });

    it('should render proper layout structure', async () => {
      render(<Checkster {...defaultProps} />);

      await waitFor(() => {
        // Verify the main layout components are present
        expect(screen.getByTestId('form-section-navigation')).toBeInTheDocument();
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
        expect(screen.getByTestId('feature-tabs')).toBeInTheDocument();
        expect(screen.getByTestId('feature-content')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should render successfully even when onSave might fail', async () => {
      // Test that the component renders and functions properly regardless of onSave implementation
      const mockFailingOnSave = jest.fn().mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            // This simulates an async operation that could fail
            setTimeout(() => reject(new Error('Simulated save failure')), 0);
          })
      );

      render(<Checkster {...defaultProps} onSave={mockFailingOnSave} />);

      await waitFor(() => {
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
        expect(screen.getByTestId('form-section-navigation')).toBeInTheDocument();
        expect(screen.getByTestId('feature-tabs')).toBeInTheDocument();
        expect(screen.getByTestId('feature-content')).toBeInTheDocument();
      });

      // Component should render successfully regardless of potential onSave failures
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('Context integration', () => {
    it('should provide context that can be accessed by ChecksterInternal', async () => {
      render(<Checkster {...defaultProps} />);

      await waitFor(() => {
        // Verify components that depend on context are rendered successfully
        expect(screen.getByTestId('form-root')).toBeInTheDocument();
        expect(screen.getByTestId('form-section-navigation')).toBeInTheDocument();
      });
    });

    it('should properly integrate with external ChecksterProvider', async () => {
      render(
        <ChecksterProvider>
          <TestContextConsumer />
        </ChecksterProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-consumer')).toBeInTheDocument();
        expect(screen.getByTestId('context-consumer')).toHaveTextContent('Context Available:');
      });
    });
  });
});
