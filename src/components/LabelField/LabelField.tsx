import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Alert, Button, Field, LoadingPlaceholder, Spinner, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Label } from 'types';
import { FaroEvent, reportEvent } from 'faro';
import { hasRole } from 'utils';
import { ListTenantLimitsResponse } from 'datasource/responses.types';
import { useTenantLimits } from 'data/useTenantLimits';
import { interpolateErrorMessage } from 'components/CheckForm/utils';
import { NameValueInput } from 'components/NameValueInput';

export interface LabelFieldProps {
  labelDestination: 'check' | 'probe';
}

type FormWithLabels = {
  labels: Label[];
};

function getLimit(labelDestination: LabelFieldProps['labelDestination'], limits?: ListTenantLimitsResponse) {
  if (labelDestination === 'probe') {
    return 3;
  }

  if (limits?.maxAllowedMetricLabels) {
    return limits.maxAllowedMetricLabels;
  }

  return 10;
}

function getDescription(labelDestination: LabelFieldProps['labelDestination'], limit: number, logLabelLimit: number) {
  if (labelDestination === 'probe') {
    return `Custom labels to be included with collected metrics and logs. You can add up to ${limit}.`;
  }

  return `Custom labels to be included with collected metrics and logs. You can add up to ${limit}. If you add more than ${logLabelLimit} labels, they will potentially not be used to index logs, and rather added as part of the log message.`;
}

export const LabelField = <T extends FormWithLabels>({ labelDestination }: LabelFieldProps) => {
  const { data: limits, isLoading, error, isRefetching, refetch } = useTenantLimits();
  const { formState } = useFormContext<FormWithLabels>();
  const isEditor = hasRole(OrgRole.Editor);
  const limit = getLimit(labelDestination, limits);
  const description = getDescription(labelDestination, limit, limits?.maxAllowedLogLabels ?? 5);
  const labelError = formState.errors?.labels?.message || formState.errors?.labels?.root?.message;

  return (
    <Field
      label="Labels"
      description={description}
      disabled={!isEditor}
      error={interpolateErrorMessage(labelError, 'label')}
      invalid={Boolean(labelError)}
    >
      {isLoading ? (
        <LoadingPlaceholder text="Loading label limits" />
      ) : (
        <>
          {error ? <LimitsFetchWarning refetch={refetch} isRefetching={isRefetching} error={error} /> : null}
          <NameValueInput
            name="labels"
            disabled={!isEditor}
            label="label"
            limit={limit}
            data-fs-element="Labels input"
          />
        </>
      )}
    </Field>
  );
};

function LimitsFetchWarning({
  refetch,
  isRefetching,
  error,
}: {
  refetch: () => void;
  isRefetching: boolean;
  error: Error;
}) {
  const theme = useTheme2();
  return (
    <Alert severity="warning" title="Couldn't fetch label limits">
      <div className={css({ display: 'flex', gap: theme.spacing(2), alignItems: 'center' })}>
        <span>
          There was an error fetching the label limits for your account. The default minimum limits will be used.
        </span>
        <Button
          onClick={() => {
            reportEvent(FaroEvent.REFETCH_TENANT_LIMITS, { error: error.message });
            refetch();
          }}
          variant="secondary"
          disabled={isRefetching}
        >
          {isRefetching ? <Spinner /> : 'Retry'}
        </Button>
      </div>
    </Alert>
  );
}
