import React, { useCallback, useContext, useState, useMemo } from 'react';
import { FormProvider, useForm, Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { trackEvent } from 'analytics';

import { Alert, Button, Field, VerticalGroup, Input, Select, useStyles2, HorizontalGroup } from '@grafana/ui';
import { getDefaultValuesFromCheck } from 'components/CheckEditor/checkFormTransformations';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { methodOptions } from 'components/constants';
import { MultiHttpCollapse } from 'components/MultiHttp/MultiHttpCollapse';
import { getUpdatedCheck, multiHttpFallbackCheck } from './consts';
import { Subheader } from 'components/Subheader';
import { validateTarget } from 'validation';
import CheckTarget from 'components/CheckTarget';
import { TabSection } from './Tabs/TabSection';
import { getMultiHttpFormStyles } from './MultiHttpSettingsForm.styles';
import { CheckFormValues, Check, CheckPageParams, CheckType } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';

interface Props {
  isEditor: boolean;
  checks?: Check[];
  onReturn?: (reload: boolean) => void;
}

export const MultiHttpSettingsForm = ({ isEditor, checks, onReturn }: Props) => {
  const styles = useStyles2(getMultiHttpFormStyles);
  const [urls, setUrls] = useState<any[]>([]);
  const [errorMessages, setErrorMessages] = useState<any[]>();

  const {
    register,
    unregister,
    watch,
    control,
    getValues,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'settings.multihttp.entries',
  });

  let check: Check = multiHttpFallbackCheck;
  const { id } = useParams<CheckPageParams>();
  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? multiHttpFallbackCheck;
  }
  const {
    instance: { api },
  } = useContext(InstanceContext);
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const formMethods = useForm<CheckFormValues>({ defaultValues, mode: 'onChange' });
  const selectedCheckType = watch('checkType')?.value ?? CheckType.MULTI_HTTP;
  const onSubmit = useCallback(async () => {
    try {
      if (check?.id) {
        trackEvent('editCheckSubmit');
        await api?.updateCheck({
          id: check.id,
          tenantId: check.tenantId,
          ...getUpdatedCheck(getValues),
        });
      } else {
        trackEvent('addNewCheckSubmit');
        await api?.addCheck(getUpdatedCheck(getValues));
      }
      onReturn && onReturn(true);
    } catch (err: any) {
      setErrorMessages([err?.data?.err || err?.data?.msg]);
    }
  }, [api, getValues, onReturn, check.tenantId, check.id, setErrorMessages]);

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

  return (
    <>
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
        <VerticalGroup>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              {fields.map((field, index) => {
                const urlForIndex = watch(`settings.multihttp.entries[${index}].request.url`);

                return (
                  <MultiHttpCollapse label={urlForIndex} key={field.id} className={styles.collapseTarget}>
                    <VerticalGroup height={'100%'}>
                      <HorizontalGroup spacing="lg" align="center">
                        <Controller
                          {...register(`settings.multihttp.entries[${index}].request.url`)}
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
                                invalid={Boolean(errors.url)}
                                error={errors.url?.message}
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
                                  options={methodOptions}
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
              <Button
                type="button"
                onClick={onSubmit}
                fullWidth={true}
                className={styles.submitMultiHttpButton}
                size="md"
              >
                Submit
              </Button>
            </form>
          </FormProvider>
        </VerticalGroup>
      </div>
    </>
  );
};
