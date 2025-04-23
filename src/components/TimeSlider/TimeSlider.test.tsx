import React, { useState } from 'react';
import { screen, within } from '@testing-library/react';
import { render } from 'test/render';

import { SliderProps, TimeSlider } from 'components/TimeSlider/TimeSlider';

type FormWrapperProps = Omit<SliderProps, 'value' | 'onChange' | 'analyticsLabel' | 'ariaLabelForHandle'> & {
  value: number;
};

const ANALYTICS_LABEL = 'test';
const ARIA_LABEL_FOR_HANDLE = 'test';

function FormWrapper(props: FormWrapperProps) {
  const [value, setValue] = useState(props.value);

  return (
    <TimeSlider
      {...props}
      analyticsLabel={ANALYTICS_LABEL}
      ariaLabelForHandle={ARIA_LABEL_FOR_HANDLE}
      value={value}
      onChange={setValue}
    />
  );
}

function renderSliderInput(props: FormWrapperProps) {
  return render(<FormWrapper {...props} />);
}

test('Shows default values', async () => {
  await renderSliderInput({ min: 1, max: 300, value: 120 });
  const [minutesInput, secondsInput] = await getSlider(ANALYTICS_LABEL);
  expect(minutesInput).toHaveValue('2');
  expect(secondsInput).toHaveValue('0');
});

test('defaults to min if no default value is provided', async () => {
  await renderSliderInput({ min: 10, max: 300, value: 10 });
  const [minutes, seconds] = await getSlider(ANALYTICS_LABEL);
  expect(minutes).toHaveValue('0');
  expect(seconds).toHaveValue('10');
});

test('handles seconds over 60 when blurred', async () => {
  const { user } = await renderSliderInput({ min: 1, max: 300, value: 120 });
  const [minutesInput, secondsInput] = await getSlider(ANALYTICS_LABEL);
  await user.type(secondsInput, '70');
  await user.click(document.body);
  expect(secondsInput).toHaveValue('10');
  expect(minutesInput).toHaveValue('3');
});

test('default to max when value too high in minutes', async () => {
  const { user } = await renderSliderInput({ min: 1, max: 300, value: 120 });
  const [minutesInput, secondsInput] = await getSlider(ANALYTICS_LABEL);
  await user.type(minutesInput, '500');
  await user.click(document.body);
  expect(minutesInput).toHaveValue('5');
  expect(secondsInput).toHaveValue('0');
});

test('default to max when value too high in seconds', async () => {
  const { user } = await renderSliderInput({ min: 1, max: 300, value: 120 });
  const [minutesInput, secondsInput] = await getSlider(ANALYTICS_LABEL);
  await user.type(secondsInput, '500');
  await user.click(document.body);
  expect(minutesInput).toHaveValue('5');
  expect(secondsInput).toHaveValue('0');
});

test('handles 0 seconds when blurred', async () => {
  const { user } = await renderSliderInput({ min: 1, max: 300, value: 130 });
  const [minutesInput, secondsInput] = await getSlider(ANALYTICS_LABEL);
  await user.clear(secondsInput);
  await user.type(secondsInput, '0');
  await user.click(document.body);
  expect(minutesInput).toHaveValue('2');
  expect(secondsInput).toHaveValue('0');
});

export const getSlider = async (formName: string) => {
  const container = await screen.findByTestId(formName);
  const minutes = await within(container).findByLabelText('minutes');
  const seconds = await within(container).findByLabelText('seconds');
  return [minutes, seconds];
};
