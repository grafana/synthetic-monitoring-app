import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { render } from 'test/render';

import { getSlider } from '../test/utils';
import { SliderInput, SliderInputProps } from './SliderInput';

interface FormWrapperProps extends SliderInputProps {
  defaultValue?: number;
}

function FormWrapper(props: FormWrapperProps) {
  const formMethods = useForm({ defaultValues: { [props.name]: props.defaultValue } });

  return (
    <FormProvider {...formMethods}>
      <SliderInput {...props} />
    </FormProvider>
  );
}

function renderSliderInput(props: FormWrapperProps) {
  return render(<FormWrapper {...props} />);
}

test('Shows default values', async () => {
  await renderSliderInput({ name: 'timeout', min: 1, max: 300, defaultValue: 120 });
  const [minutesInput, secondsInput] = await getSlider('timeout');
  expect(minutesInput).toHaveValue('2');
  expect(secondsInput).toHaveValue('0');
});

test('defaults to min if no default value is provided', async () => {
  await renderSliderInput({ name: 'timeout', min: 10, max: 300 });
  const [minutes, seconds] = await getSlider('timeout');
  expect(minutes).toHaveValue('0');
  expect(seconds).toHaveValue('10');
});

test('handles seconds over 60 when blurred', async () => {
  const { user } = await renderSliderInput({ name: 'timeout', min: 1, max: 300, defaultValue: 120 });
  const [minutesInput, secondsInput] = await getSlider('timeout');
  await user.type(secondsInput, '70');
  await user.click(document.body);
  expect(secondsInput).toHaveValue('10');
  expect(minutesInput).toHaveValue('3');
});

test('default to max when value too high in minutes', async () => {
  const { user } = await renderSliderInput({ name: 'timeout', min: 1, max: 300, defaultValue: 120 });
  const [minutesInput, secondsInput] = await getSlider('timeout');
  await user.type(minutesInput, '500');
  await user.click(document.body);
  expect(minutesInput).toHaveValue('5');
  expect(secondsInput).toHaveValue('0');
});

test('default to max when value too high in seconds', async () => {
  const { user } = await renderSliderInput({ name: 'timeout', min: 1, max: 300, defaultValue: 120 });
  const [minutesInput, secondsInput] = await getSlider('timeout');
  await user.type(secondsInput, '500');
  await user.click(document.body);
  expect(minutesInput).toHaveValue('5');
  expect(secondsInput).toHaveValue('0');
});

test('handles 0 seconds when blurred', async () => {
  const { user } = await renderSliderInput({ name: 'timeout', min: 1, max: 300, defaultValue: 130 });
  const [minutesInput, secondsInput] = await getSlider('timeout');
  await user.clear(secondsInput);
  await user.type(secondsInput, '0');
  await user.click(document.body);
  expect(minutesInput).toHaveValue('2');
  expect(secondsInput).toHaveValue('0');
});
