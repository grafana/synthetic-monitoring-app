import React, { useMemo, useRef, useState } from 'react';
import { Controller, DeepMap, FieldError, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { OrgRole } from '@grafana/data';
import { config, locationService } from '@grafana/runtime';
import {
  Alert,
  Button,
  ConfirmModal,
  Field,
  HorizontalGroup,
  Input,
  Legend,
  Select,
  useStyles2,
  VerticalGroup,
} from '@grafana/ui';

import { Check, CheckFormValues, CheckPageParams, CheckType } from 'types';
import { hasRole } from 'utils';
import { validateTarget } from 'validation';
import { useChecks, useCUDChecks } from 'data/useChecks';
import { getCheckFromFormValues, getDefaultValuesFromCheck } from 'components/CheckEditor/checkFormTransformations';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckTestButton } from 'components/CheckTestButton';
import { CheckUsage } from 'components/CheckUsage';
import { METHOD_OPTIONS } from 'components/constants';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';
import { LabelField } from 'components/LabelField';
import { PluginPage } from 'components/PluginPage';

import { TabSection } from './Tabs/TabSection';
import { AvailableVariables } from './AvailableVariables';
import { multiHttpFallbackCheck } from './consts';
import { MultiHttpCollapse } from './MultiHttpCollapse';
import { getMultiHttpFormStyles } from './MultiHttpSettingsForm.styles';
import { focusField, getMultiHttpFormErrors, useMultiHttpCollapseState } from './MultiHttpSettingsForm.utils';

export const MultiHttpSettingsForm = () => {
  const { data: checks } = useChecks();
  const { id } = useParams<CheckPageParams>();

  if (id && !checks) {
    return null;
  }

  const check = checks?.find((c) => c.id === Number(id)) ?? multiHttpFallbackCheck;

  return <MultiHttpSettingsFormContent check={check} />;
};

const MultiHttpSettingsFormContent = ({ check }: { check: Check }) => {
  const styles = useStyles2(getMultiHttpFormStyles);
  const panelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { deleteCheck, updateCheck, createCheck, error, submitting } = useCUDChecks({
    eventInfo: { checkType: CheckType.MULTI_HTTP },
  });

  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const [collapseState, dispatchCollapse] = useMultiHttpCollapseState(check);
  const formMethods = useForm<CheckFormValues>({
    defaultValues,
    reValidateMode: 'onBlur',
    shouldFocusError: false /* handle this manually */,
  });

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = formMethods;
  const {
    fields: entryFields,
    append,
    remove,
  } = useFieldArray({
    control: formMethods.control,
    name: 'settings.multihttp.entries',
  });
  const isEditor = hasRole(OrgRole.Editor);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const onSuccess = () => locationService.getHistory().goBack();

  const onSubmit = (checkValues: CheckFormValues) => {
    const toSubmit = getCheckFromFormValues(checkValues, defaultValues, CheckType.MULTI_HTTP);

    if (check.id) {
      return updateCheck(
        {
          id: check.id,
          tenantId: check.tenantId,
          ...toSubmit,
        },
        { onSuccess }
      );
    }

    return createCheck(toSubmit, { onSuccess });
  };

  const onDelete = () => {
    deleteCheck(check, { onSuccess });
  };

  const requests = watch('settings.multihttp.entries') as any[];

  const onError = (errs: DeepMap<CheckFormValues, FieldError>) => {
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

  return (
    <>
      <PluginPage
        pageNav={{
          text: check?.job ? `Editing ${check.job}` : 'Add MULTIHTTP check',
        }}
      >
        {!config.featureToggles.topnav && <Legend>{check?.id ? 'Edit Check' : 'Add MULTIHTTP Check'}</Legend>}
        <Alert severity="info" title="MultiHTTP checks are in public preview">
          We are actively seeking feedback! Please share your thoughts in&nbsp;
          <a
            href="https://github.com/grafana/synthetic-monitoring-app/issues"
            target="_blank"
            rel="noopenner noreferrer"
            className={styles.link}
          >
            GitHub
          </a>
          &nbsp;or in our&nbsp;
          <a
            href="https://community.grafana.com/c/grafanacloud/34"
            rel="noopenner noreferrer"
            target="_blank"
            className={styles.link}
          >
            community forum
          </a>
          .
        </Alert>
        <VerticalGroup>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit, onError)} className={styles.form}>
              <hr className={styles.breakLine} />
              <HorizontalCheckboxField
                disabled={!isEditor}
                name="enabled"
                id="check-form-enabled"
                label="Enabled"
                description="If a check is enabled, metrics and logs are published to your Grafana Cloud stack."
              />
              <Field label="Job name" invalid={Boolean(errors.job)} error={errors.job?.message}>
                <Input
                  {...register('job', {
                    required: 'Job name is required',
                    minLength: 1,
                  })}
                  type="text"
                  id="check-editor-job-input"
                  placeholder="Unnamed request"
                  className={styles.jobNameInput}
                />
              </Field>
              <ProbeOptions
                isEditor={isEditor}
                timeout={check?.timeout ?? multiHttpFallbackCheck.timeout}
                frequency={check?.frequency ?? multiHttpFallbackCheck.frequency}
                checkType={CheckType.MULTI_HTTP}
              />

              <LabelField isEditor={isEditor} />

              <hr />
              <h3>Requests</h3>
              <Field label="At least one target HTTP is required; limit 10 requests per check.">
                <></>
              </Field>
              <div className={styles.request}>
                {entryFields.map((field, index) => {
                  const urlForIndex =
                    watch(`settings.multihttp.entries.${index}.request.url`) || `Request ${index + 1}`;
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
                            error={errors?.settings?.multihttp?.entries?.[index]?.request?.method?.message}
                          >
                            <Controller
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
                <CheckUsage />
                <CheckFormAlert />
                <HorizontalGroup height="40px">
                  <Button type="submit" disabled={formMethods.formState.isSubmitting || submitting}>
                    Save
                  </Button>
                  <CheckTestButton check={check} />
                  {check?.id && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={!isEditor}
                      type="button"
                    >
                      Delete Check
                    </Button>
                  )}
                  <Button onClick={() => locationService.getHistory().goBack()} fill="text">
                    Cancel
                  </Button>
                </HorizontalGroup>
              </div>
            </form>
          </FormProvider>
        </VerticalGroup>
        {error && (
          <div className={styles.submissionError}>
            <Alert title="Save failed" severity="error">
              {error.message ?? 'Something went wrong'}
            </Alert>
          </div>
        )}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete check"
          body="Are you sure you want to delete this check?"
          confirmText="Delete check"
          onConfirm={onDelete}
          onDismiss={() => setShowDeleteModal(false)}
        />
      </PluginPage>
    </>
  );
};
