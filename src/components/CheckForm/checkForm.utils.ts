import { FieldErrors } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { PROBES_SELECT_ID } from 'components/CheckEditor/CheckProbes';
import { SCRIPT_TEXTAREA_ID } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';

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

  return searchForSpecialInputs(errKeys);
}

function searchForSpecialInputs(errKeys: string[] = []) {
  const probes = errKeys.includes(`probes`) && document.querySelector(`#${PROBES_SELECT_ID} input`);
  const script =
    errKeys.includes(`settings.scripted.script`) && document.querySelector(`#${SCRIPT_TEXTAREA_ID} textarea`);

  if (probes) {
    return probes;
  }

  if (script) {
    return script;
  }

  return null;
}
