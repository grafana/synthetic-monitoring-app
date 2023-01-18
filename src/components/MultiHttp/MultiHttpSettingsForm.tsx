import React, { useState, useMemo, useContext, useCallback } from 'react';
import { css } from '@emotion/css';
import { FormProvider, useForm, Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import {
  Alert,
  Button,
  Collapse,
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
import { getDefaultValuesFromCheck } from 'components/CheckEditor/checkFormTransformations';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { methodOptions } from 'components/constants';
import { multiHttpFallbackCheck } from './consts';
import { Subheader } from 'components/Subheader';
import { validateTarget } from 'validation';
import CheckTarget from 'components/CheckTarget';
import { RequestTabs } from './Tabs/Tabs';

import { CheckFormValues, Check, CheckPageParams, CheckType } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { trackEvent } from 'analytics';

interface Props {
  isEditor: boolean;
  checks?: Check[];
  onReturn?: (reload: boolean) => void;
}

export const MultiHttpSettingsForm = ({ isEditor, checks, onReturn }: Props) => {
  const [activeTab, setActiveTab] = useState('header');
  const styles = useStyles2(getStyles);
  const [showRequest, setShowRequest] = useState(true);
  const [urls, setUrls] = useState<any[]>([]);
  const [errorMessages, setErrorMessages] = useState([]);

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
      try {
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
      } catch (err) {
        setErrorMessages([err?.data?.err || err?.data?.msg]);
      }
    },
    [api, getValues, onReturn, check.tenantId, check.id]
  );

  const clearAlert = () => {
    setErrorMessages([]);
  };

  const getErrorMessages = () => {
    return (
      <Alert title="DS creation failed" severity="error" onRemove={clearAlert}>
        <>
          {errorMessages.map((ms, index) => {
            return <div key={index}>{ms}</div>;
          })}
        </>
      </Alert>
    );
  };

  return (
    <>
      {errorMessages.length > 0 && getErrorMessages()}

      <hr className={styles.breakLine} />
      <Subheader>Check name</Subheader>
      <Field disabled={!isEditor} invalid={Boolean(errors.job)} error={errors.job?.message}>
        <Input
          {...register('job', {
            required: true,
          })}
          type="text"
          placeholder="Unnamed request"
          className={styles.jobNameInput}
        />
      </Field>
      <ProbeOptions
        {...register('probes' as const, {
          required: true,
        })}
        isEditor={isEditor}
        timeout={check?.timeout ?? multiHttpFallbackCheck.timeout}
        frequency={check?.frequency ?? multiHttpFallbackCheck.frequency}
        probes={[1]} // TODO: FIX THIS
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
                return (
                  <Collapse
                    label={urls.length > 0 && Object.values(urls[index] || {})}
                    key={field.id}
                    onToggle={() => setShowRequest(!showRequest)}
                    isOpen={showRequest}
                    collapsible
                    className={styles.collapseTarget}
                  >
                    <VerticalGroup height={'100%'}>
                      <HorizontalGroup spacing="lg" align="center">
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
                                value={field.value || Object.values(urls[index] || {})}
                                typeOfCheck={selectedCheckType}
                                invalid={Boolean(errors.url)}
                                error={errors.url?.message}
                                disabled={!isEditor}
                                onBlur={(url) => {
                                  if (!urls.find((u, i) => i === index)) {
                                    setUrls([...urls, { [index]: url.target.value }]);
                                  } else {
                                    const filteredChecks = urls.filter((u, i) => i !== index);
                                    setUrls([...filteredChecks, { [index]: url.target.value }]);
                                  }
                                }}
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

                      <TabsBar className={styles.tabsBar}>
                        <Tab
                          label={'Headers'}
                          active={activeTab === 'header'}
                          onChangeTab={() => setActiveTab('header')}
                          default={true}
                          className={styles.tabs}
                        />
                        <Tab
                          className={styles.tabs}
                          label={'Body'}
                          active={activeTab === 'body'}
                          onChangeTab={() => setActiveTab('body')}
                        />
                        <Tab
                          label={'Query Params'}
                          active={activeTab === 'queryParams'}
                          onChangeTab={() => setActiveTab('queryParams')}
                          className={styles.tabs}
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
                    </VerticalGroup>
                  </Collapse>
                );
              })}
              <VerticalGroup>
                <Button
                  type="button"
                  fill="text"
                  size="md"
                  icon="plus"
                  onClick={() => append({})}
                  className={styles.addRequestButton}
                >
                  Add request
                </Button>
                <Button
                  type="button"
                  onClick={(evt, data) => onSubmit(evt, data)}
                  fullWidth={true}
                  className={styles.submitMultiHttpButton}
                  size="lg"
                >
                  Submit
                </Button>
              </VerticalGroup>
            </form>
          </FormProvider>
        </VerticalGroup>
      </div>
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
    align-items: content;
    position: relative;
  `,
  collapseTarget: css`
    width: 90vw;
    background-color: ${theme.colors.background.secondary};
    padding: 10px;
  `,
  jobNameInput: css`
    width: 100%;
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
    width: 100%;
  `,
  tabsBar: css`
    margin-top: -10px;
    width: 100%;

    gap: 30px;
  `,
  tabs: css`
    min-width: 150px;
  `,
  addRequestButton: css`
    margin-bottom: 16px;
  `,
  removeRequestButton: css`
    align-self: auto;
    margin-top: 20px;
  `,
  form: css`
    position: relative;
  `,
  submitMultiHttpButton: css`
    width: 100%;
  `,
});
