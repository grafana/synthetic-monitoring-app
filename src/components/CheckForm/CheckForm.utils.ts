import { FieldErrors } from 'react-hook-form';

import { CheckFormValues } from 'types';

export function flattenKeys(errs: FieldErrors<CheckFormValues>) {
  const build: string[] = [];

  Object.entries(errs).forEach(([key, value]) => {
    if (isBottomOfPath(value)) {
      build.push(key);
    } else {
      build.push(...flattenKeys(value).map((subKey) => `${key}.${subKey}`));
    }
  });

  return build;
}

function isBottomOfPath(obj: any) {
  const keys = Object.keys(obj);

  return keys.every((key) => [`ref`, `message`, `type`].includes(key));
}

export function getAdditionalDuration(frequency: number, additionalTimepoints: number) {
  const adjusted = frequency * additionalTimepoints;
  const totalSeconds = Math.floor(adjusted / 1000);
  const wholeMinutes = Math.floor(totalSeconds / 60);

  return wholeMinutes * 60 * 1000;
}
