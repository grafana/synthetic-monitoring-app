import React, { useContext, useState, useMemo, useCallback } from 'react';
import { FormProvider, useForm, Controller, useFieldArray, FieldValues } from 'react-hook-form';
import { useParams, useHistory } from 'react-router-dom';
import { trackEvent } from 'analytics';

import { Alert, Button, Field, VerticalGroup, Input, Select, useStyles2, Legend, HorizontalGroup } from '@grafana/ui';
import { getDefaultValuesFromCheck, getCheckFromFormValues } from 'components/CheckEditor/checkFormTransformations';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { METHOD_OPTIONS } from 'components/constants';
import { MultiHttpCollapse } from 'components/MultiHttp/MultiHttpCollapse';
import { multiHttpFallbackCheck } from './consts';
import { Subheader } from 'components/Subheader';
import { validateTarget } from 'validation';
import CheckTarget from 'components/CheckTarget';
import { TabSection } from './Tabs/TabSection';
import { getMultiHttpFormStyles } from './MultiHttpSettingsForm.styles';
import { CheckFormValues, Check, CheckPageParams, CheckType } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { PluginPage } from 'components/PluginPage';
import { config } from '@grafana/runtime';

interface Props {
  isEditor?: boolean;
  checks?: Check[];
  onReturn?: (reload: boolean) => void;
}

