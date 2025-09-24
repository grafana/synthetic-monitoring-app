import { FieldErrors } from 'react-hook-form';
import { MAX_FREQUENCY_ERROR_MESSAGE_START, MIN_FREQUENCY_ERROR_MESSAGE_START } from 'schemas/general/Frequency';

import { Check, CheckFormValues, CheckType } from 'types';

import { PROBES_FILTER_ID } from '../CheckEditor/CheckProbes/ProbesFilter';
import {
  FREQUENCY_INPUT_ID,
  FREQUENCY_MINUTES_INPUT_ID,
  FREQUENCY_SECONDS_INPUT_ID,
} from '../CheckEditor/FormComponents/Frequency.constants';
import { SCRIPT_TEXTAREA_ID } from '../CheckEditor/FormComponents/ScriptedCheckScript';
import { CHECK_FORM_ERROR_EVENT } from '../constants';

export function getIsExistingCheck<T extends Check>(check?: T): check is T & { id: number } {
  return check !== undefined && check.id !== undefined;
}

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

  return keys.every((key) => [`ref`, `message`, `type`].includes(key));
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

export function getStep1Label(checkType: CheckType): string {
  switch (checkType) {
    case CheckType.Scripted:
    case CheckType.Browser:
      return `Script`;
    case CheckType.MULTI_HTTP:
      return `Requests`;
    default:
      return `Request`;
  }
}

export function getAdditionalDuration(frequency: number, additionalTimepoints: number) {
  const adjusted = frequency * additionalTimepoints;
  const totalSeconds = Math.floor(adjusted / 1000);
  const wholeMinutes = Math.floor(totalSeconds / 60);

  return wholeMinutes * 60 * 1000;
}
