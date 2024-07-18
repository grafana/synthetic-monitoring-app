import { useEffect, useRef } from 'react';
import { FieldErrors } from 'react-hook-form';

import { CheckFormInvalidSubmissionEvent, CheckFormValues } from 'types';
import { RequestFields } from 'components/CheckEditor/CheckEditor.types';
import { flattenKeys } from 'components/CheckForm/checkForm.utils';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';

export interface HandleErrorRef {
  openOptions: () => void;
  goToTab: (index: number) => void;
}

export function useNestedRequestErrors(fields: RequestFields) {
  const handleErrorRef = useRef<HandleErrorRef>(null);

  useEffect(() => {
    const onErrorEvent = (e: CustomEvent<CheckFormInvalidSubmissionEvent>) => {
      const { errs } = e.detail;
      const res = hasNestedErrors(fields, errs);

      if (res.length) {
        requestAnimationFrame(() => {
          handleErrorRef.current?.openOptions();
          handleErrorRef.current?.goToTab(res[0]);
        });
      }
    };

    document.addEventListener(CHECK_FORM_ERROR_EVENT, onErrorEvent);

    return () => {
      document.removeEventListener(CHECK_FORM_ERROR_EVENT, onErrorEvent);
    };
  }, [fields]);

  return { handleErrorRef };
}

function hasNestedErrors(fields: RequestFields, errors: FieldErrors<CheckFormValues>) {
  const errorKeys = flattenKeys(errors);
  const errorFields = fieldsSectionMap(fields, errorKeys);

  return Object.values(errorFields);
}

function fieldsSectionMap(fields: RequestFields, errorKeys: string[]): Record<string, number> {
  return Object.values(fields)
    .filter((field) => field.section !== undefined)
    .reduce((acc, { name, section }) => {
      const matcher = errorKeys.find((error) => error.startsWith(name));

      if (matcher) {
        return {
          ...acc,
          [name]: section,
        };
      }

      return acc;
    }, {});
}