export const MultiHttpSettingsForm = ({ isEditor = true, checks, onReturn }: Props) => {
  const styles = useStyles2(getMultiHttpFormStyles);
  const [urls, setUrls] = useState<any[]>([]);
  const [errorMessages, setErrorMessages] = useState<any[]>();
  const history = useHistory();
  let check: Check = multiHttpFallbackCheck;
  const { id } = useParams<CheckPageParams>();
  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? multiHttpFallbackCheck;
  }
  const {
    instance: { api },
  } = useContext(InstanceContext);
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const {
    register,
    unregister,
    watch,
    control,
    getValues,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<CheckFormValues | FieldValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'settings.multihttp.entries',
  });

  const formMethods = useForm<CheckFormValues | FieldValues>({ defaultValues, mode: 'onChange' });
  const selectedCheckType = CheckType.MULTI_HTTP;
  const onSubmit = useCallback(async () => {
    const checkValues = getValues() as CheckFormValues;
    const updatedCheck = getCheckFromFormValues(checkValues, defaultValues);
    // All other types of SM checks so far require a `target` to execute, at the root of the submitted object.
    // This is not the case for multihttp checks, whose targets are called `url`s and are nested under
    // `settings.multihttp?.entries[0].request.url`. Yet, the BE still requires a root-level `target`, even in
    // the case of multihttp, even though it wont be used. So we will pass this safety `target`.
    const updatedCheckWithTempTarget = {
      ...updatedCheck,
      target: getValues().settings.multihttp?.entries[0].request.url, // TODO: delete, if BE is updated to no longer need this
    } as Check;

    try {
      if (check?.id) {
        trackEvent('editCheckSubmit');
        await api?.updateCheck({
          id: check.id,
          tenantId: check.tenantId,
          ...updatedCheckWithTempTarget,
        });
      } else {
        trackEvent('addNewCheckSubmit');
        await api?.addCheck(updatedCheckWithTempTarget);
      }
      onReturn && onReturn(true);
    } catch (err: any) {
      setErrorMessages([err?.data?.err || err?.data?.msg]);
    }
  }, [api, getValues, onReturn, check.tenantId, check.id, setErrorMessages, defaultValues]);

  const clearAlert = () => {
    setErrorMessages([]);
  };

  const getErrorMessages = () => {
    return (
      errorMessages && (
        <Alert title="Multi-http request creation failed" severity="error" onRemove={clearAlert}>
          <>
            {errorMessages.map((ms, index) => {
              return <div key={index}>{ms}</div>;
            })}
          </>
        </Alert>
      )
    );
  };

  React.useEffect(() => {
    history.location.state && setValue('checkType', history.location.state);
  }, [history, setValue]);

  return (
    <>
      <PluginPage pageNav={{ text: check?.job ? check.job : 'Add check', description: 'Check configuration' }}>
        {!config.featureToggles.topnav && <Legend>{check?.id ? 'Edit Check' : 'Add Check'}</Legend>}
        <VerticalGroup>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <hr className={styles.breakLine} />
              <Subheader>Check job name</Subheader>
              <Field disabled={!isEditor} invalid={Boolean(errors.job)} error={errors.job?.message}>
                <Input
                  {...register('job', {
                    required: true,
                    minLength: 1,
                  })}
                  type="text"
                  placeholder="Unnamed request"
                  className={styles.jobNameInput}
                />
              </Field>
              <ProbeOptions
                {...register('probes' as const, {
                  required: true,
                  minLength: 1,
                })}
                isEditor={isEditor}
                timeout={check?.timeout ?? multiHttpFallbackCheck.timeout}
                frequency={check?.frequency ?? multiHttpFallbackCheck.frequency}
                probes={check?.probes ?? multiHttpFallbackCheck.probes}
              />

              <hr />
              <h3>Requests</h3>
              <Field label="At least one target HTTP is required. Let's get started.">
                <></>
              </Field>
              <div className={styles.request}>
                {fields.map((field, index) => {
                  const urlForIndex = watch(`settings.multihttp.entries[${index}].request.url`);

                  return (
                    <MultiHttpCollapse label={urlForIndex} key={field.id} className={styles.collapseTarget}>
                      <VerticalGroup height={'100%'}>
                        <HorizontalGroup spacing="lg" align="center">
                          <Controller
                            name={`settings.multihttp.entries[${index}].request.url` as const}
                            control={control}
                            rules={{
                              required: true,
                              validate: (url) => {
                                // We have to get refetch the check type value from form state in the validation because the value will be stale if we rely on the the .watch method in the render
                                const targetFormValue = getValues().checkType;
                                const selectedCheckType = targetFormValue.value as CheckType;
                                return validateTarget(selectedCheckType, url);
                              },
                            }}
                            render={({ field }) => {
                              return (
                                <CheckTarget
                                  {...field}
                                  value={field.value || Object.values(urls[index] || {})}
                                  typeOfCheck={selectedCheckType}
                                  invalid={Boolean(errors?.settings?.multihttp?.entries[index]?.request?.url)}
                                  error={errors?.settings?.multihttp?.entries[index]?.request?.url?.message}
                                  disabled={!isEditor}
                                />
                              );
                            }}
                          />
                          <Field
                            label="Request method"
                            description="The HTTP method used"
                            disabled={!isEditor}
                            invalid={Boolean(errors?.settings?.http?.method)}
                            error={errors?.settings?.http?.method}
                          >
                            <Controller
                              control={control}
                              render={({ field: { onChange, value } }) => {
                                return (
                                  <Select
                                    {...field}
                                    options={METHOD_OPTIONS}
                                    onChange={(val) => onChange(val.value)}
                                    value={value}
                                  />
                                );
                              }}
                              rules={{ required: true }}
                              name={`settings.multihttp.entries[${index}].request.method`}
                            />
                          </Field>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setUrls(urls.filter((url, i) => i !== index));
                              remove(index);
                            }}
                            className={styles.removeRequestButton}
                          >
                            Remove
                          </Button>
                        </HorizontalGroup>

                        <TabSection
                          key={index}
                          isEditor={isEditor}
                          errors={errors}
                          register={register}
                          unregister={unregister}
                          index={index}
                          trigger={trigger}
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
                  onClick={() => {
                    append({});
                  }}
                  className={styles.addRequestButton}
                >
                  Add request
                </Button>

                {errorMessages && errorMessages?.length > 0 && getErrorMessages()}
                <Button onClick={onSubmit} fullWidth={true} className={styles.submitMultiHttpButton} size="md">
                  Submit
                </Button>
              </div>
            </form>
          </FormProvider>
        </VerticalGroup>
      </PluginPage>
    </>
  );
};
