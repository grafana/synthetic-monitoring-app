import React, { useState, useMemo, useContext, useCallback } from 'react';
import { css } from '@emotion/css';
import { FormProvider, useForm, Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import {
  Button,
  Field,
  VerticalGroup,
  Input,
  Select,
  useStyles2,
  TabsBar,
  TabContent,
  Tab,
  HorizontalGroup,
} from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { getDefaultValuesFromCheck, selectableValueFrom } from 'components/CheckEditor/checkFormTransformations';
import { Collapse } from 'components/Collapse';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { LabelField } from 'components/LabelField';
import { methodOptions } from 'components/constants';
import { multiHttpFallbackCheck } from './consts';
import { validateTarget } from 'validation';
import CheckTarget from 'components/CheckTarget';
import { RequestTabs } from './Tabs/Tabs';

import { CheckFormValues, Check, CheckPageParams, CheckType } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { trackEvent } from 'analytics';
import { selectCheckType } from 'components/CheckEditor/testHelpers';

interface Props {
  isEditor: boolean;
  checks?: Check[];
  onReturn?: (reload: boolean) => void;
}

export const MultiHttpSettingsForm = ({ isEditor, checks, onReturn }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('header');
  const styles = useStyles2(getStyles);

  const {
    register,
    watch,
    control,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'settings.multihttp.entries',
  });
  const {
    instance: { api },
  } = useContext(InstanceContext);

  let check: Check = multiHttpFallbackCheck;
  const { id } = useParams<CheckPageParams>();
  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? multiHttpFallbackCheck;
  }
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const formMethods = useForm<CheckFormValues>({ defaultValues, mode: 'onChange' });
  const selectedCheckType = watch('checkType')?.value ?? CheckType.MULTI_HTTP;

  const onSubmit = useCallback(
    async (evt: any, data: any) => {
      const updatedCheck = {
        alertSensitivity: getValues().alertSensitivity.value,
        basicMetricsOnly: getValues().basicMetricsOnly,
        enabled: getValues().enabled,
        frequency: 120000,
        job: getValues().job,
        settings: { multihttp: getValues().settings.multihttp },
        labels: getValues().labels,
        probes: [1],
        target: getValues().settings.multihttp.entries[0].request.url,
        timeout: 3000,
      };

      if (check?.id) {
        trackEvent('editCheckSubmit');
        await api?.updateCheck({
          id: check.id,
          tenantId: check.tenantId,
          ...updatedCheck,
        });
      } else {
        trackEvent('addNewCheckSubmit');
        await api?.addCheck(updatedCheck);
      }
      onReturn && onReturn(true);
    },
    [api, getValues, onReturn, check.tenantId, check.id]
  );

  return (
    <>
      <hr className={styles.breakLine} />
      <Field label="Check name" disabled={!isEditor} required invalid={Boolean(errors.job)} error={errors.job?.message}>
        <Input
          {...register('job', {
            required: true,
          })}
          type="text"
          placeholder="Unnamed request"
        />
      </Field>

      <hr />
      <h4>Requests</h4>
      <Field label="At least one target HTTP is required. Let's get started.">
        <></>
      </Field>
      <div className={styles.request}>
        <VerticalGroup>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {fields.map(({ id }, index) => {
                return (
                  <div key={id}>
                    <HorizontalGroup>
                      <Controller
                        {...register(`settings.multihttp.entries[${index}].request.url`, {
                          required: true,
                        })}
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
                              onBlur={field.onBlur}
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
                        // disabled={!isEditor}
                        invalid={Boolean(errors?.settings?.http?.method)}
                        error={errors?.settings?.http?.method}
                      >
                        <Controller
                          {...register(`settings.multihttp.entries[${index}].request.method`, {
                            required: true,
                          })}
                          control={control}
                          render={(field) => (
                            <Select {...field} options={methodOptions} onChange={(val) => selectableValueFrom(val)} />
                          )}
                          rules={{ required: true }}
                          defaultValue="GET"
                        />
                      </Field>

                      <button type="button" onClick={() => remove(parseInt(id, 10))}>
                        Remove
                      </button>
                    </HorizontalGroup>

                    <TabsBar className={styles.tabsBar}>
                      <Tab
                        label={'Headers'}
                        active={activeTab === 'header'}
                        onChangeTab={() => setActiveTab('header')}
                        default={true}
                      />
                      <Tab label={'Body'} active={activeTab === 'body'} onChangeTab={() => setActiveTab('body')} />
                      <Tab
                        label={'Query Params'}
                        active={activeTab === 'queryParams'}
                        onChangeTab={() => setActiveTab('queryParams')}
                      />
                    </TabsBar>
                    <TabContent className={styles.tabsContent}>
                      <RequestTabs
                        index={index}
                        activeTab={activeTab}
                        isEditor={isEditor}
                        errors
                        register={register}
                        value={`${getValues().settings.multihttp.entries[`${index}`].request.url}`}
                        onChange={() => setActiveTab(activeTab)}
                      />
                    </TabContent>
                  </div>
                );
              })}
              <Button
                type="button"
                fill="text"
                size="lg"
                icon="plus"
                onClick={() => append({})}
                className={styles.addRequestButton}
              >
                Add a request to Multi-HTTP check
              </Button>
              <ProbeOptions
                {...register('probes' as const, {
                  required: true,
                })}
                isEditor={isEditor}
                timeout={check?.timeout ?? multiHttpFallbackCheck.timeout}
                frequency={check?.frequency ?? multiHttpFallbackCheck.frequency}
                probes={[1]}
              />

              <Button type="button" onClick={(evt, data) => onSubmit(evt, data)}>
                Submit
              </Button>
            </form>
          </FormProvider>
        </VerticalGroup>
      </div>

      <Collapse
        label="Advanced options"
        collapsible={true}
        onToggle={() => setShowAdvanced(!showAdvanced)}
        isOpen={showAdvanced}
      >
        <div
          className={css`
            max-width: 500px;
          `}
        >
          <LabelField isEditor={isEditor} />
        </div>
      </Collapse>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  request: css`
    display: flex;
    flex-direction: column;
    margin-top: 15px;
    justify-content: space-evenly;
    gap: 20px;
    align-self: flex-start;
  `,
  reqMethod: css`
    align-self: flex-start;
  `,
  formBody: css`
    margin-bottom: ${theme.spacing(1, 2)};
  `,
  breakLine: css`
    margin-top: ${theme.spacing('lg')};
  `,
  tabsContent: css`
    min-height: 75px;
    margin-bottom: 15px;
  `,
  tabsBar: css`
    margin-top: -10px;
  `,
  addRequestButton: css`
    margin-bottom: 16px;
  `,
});
