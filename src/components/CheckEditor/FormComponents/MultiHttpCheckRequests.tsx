import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { HttpRequestFields } from '../CheckEditor.types';
import { CheckFormInvalidSubmissionEvent, CheckFormValuesMultiHttp, HttpMethod } from 'types';
import { useNestedRequestErrors } from 'hooks/useNestedRequestErrors';
import { broadcastFailedSubmission, flattenKeys } from 'components/CheckForm/checkForm.hooks';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';
import { ENTRY_INDEX_CHAR } from 'components/CheckForm/FormLayout/formlayout.utils';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';
import { Indent } from 'components/Indent';
import { AvailableVariables } from 'components/MultiHttp/AvailableVariables';
import { MultiHttpCollapse } from 'components/MultiHttp/MultiHttpCollapse';
import { getMultiHttpFormErrors, useMultiHttpCollapseState } from 'components/MultiHttp/MultiHttpSettingsForm.utils';

import { HttpRequest } from './HttpRequest';
import { MultiHttpVariables } from './MultiHttpVariables';

export const MULTI_HTTP_REQUEST_FIELDS: HttpRequestFields = {
  target: {
    name: `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.request.url`,
  },
  method: {
    name: `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.request.method`,
  },
  requestHeaders: {
    name: `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.request.headers`,
    section: 0,
  },
  queryParams: {
    name: `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.request.queryFields`,
    section: 1,
  },
  requestBody: {
    name: `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.request.body.payload`,
    section: 2,
  },
  requestContentEncoding: {
    name: `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.request.body.contentEncoding`,
    section: 2,
  },
  requestContentType: {
    name: `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.request.body.contentType`,
    section: 2,
  },
};

export const MultiHttpCheckRequests = () => {
  const styles = useStyles2(getStyles);
  const {
    control,
    watch,
    formState: { errors },
    getValues,
  } = useFormContext<CheckFormValuesMultiHttp>();
  const { isFormDisabled } = useCheckFormContext();

  const panelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [collapseState, dispatchCollapse] = useMultiHttpCollapseState(getValues());

  const {
    fields: entryFields,
    append,
    remove,
  } = useFieldArray<CheckFormValuesMultiHttp>({
    control,
    name: 'settings.multihttp.entries',
  });
  const requests = watch('settings.multihttp.entries');

  useEffect(() => {
    const openRequest = (e: CustomEvent<CheckFormInvalidSubmissionEvent>) => {
      const { errs, source } = e.detail;
      const res = getMultiHttpFormErrors(errs);

      if (res !== null) {
        dispatchCollapse({
          type: 'openRequestPanels',
          indexes: res,
        });

        if (source !== `collapsible`) {
          broadcastFailedSubmission(errs, `collapsible`);
        }
      }
    };

    document.addEventListener(CHECK_FORM_ERROR_EVENT, openRequest);

    return () => {
      document.removeEventListener(CHECK_FORM_ERROR_EVENT, openRequest);
    };
  }, [dispatchCollapse]);

  return (
    <Stack direction={`column`} gap={1}>
      {entryFields.map((field, index) => {
        const onRemove =
          index !== 0
            ? () => {
                remove(index);
                dispatchCollapse({ type: 'removeRequest', index });
              }
            : undefined;
        const requestMethod = watch(`settings.multihttp.entries.${index}.request.method`);
        const urlForIndex = watch(`settings.multihttp.entries.${index}.request.url`) || `Request ${index + 1}`;

        return (
          <MultiHttpCollapse
            label={urlForIndex}
            key={field.id}
            data-testid={`${DataTestIds.MULTI_HTTP_REQUEST}-${index}`}
            invalid={Boolean(errors?.settings?.multihttp?.entries?.[index])}
            isOpen={collapseState[index].open}
            onToggle={() => dispatchCollapse({ type: 'toggle', index })}
            ref={(el) => (panelRefs.current[index] = el)}
            onRemove={onRemove}
            requestMethod={requestMethod}
          >
            <Stack direction={`column`}>
              <AvailableVariables index={index} />
              <MultiHttpRequest index={index} />
              <SetVariables index={index} />
            </Stack>
          </MultiHttpCollapse>
        );
      })}

      <div>
        <Button
          className={styles.addButton}
          disabled={requests?.length > 9 || isFormDisabled}
          icon="plus"
          onClick={() => {
            append({
              request: { url: ``, method: HttpMethod.GET },
            });
            dispatchCollapse({ type: 'addNewRequest' });
          }}
          size="md"
          tooltip={requests?.length > 9 ? 'Maximum of 10 requests per check' : undefined}
          tooltipPlacement="bottom-start"
          type="button"
        >
          Add request
        </Button>
      </div>
    </Stack>
  );
};

const MultiHttpRequest = ({ index }: { index: number }) => {
  const { isFormDisabled, supportingContent } = useCheckFormContext();
  const { addRequest } = supportingContent;

  const fields = useMemo(
    () =>
      Object.entries(MULTI_HTTP_REQUEST_FIELDS).reduce<HttpRequestFields>((acc, field) => {
        const [key, value] = field;

        return {
          ...acc,
          [key]: {
            ...value,
            name: value.name.replace(ENTRY_INDEX_CHAR, index.toString()),
          },
        };
      }, MULTI_HTTP_REQUEST_FIELDS),
    [index]
  );

  const onTest = useCallback(() => {
    addRequest(fields);
  }, [addRequest, fields]);

  const { handleErrorRef } = useNestedRequestErrors(fields);

  return (
    <HttpRequest
      disabled={isFormDisabled}
      fields={{
        ...fields,
        target: {
          ...fields.target,
          'aria-label': `Request target for request ${index + 1} *`,
        },
        method: {
          ...fields.method,
          'aria-label': `Request method for request ${index + 1} *`,
        },
      }}
      onTest={onTest}
      ref={handleErrorRef}
    />
  );
};

MultiHttpRequest.displayName = 'MultiHttpRequest';

const SetVariables = ({ index }: { index: number }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleErrorEvent = (event: CustomEvent<CheckFormInvalidSubmissionEvent>) => {
      const { errs } = event.detail;
      const errorKeys = flattenKeys(errs);

      if (errorKeys.some((key) => key.startsWith(`settings.multihttp.entries.${index}.variables`))) {
        setOpen(true);
      }
    };

    document.addEventListener(CHECK_FORM_ERROR_EVENT, handleErrorEvent);

    return () => {
      document.removeEventListener(CHECK_FORM_ERROR_EVENT, handleErrorEvent);
    };
  }, [index]);

  return (
    <Stack direction={`column`}>
      <div>
        <Button onClick={() => setOpen((v) => !v)} type="button" fill="text" icon={open ? `arrow-down` : `arrow-right`}>
          Set variables
        </Button>
      </div>
      {open && (
        <Indent>
          <MultiHttpVariables index={index} />
        </Indent>
      )}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  addButton: css({
    marginTop: theme.spacing(4),
  }),
});
