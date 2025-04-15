import { FieldErrors } from 'react-hook-form';
import { MAX_FREQUENCY_ERROR_MESSAGE_START, MIN_FREQUENCY_ERROR_MESSAGE_START } from 'schemas/general/Frequency';

import { CheckFormValues } from 'types';
import { PROBES_FILTER_ID } from 'components/CheckEditor/CheckProbes/ProbesFilter';
import {
  FREQUENCY_INPUT_ID,
  FREQUENCY_MINUTES_INPUT_ID,
  FREQUENCY_SECONDS_INPUT_ID,
} from 'components/CheckEditor/FormComponents/Frequency.constants';
import { SCRIPT_TEXTAREA_ID } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';

export function checkHasChanges(existing: CheckFormValues, incoming: CheckFormValues) {
  return JSON.stringify(existing) !== JSON.stringify(incoming);
}

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

  if (keys.every((key) => [`ref`, `message`, `type`].includes(key))) {
    return true;
  }

  return false;
}

export function broadcastFailedSubmission(errs: FieldErrors, source?: `submission` | `collapsible`) {
  requestAnimationFrame(() => {
    document.dispatchEvent(new CustomEvent(CHECK_FORM_ERROR_EVENT, { detail: { errs, source } }));
  });
}

export function findFieldToFocus(errs: FieldErrors<CheckFormValues>) {
  const fieldToFocus = getFirstInput(errs);

  if (fieldToFocus instanceof HTMLElement) {
    fieldToFocus.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    fieldToFocus.focus();
  }
}

function getFirstInput(errs: FieldErrors<CheckFormValues>) {
  const errKeys = flattenKeys(errs);
  const onPageInputs = document.querySelectorAll(errKeys.map((key) => `[name="${key}"]`).join(','));
  const firstInput = onPageInputs[0];

  if (firstInput) {
    return firstInput;
  }

  return searchForSpecialInputs(errKeys, errs);
}

function searchForSpecialInputs(errKeys: string[] = [], errs: FieldErrors<CheckFormValues>) {
  const probes = errKeys.includes(`probes`) && document.querySelector(`#${PROBES_FILTER_ID}`);
  const frequency = errKeys.includes(`frequency`) && document.querySelector(`#${FREQUENCY_INPUT_ID}`);
  const script =
    errKeys.includes(`settings.scripted.script`) && document.querySelector(`#${SCRIPT_TEXTAREA_ID} textarea`);

  if (probes) {
    return probes;
  }

  if (frequency) {
    const frequencyError = errs.frequency?.message;

    if (frequencyError?.includes(MIN_FREQUENCY_ERROR_MESSAGE_START)) {
      return document.querySelector(`#${FREQUENCY_SECONDS_INPUT_ID}`);
    }

    if (frequencyError?.includes(MAX_FREQUENCY_ERROR_MESSAGE_START)) {
      return document.querySelector(`#${FREQUENCY_MINUTES_INPUT_ID}`);
    }

    return frequency;
  }

  if (script) {
    return script;
  }

  return null;
}
