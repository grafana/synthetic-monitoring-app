import { FieldErrors, FieldPath, FieldValues } from 'react-hook-form';
import { MAX_FREQUENCY_ERROR_MESSAGE_START, MIN_FREQUENCY_ERROR_MESSAGE_START } from 'schemas/general/Frequency';
import { ZodType } from 'zod';

import { Check, CheckFormValues, CheckType, FeatureName } from 'types';

import { isFeatureEnabled } from '../../contexts/FeatureFlagContext';
import { CHECK_FORM_ERROR_EVENT } from '../constants';
import { PROBES_FILTER_ID } from './CheckProbes/ProbesFilter';
import {
  FREQUENCY_INPUT_ID,
  FREQUENCY_MINUTES_INPUT_ID,
  FREQUENCY_SECONDS_INPUT_ID,
} from './FormComponents/Frequency.constants';
import { SCRIPT_TEXTAREA_ID } from './FormComponents/ScriptedCheckScript';
import {
  DEFAULT_FORM_SECTION_ORDER,
  ENTRY_INDEX_CHAR,
  FormSectionName,
  LEGACY_FORM_SECTION_ORDER,
} from './CheckEditor.constants';

export function getIsExistingCheck<T extends Check>(check?: T): check is T & { id: number } {
  return check !== undefined && check.id !== undefined;
}

function isBottomOfPath(obj: any) {
  const keys = Object.keys(obj);

  return keys.every((key) => [`ref`, `message`, `type`].includes(key));
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

export function broadcastFailedSubmission(errs: FieldErrors, source?: `submission` | `collapsible`) {
  requestAnimationFrame(() => {
    document.dispatchEvent(new CustomEvent(CHECK_FORM_ERROR_EVENT, { detail: { errs, source } }));
  });
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

function getFirstInput(errs: FieldErrors<CheckFormValues>) {
  const errKeys = flattenKeys(errs);
  const onPageInputs = document.querySelectorAll(errKeys.map((key) => `[name="${key}"]`).join(','));
  const firstInput = onPageInputs[0];

  if (firstInput) {
    return firstInput;
  }

  return searchForSpecialInputs(errKeys, errs);
}

export function findFieldToFocus(errs: FieldErrors<CheckFormValues>) {
  const fieldToFocus = getFirstInput(errs);

  if (fieldToFocus instanceof HTMLElement) {
    fieldToFocus.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    fieldToFocus.focus();
  }
}

export function checkForErrors<T extends FieldValues>({
  fields = [],
  values,
  schema,
}: {
  values: T;
  fields: Array<FieldPath<T>>;
  schema: ZodType<T>;
}) {
  const result = schema.safeParse(values);

  if (!result.success) {
    const errors = result.error.errors.reduce<string[]>((acc, err) => {
      const path = err.path.map((e) => (typeof e === 'number' ? ENTRY_INDEX_CHAR : e)).join('.');
      const isRelevant = fields.some((f) => path.startsWith(f));

      if (isRelevant) {
        return [...acc, path];
      }

      return acc;
    }, []);
    return {
      errors,
    };
  }

  return {
    errors: [],
  };
}

export function normalizeFlattenedErrors(errors: string[]) {
  return errors.map((error) => {
    if (error.startsWith(`settings.multihttp.entries`)) {
      return error.replace(/\.[0-9]\./, `.${ENTRY_INDEX_CHAR}.`);
    }

    return error;
  });
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

export function getSectionOrder() {
  return isFeatureEnabled(FeatureName.AlertsPerCheck) ? DEFAULT_FORM_SECTION_ORDER : LEGACY_FORM_SECTION_ORDER;
}

type FormSectionMap = Record<FormSectionName, number>;
export function createSectionIndexMap(sectionNames: FormSectionName[]) {
  return sectionNames.reduce<FormSectionMap>((acc, item, index) => {
    acc[item] = index;

    return acc;
  }, {} as FormSectionMap);
}
