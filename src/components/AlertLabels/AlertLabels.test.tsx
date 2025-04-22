import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertLabels } from './AlertLabels';

const Wrapper = ({ canEdit = true }) => {
  const methods = useForm({
    defaultValues: {
      labels: [],
    },
  });

  return (
    <FormProvider {...methods}>
      <AlertLabels canEdit={canEdit} />
    </FormProvider>
  );
};

describe('AlertLabels', () => {
  it('renders correctly when editable', () => {
    render(<Wrapper />);

    expect(screen.getByText('Labels')).toBeInTheDocument();
    expect(screen.getByText('Add label')).toBeInTheDocument();
  });

  it('renders correctly when not editable', () => {
    render(<Wrapper canEdit={false} />);

    expect(screen.getByText('Labels')).toBeInTheDocument();
    expect(screen.queryByText('Add label')).not.toBeInTheDocument();
  });

  it('allows adding and removing labels when editable', async () => {
    render(<Wrapper />);

    // Add a label
    await userEvent.click(screen.getByText('Add label'));

    // Check if input fields are rendered
    expect(screen.getByTestId('alert-labelName-0')).toBeInTheDocument();
    expect(screen.getByTestId('alert-labelValue-0')).toBeInTheDocument();

    // Remove the label
    await userEvent.click(screen.getByText('Delete'));

    // Check if input fields are removed
    expect(screen.queryByTestId('alert-labelName-0')).not.toBeInTheDocument();
    expect(screen.queryByTestId('alert-labelValue-0')).not.toBeInTheDocument();
  });
});
