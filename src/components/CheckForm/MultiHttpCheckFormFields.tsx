import React, { useEffect, useRef } from 'react';
import { Controller, FieldErrors, useFieldArray, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Button, Field, HorizontalGroup, Input, Select, useStyles2, VerticalGroup } from '@grafana/ui';

import { CheckFormValues, CheckFormValuesMultiHttp, CheckType, MultiHTTPCheck } from 'types';
import { hasRole } from 'utils';
import { validateTarget } from 'validation';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CHECK_FORM_ERROR_EVENT, METHOD_OPTIONS } from 'components/constants';
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

export const MultiHttpCheckFormFields = ({ check }: { check: MultiHTTPCheck }) => {
  const styles = useStyles2(getMultiHttpFormStyles);
  const panelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [collapseState, dispatchCollapse] = useMultiHttpCollapseState(check);

  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<CheckFormValuesMultiHttp>();
  const {
    fields: entryFields,
    append,
    remove,
  } = useFieldArray<CheckFormValuesMultiHttp>({
    control,
    name: 'settings.multihttp.entries',
  });
  const isEditor = hasRole(OrgRole.Editor);

  const requests = watch('settings.multihttp.entries') as any[];

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
      <ProbeOptions
        isEditor={isEditor}
        timeout={check.timeout}
        frequency={check.frequency}
        checkType={CheckType.MULTI_HTTP}
      />

      <LabelField<CheckFormValuesMultiHttp> isEditor={isEditor} />

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
                  <Field
                    label="Request target"
                    description="Full URL to send request to"
                    invalid={Boolean(errors?.settings?.multihttp?.entries?.[index]?.request?.url)}
                    error={errors?.settings?.multihttp?.entries?.[index]?.request?.url?.message}
                    className={styles.requestTargetInput}
                  >
                    <Input
                      id={`request-target-url-${index}`}
                      {...register(`settings.multihttp.entries.${index}.request.url` as const, {
                        required: 'Request target is required',
                        validate: (url: string) => {
                          const hasVariable = url.includes('${');
                          if (hasVariable) {
                            return undefined;
                          }
                          return validateTarget(CheckType.MULTI_HTTP, url);
                        },
                      })}
                    />
                  </Field>
                  <Field
                    label="Request method"
                    description="The HTTP method used"
                    invalid={Boolean(errors?.settings?.multihttp?.entries?.[index]?.request?.method)}
                    // this is a string
                    error={errors?.settings?.multihttp?.entries?.[index]?.request?.method?.message as unknown as string}
                  >
                    <Controller<CheckFormValuesMultiHttp>
                      name={`settings.multihttp.entries.${index}.request.method`}
                      render={({ field }) => (
                        <Select {...field} options={METHOD_OPTIONS} data-testid="request-method" />
                      )}
                      rules={{ required: 'Request method is required' }}
                    />
                  </Field>
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
