import React from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { getDataSourceSrv } from '@grafana/runtime';
import { Alert, Button, Field, Input } from '@grafana/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodType } from 'zod';

import { DEFAULT_SM_DS_NAME } from 'data/useSMSetup';
import { useAppInitializer } from 'hooks/useAppInitializer';
import { DatasourceSelector } from 'components/AppInitializer/DatasourceSelector';

interface SetupModalContentProps {
  logsUid?: string;
  metricsUid?: string;
  logsError?: Error;
  metricsError?: Error;
  onSuccess: () => void;
}

interface AppSetupFormValues {
  logsDSUid: string;
  metricsDSUid: string;
  SMDSName: string;
}

const schema: ZodType<AppSetupFormValues> = z.object({
  logsDSUid: z.string().min(1, { message: `Logs Datasource is required` }),
  metricsDSUid: z.string().min(1, { message: `Metrics Datasource is required` }),
  SMDSName: z.string().min(1, { message: `Synthetic Datasource Name is required` }),
});

export const AppSetupForm = ({ logsError, logsUid, metricsError, metricsUid, onSuccess }: SetupModalContentProps) => {
  const { initialize, isLoading, error } = useAppInitializer(onSuccess);
  const formMethods = useForm<AppSetupFormValues>({
    defaultValues: {
      logsDSUid: logsUid || ``,
      metricsDSUid: metricsUid || ``,
      SMDSName: DEFAULT_SM_DS_NAME,
    },
    resolver: zodResolver(schema),
  });
  const options = getDataSourceSrv().getList();

  const handleValid = (values: AppSetupFormValues) => {
    const { logsDSUid, metricsDSUid, SMDSName } = values;
    initialize(logsDSUid, metricsDSUid, SMDSName);
  };

  const fieldNameError = formMethods.formState.errors.SMDSName?.message;
  const fieldLogsError = formMethods.formState.errors.logsDSUid?.message;
  const fieldMetricsError = formMethods.formState.errors.metricsDSUid?.message;

  return (
    <FormProvider {...formMethods}>
      <Field label={`Synthetic Datasource Name`} invalid={Boolean(fieldNameError)} error={fieldNameError}>
        <Input {...formMethods.register(`SMDSName`)} />
      </Field>
      <Controller
        render={({ field }) => (
          <DatasourceSelector
            {...field}
            formError={fieldMetricsError}
            globalError={metricsError}
            options={options.filter((ds) => ds.type === `prometheus`)}
            title={`Metrics Datasource`}
          />
        )}
        name={`metricsDSUid`}
      />
      <Controller
        render={({ field }) => (
          <DatasourceSelector
            {...field}
            formError={fieldLogsError}
            globalError={logsError}
            options={options.filter((ds) => ds.type === `loki`)}
            title={`Logs Datasource`}
          />
        )}
        name={`logsDSUid`}
      />
      <Button
        disabled={isLoading}
        onClick={formMethods.handleSubmit(handleValid)}
        icon={isLoading ? `fa fa-spinner` : undefined}
      >
        Create
      </Button>
      {error && (
        <Alert title={error.name} severity={`error`}>
          {error.message}
        </Alert>
      )}
    </FormProvider>
  );
};
