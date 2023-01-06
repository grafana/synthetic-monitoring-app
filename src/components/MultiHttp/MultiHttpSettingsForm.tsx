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
  HorizontalGroup,
  VerticalGroup,
  Input,
  Select,
  TextArea,
  useStyles2,
  useTheme2,
  TabsBar,
  TabContent,
  Tab,
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
  const [showHeaders, setShowHeaders] = useState(false);
  const [submittedMultiModalValues, setSubmittedMultiModalValues] = useState();
  const [showMultiHttpList, setShowMultiHttpList] = useState(false);
  const [targetValue, setTargetValue] = useState<URL>();
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const {
    instance: { api },
  } = useContext(InstanceContext);
  const {
    execute: onSubmit,
    error,
    loading: submitting,
  } = useAsyncCallback(async (checkValues: CheckFormValues) => {
    console.log('checkValues', checkValues);

    const updatedCheck = getCheckFromFormValues(checkValues, defaultValues);
    if (check?.id) {
      // trackEvent('editCheckSubmit');
      await api?.updateCheck({
        id: check.id,
        tenantId: check.tenantId,
        ...updatedCheck,
      });
    } else {
      trackEvent('addNewCheckSubmit');
      await api?.addCheck(updatedCheck);
    }
    onReturn(true);
  });
  const [activeTab, setActiveTab] = useState('headers');

  const styles = useStyles2(getStyles);
  let check: Check = fallbackCheck;
  const { id } = useParams<CheckPageParams>();
  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheck;
  }
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const formMethods = useForm<CheckFormValues>({ defaultValues, mode: 'onChange' });
  const selectedCheckType = formMethods.watch('checkType')?.value ?? CheckType.PING;

  const onSubmit = (e: any) => {
    e.preventDefault();
    console.log('e', e);
  };

  // TAB funcs
  const RequestTabs = ({
    activeTab,
    isEditor,
    errors,
    register,
    // field,
    selectCheckType,
    formMethods,
    value,
    onChange,
  }) => {
    const httpEncoded = encodeURI(value);
    const isValidUrl = Boolean(validUrl.isWebUri(httpEncoded));
    console.log('$$$$$$$', value, activeTab);

    switch (activeTab) {
      case 'headers':
        return <HeadersTab isEditor={isEditor} />;
      case 'body':
        return <BodyTab isEditor={isEditor} errors={errors} register={register} />;
      case 'queryParams':
        return isValidUrl ? (
          <QueryParamsTab
            selectedCheckType={selectCheckType}
            formMethods={formMethods}
            isEditor
            value={parseUrl(value)}
            onChange={onChange}
            // onBlur={onBlur}
          />
        ) : (
          <HeadersTab isEditor={isEditor} />
        );
      default:
        return <HeadersTab isEditor={isEditor} />;
      // With this, typescript can help us find all the places where we need to handle a tab having been added
      // return exhaustive(activeTab);
    }
  };

  const QueryParamsTab = ({ selectedCheckType, formMethods, isEditor, value, onChange }) => {
    return (
      <QueryParams
        target={value}
        // onBlur={onBlur}
        onChange={(target: string) => onChange(target)}
        className={css`
          padding-left: 1rem;
          margin-bottom: 1rem;
        `}
        selectedCheckType={selectedCheckType}
      />
    );
  };
  // End Tab funcs

  return (
    <>
      {showMultiHttpList && submittedMultiModalValues && <MultiHttpList https={[submittedMultiModalValues?.target]} />}
      <hr className={styles.breakLine} />
      <Field
        label="Check name"
        disabled={!isEditor}
        invalid={Boolean(formMethods.formState.errors.job)}
        error={formMethods.formState.errors.job?.message}
        required
      >
        <Input
          {...formMethods.register('k6MultiHttpCheckName', {
            required: true,
          })}
          type="text"
          placeholder="Unnamed request"
        />
      </Field>
      <Field
        className={styles.reqMethod}
        label="Request method"
        description="Default HTTP method is GET"
        disabled={!isEditor}
        invalid={Boolean(errors?.settings?.http?.method)}
        error={errors?.settings?.http?.method}
      >
        <Controller
          render={({ field }) => <Select {...field} options={methodOptions} />}
          rules={{ required: true }}
          name="settings.http.method"
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
});

// Additional tabs
const HeadersTab = ({ isEditor }: { isEditor: boolean }) => {
  return (
    <Container>
      <Field label="Request headers" description="The HTTP headers set for the probe.." disabled={!isEditor}>
        <NameValueInput
          name="settings.http.headers"
          disabled={!isEditor}
          label="headers"
          limit={10}
          validateName={validateHTTPHeaderName}
          validateValue={validateHTTPHeaderValue}
        />
      </Field>
    </Container>
  );
};

const BodyTab = ({ isEditor, errors, register }) => {
  return (
    <Field
      label="Request body"
      description="The body of the HTTP request used in probe."
      disabled={!isEditor}
      invalid={Boolean(errors?.settings?.http?.body)}
      error={errors?.settings?.http?.body}
    >
      <TextArea
        id="http-settings-request-body"
        {...register('settings.http.body', { validate: validateHTTPBody })}
        rows={2}
        disabled={!isEditor}
      />
    </Field>
  );
};
