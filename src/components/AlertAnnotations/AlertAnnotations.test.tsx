import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertAnnotations } from './AlertAnnotations';

const Wrapper = ({ canEdit = true }) => {
  const methods = useForm({
    defaultValues: {
      annotations: [],
    },
  });

  return (
    <FormProvider {...methods}>
      <AlertAnnotations canEdit={canEdit} />
    </FormProvider>
  );
};

describe('AlertAnnotations', () => {
  it('renders correctly when editable', () => {
    render(<Wrapper />);

    expect(screen.getByText('Annotations')).toBeInTheDocument();
    expect(screen.getByText('Add annotation')).toBeInTheDocument();
  });

  it('renders correctly when not editable', () => {
    render(<Wrapper canEdit={false} />);

    expect(screen.getByText('Annotations')).toBeInTheDocument();
    expect(screen.queryByText('Add annotation')).not.toBeInTheDocument();
  });

  it('allows adding and removing annotations when editable', async () => {
    render(<Wrapper />);

    // Add an annotation
    await userEvent.click(screen.getByText('Add annotation'));

    // Check if input fields are rendered
    expect(screen.getByTestId('alert-annotationName-0')).toBeInTheDocument();
    expect(screen.getByTestId('alert-annotationValue-0')).toBeInTheDocument();

    // Remove the annotation
    await userEvent.click(screen.getByText('Delete'));

    // Check if input fields are removed
    expect(screen.queryByTestId('alert-annotationName-0')).not.toBeInTheDocument();
    expect(screen.queryByTestId('alert-annotationValue-0')).not.toBeInTheDocument();
  });
});
