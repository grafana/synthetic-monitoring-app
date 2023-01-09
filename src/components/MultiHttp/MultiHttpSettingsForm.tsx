import React, { useState, useMemo, useContext } from 'react';
import { css } from '@emotion/css';
import { FormProvider, useForm, Controller, useFieldArray, useFormContext } from 'react-hook-form';
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
import { GrafanaTheme2 } from '@grafana/data';
import { getDefaultValuesFromCheck, getCheckFromFormValues } from 'components/CheckEditor/checkFormTransformations';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';
import { PluginPage } from 'components/PluginPage';
import { HorizontalCheckboxField } from '../HorizonalCheckboxField';
import { CHECK_TYPE_OPTIONS, fallbackCheck, methodOptions } from 'components/constants';
import {
  validateJob,
  validateBearerToken,
  validateTarget,
  validateHTTPBody,
  validateHTTPHeaderName,
  validateHTTPHeaderValue /** validateMultiHttp*/,
} from 'validation';
import CheckTarget from 'components/CheckTarget';
import QueryParams from 'components/QueryParams';

import {
  CheckFormValues,
  HttpMethod,
  HttpVersion,
  Check,
  CheckPageParams,
  CheckType,
  HttpRegexValidationType,
  FeatureName,
} from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { NameValueInput } from 'components/NameValueInput';
import { trackEvent, trackException } from 'analytics';
import MultiHttpList from 'components/MultiHttp/MultiHttpList';
import { selectCheckType } from 'components/CheckEditor/testHelpers';
import { parseUrl } from 'utils';

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
  let check: Check = fallbackCheck;
  const { id } = useParams<CheckPageParams>();
  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheck;
  }
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const formMethods = useForm({ defaultValues, mode: 'onChange' });
  const selectedCheckType = watch('checkType')?.value ?? CheckType.MULTI_HTTP;

  // const onSubmit = (data: any, evt) => {
  //   evt.preventDefault();
  //   console.log('girl youre logging data, evt', data, evt, 'getValues', getValues());
  //   // e.preventDefault();
  // };

  // const onError = (error: any) => {
  //   console.log('girl youre logging errors', error, 'getValues', getValues());
  // };

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
          {/* <FormProvider {...formMethods}> */}
          <form onSubmit={onSubmit} /** {formMethods.handleSubmit(onSubmit)} */>
            <Controller
              name="target"
              control={formMethods.control}
              rules={{
                required: true,
                validate: (target) => {
                  // We have to get refetch the check type value from form state in the validation because the value will be stale if we rely on the the .watch method in the render
                  const targetFormValue = formMethods.getValues().checkType;
                  const selectedCheckType = targetFormValue.value as CheckType;
                  return validateTarget(selectedCheckType, target);
                },
              }}
              render={({ field }) => {
                return (
                  <CheckTarget
                    {...field}
                    onBlur={field.onBlur}
                    typeOfCheck={selectedCheckType}
                    invalid={Boolean(formMethods.formState.errors.target)}
                    error={formMethods.formState.errors.target?.message}
                    disabled={!isEditor}
                    setTargetValue={() => setTargetValue}
                  />
                );
              }}
            />
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
                onChangeTab={() => (!formMethods.getValues().target ? null : setActiveTab('queryParams'))}
              />
            </TabsBar>
            <TabContent className={styles.tabsContent}>
              <RequestTabs
                activeTab={activeTab}
                isEditor={isEditor}
                errors
                register={register}
                // field={field}
                selectCheckType={selectCheckType}
                formMethods={formMethods}
                value={formMethods.getValues().target}
                onChange={() => setActiveTab(activeTab)}
              />
            </TabContent>
            <input type="submit" />
            {/* <Button type="submit" variant="secondary" fill="outline" style={{ marginBottom: '22px' }}>
              Add to multi-HTTP targets
            </Button> */}
          </form>
          {/* </FormProvider> */}
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
