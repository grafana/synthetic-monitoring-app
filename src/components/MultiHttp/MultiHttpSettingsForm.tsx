import React, { useState, useMemo, useContext, useCallback } from 'react';
import { isString } from 'lodash';
import { css } from '@emotion/css';
import {
  FormProvider,
  useForm,
  Controller,
  useFieldArray,
  useFormContext,
  UseFormRegister,
  FieldValues,
} from 'react-hook-form';
import { useAsyncCallback } from 'react-async-hook';
import { useParams } from 'react-router-dom';
import validUrl from 'valid-url';

import {
  Button,
  Container,
  Field,
  VerticalGroup,
  Input,
  Select,
  TextArea,
  useStyles2,
  TabsBar,
  TabContent,
  Tab,
  HorizontalGroup,
} from '@grafana/ui';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { config } from '@grafana/runtime';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  getDefaultValuesFromCheck,
  selectableValueFrom,
  getCheckFromFormValues,
} from 'components/CheckEditor/checkFormTransformations';
import { Collapse } from 'components/Collapse';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { LabelField } from 'components/LabelField';
import { PluginPage } from 'components/PluginPage';
import { CHECK_TYPE_OPTIONS, methodOptions } from 'components/constants';
import { multiHttpFallbackCheck } from './consts';
import {
  // validateJob,
  // validateBearerToken,
  validateTarget,
  validateHTTPBody,
  validateHTTPHeaderName,
  validateHTTPHeaderValue /** validateMultiHttp*/,
} from 'validation';
import CheckTarget from 'components/CheckTarget';
import QueryParams from 'components/QueryParams';
import { BodyTab, HeadersTab, RequestTabs } from './Tabs/Tabs';

import {
  CheckFormValues,
  // HttpMethod,
  // HttpVersion,
  Check,
  CheckPageParams,
  CheckType,
  // HttpRegexValidationType,
  // FeatureName,
} from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { NameValueInput } from 'components/NameValueInput';
import { trackEvent, trackException } from 'analytics';
import { selectCheckType } from 'components/CheckEditor/testHelpers';

interface Props {
  isEditor: boolean;
  checks?: Check[];
  onReturn?: (reload: boolean) => void;
}

export const MultiHttpSettingsForm = ({ isEditor, checks, onReturn }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetValue, setTargetValue] = useState<URL>();
  const [activeTab, setActiveTab] = useState('headers');
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
      <Field
        label="Check name"
        disabled={!isEditor}
        required /** invalid={Boolean(errors.job)} error={errors.job?.message}*/
      >
        <Input
          {...register('job', {
            required: true,
          })}
          type="text"
          placeholder="Unnamed request"
        />
      </Field>

      {/* Individual targets */}
      <hr />
      <h4>Requests</h4>
      <Field label="At least one target HTTP is required. Let's get started.">
        <></>
      </Field>
      <div className={styles.request}>
        <VerticalGroup>
          <FormProvider {...formMethods}>
            {/* <form onSubmit={handleSubmit((data, evt) => onSubmit(data, evt), onError)}> */}
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
                              // invalid={Boolean(errors.url)}
                              // error={errors.url?.message}
                              disabled={!isEditor}
                            />
                          );
                        }}
                      />
                      <Field
                        label="Request method"
                        description="The HTTP method used"
                        // disabled={!isEditor}
                        // invalid={Boolean(errors?.settings?.http?.method)}
                        // error={errors?.settings?.http?.method}
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
                        active={activeTab === 'headers'}
                        onChangeTab={() => setActiveTab('headers')}
                        default={true}
                      />
                      <Tab label={'Body'} active={activeTab === 'body'} onChangeTab={() => setActiveTab('body')} />
                      <Tab
                        label={'Query Params'}
                        active={activeTab === 'queryParams'}
                        onChangeTab={() => (!getValues().target ? null : setActiveTab('queryParams'))}
                      />
                    </TabsBar>
                    <TabContent className={styles.tabsContent}>
                      <RequestTabs
                        index={index}
                        activeTab={activeTab}
                        isEditor={isEditor}
                        errors
                        register={register}
                        selectCheckType={selectCheckType}
                        formMethods={formMethods}
                        value={getValues().target}
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
  `,
  tabsBar: css`
    margin-top: -10px;
  `,
  addRequestButton: css`
    margin-bottom: 16px;
  `,
});
