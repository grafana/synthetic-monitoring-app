import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormTypeLayoutProps, CheckFormValuesMultiHttp, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { MultiHttpCheckRequests } from 'components/CheckEditor/FormComponents/MultiHttpCheckRequests';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';

export const CheckMultiHTTPLayout = ({ formActions, onSubmit, onSubmitError }: CheckFormTypeLayoutProps) => {
  const styles = useStyles2(getStyles);

  return (
    <FormLayout formActions={formActions} onSubmit={onSubmit} onSubmitError={onSubmitError}>
      <FormLayout.Section label="Define check" fields={[`enabled`, `job`, `labels`]} required>
        <CheckEnabled />
        <CheckJobName />
        <LabelField<CheckFormValuesMultiHttp> labelDestination="check" />
      </FormLayout.Section>
      <FormLayout.Section label="Probes" fields={[`probes`, `frequency`, `timeout`]} required>
        <CheckUsage checkType={CheckType.MULTI_HTTP} />
        <ProbeOptions checkType={CheckType.MULTI_HTTP} />
      </FormLayout.Section>
      <FormLayout.Section
        contentClassName={styles.requestsContainer}
        label="Requests"
        fields={[`settings.multihttp.entries`]}
        required
      >
        <div>At least one target HTTP is required; limit 10 requests per check.</div>
        <MultiHttpCheckRequests />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  requestsContainer: css({
    maxWidth: `1200px`,
  }),
});
