import React, { useEffect, useRef } from 'react';
import { FieldErrors, useFieldArray, useFormContext } from 'react-hook-form';
import { Button, Field, HorizontalGroup, useStyles2, VerticalGroup } from '@grafana/ui';

import { CheckFormValues, CheckFormValuesMultiHttp, CheckType } from 'types';
import { RequestMethodSelect } from 'components/CheckEditor/FormComponents/RequestMethodSelect';
import { RequestTargetInput } from 'components/CheckEditor/FormComponents/RequestTargetInput';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';
import { LabelField } from 'components/LabelField';
import { AvailableVariables } from 'components/MultiHttp/AvailableVariables';
import { MultiHttpCollapse } from 'components/MultiHttp/MultiHttpCollapse';
import { getMultiHttpFormStyles } from 'components/MultiHttp/MultiHttpSettingsForm.styles';
import {
  focusField,
  getMultiHttpFormErrors,
  useMultiHttpCollapseState,
} from 'components/MultiHttp/MultiHttpSettingsForm.utils';
import { TabSection } from 'components/MultiHttp/Tabs/TabSection';

export const MultiHttpCheckFormFields = () => {
  const {
    control,
    watch,
    formState: { errors },
    getValues,
  } = useFormContext<CheckFormValuesMultiHttp>();

  const styles = useStyles2(getMultiHttpFormStyles);
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

  return (
    <>
      <ProbeOptions checkType={CheckType.MULTI_HTTP} />

      <LabelField<CheckFormValuesMultiHttp> />

      <hr />
      <h3>Requests</h3>
      <Field label="At least one target HTTP is required; limit 10 requests per check.">
        <></>
      </Field>
      <div className={styles.request}>
        {entryFields.map((field, index) => {
          const urlForIndex = watch(`settings.multihttp.entries.${index}.request.url`) || `Request ${index + 1}`;
          return (
            <MultiHttpCollapse
              label={urlForIndex}
              key={field.id}
              className={styles.collapseTarget}
              invalid={Boolean(errors?.settings?.multihttp?.entries?.[index])}
              isOpen={collapseState[index].open}
              onToggle={() => dispatchCollapse({ type: 'toggle', index })}
              ref={(el) => (panelRefs.current[index] = el)}
            >
              <VerticalGroup>
                <HorizontalGroup spacing="lg" align="flex-start">
                  <RequestTargetInput
                    aria-label={`Request target for request ${index + 1}`}
                    checkType={CheckType.MULTI_HTTP}
                    name={`settings.multihttp.entries.${index}.request.url`}
                    id={`request-target-url-${index}`}
                  />
                  <RequestMethodSelect
                    aria-label={`Request method for request ${index + 1}`}
                    name={`settings.multihttp.entries.${index}.request.method`}
                  />
                  {index !== 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        remove(index);
                        dispatchCollapse({ type: 'removeRequest', index });
                      }}
                      className={styles.removeRequestButton}
                    >
                      Remove
                    </Button>
                  )}
                </HorizontalGroup>

                <AvailableVariables index={index} />

                <TabSection
                  index={index}
                  activeTab={collapseState[index].activeTab}
                  onTabClick={(tab) => {
                    dispatchCollapse({ type: 'updateRequestPanel', index, tab });
                  }}
                />
              </VerticalGroup>
            </MultiHttpCollapse>
          );
        })}

        <Button
          type="button"
          fill="text"
          size="md"
          icon="plus"
          disabled={requests?.length > 9}
          tooltip={requests?.length > 9 ? 'Maximum of 10 requests per check' : undefined}
          tooltipPlacement="bottom-start"
          onClick={() => {
            append({});
            dispatchCollapse({ type: 'addNewRequest' });
          }}
          className={styles.addRequestButton}
        >
          Add request
        </Button>
      </div>
    </>
  );
};
