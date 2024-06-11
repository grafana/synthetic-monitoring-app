import React, { FormEvent, useEffect, useRef } from 'react';
import { FieldErrors, useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues, CheckFormValuesMultiHttp, HttpMethod } from 'types';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';
import { AvailableVariables } from 'components/MultiHttp/AvailableVariables';
import { MultiHttpCollapse } from 'components/MultiHttp/MultiHttpCollapse';
import {
  focusField,
  getMultiHttpFormErrors,
  useMultiHttpCollapseState,
} from 'components/MultiHttp/MultiHttpSettingsForm.utils';

import { HttpRequest } from './HttpRequest';

export const MultiHttpCheckRequests = () => {
  const styles = useStyles2(getStyles);
  const {
    control,
    watch,
    formState: { errors },
    getValues,
  } = useFormContext<CheckFormValuesMultiHttp>();

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
    const onErrorEvent = (e: CustomEvent<FieldErrors<CheckFormValues>>) => {
      const errs = e.detail;
      const res = getMultiHttpFormErrors(errs);

      if (res) {
        dispatchCollapse({
          type: 'updateRequestPanel',
          open: true,
          index: res.index,
          tab: res.tab,
        });

        if (panelRefs.current[res.index]) {
          focusField(panelRefs.current[res.index], res.id);
        }
      }
    };

    document.addEventListener(CHECK_FORM_ERROR_EVENT, onErrorEvent);

    return () => {
      document.removeEventListener(CHECK_FORM_ERROR_EVENT, onErrorEvent);
    };
  }, [dispatchCollapse]);

  const parseQueryParams = (e: FormEvent) => {
    console.log(e);
  };

  return (
    <div>
      {entryFields.map((field, index) => {
        const onRemove =
          index !== 0
            ? () => {
                remove(index);
                dispatchCollapse({ type: 'removeRequest', index });
              }
            : undefined;
        const urlForIndex = watch(`settings.multihttp.entries.${index}.request.url`) || `Request ${index + 1}`;

        return (
          <MultiHttpCollapse
            label={urlForIndex}
            key={field.id}
            data-testid={`multihttp-request-${index}`}
            invalid={Boolean(errors?.settings?.multihttp?.entries?.[index])}
            isOpen={collapseState[index].open}
            onToggle={() => dispatchCollapse({ type: 'toggle', index })}
            ref={(el) => (panelRefs.current[index] = el)}
            onRemove={onRemove}
          >
            <HttpRequest
              fields={{
                target: {
                  name: `settings.multihttp.entries.${index}.request.url`,
                  onChange: parseQueryParams,
                },
                method: {
                  name: `settings.multihttp.entries.${index}.request.method`,
                  'aria-label': `Request target for request ${index + 1}`,
                },
                requestHeaders: {
                  name: `settings.multihttp.entries.${index}.request.headers`,
                },
                requestBody: {
                  name: `settings.multihttp.entries.${index}.request.body.payload`,
                },
                requestContentEncoding: {
                  name: `settings.multihttp.entries.${index}.request.body.contentEncoding`,
                },
                requestContentType: {
                  name: `settings.multihttp.entries.${index}.request.body.contentType`,
                },
              }}
            />
            <AvailableVariables index={index} />
          </MultiHttpCollapse>
        );
      })}

      <Button
        className={styles.addButton}
        type="button"
        size="md"
        icon="plus"
        disabled={requests?.length > 9}
        tooltip={requests?.length > 9 ? 'Maximum of 10 requests per check' : undefined}
        tooltipPlacement="bottom-start"
        onClick={() => {
          append({
            request: { url: ``, method: HttpMethod.GET },
          });
          dispatchCollapse({ type: 'addNewRequest' });
        }}
      >
        Add request
      </Button>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  addButton: css({
    marginTop: theme.spacing(4),
  }),
});
