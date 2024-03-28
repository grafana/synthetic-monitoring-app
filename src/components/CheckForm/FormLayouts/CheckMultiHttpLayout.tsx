import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesMultiHttp, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { MultiHttpCheckRequests } from 'components/CheckEditor/FormComponents/MultiHttpCheckRequests';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { LabelField } from 'components/LabelField';
import { MultiHttpFeedbackAlert } from 'components/MultiHttp/MultiHttpFeedbackAlert';

export const CheckMultiHTTPLayout = () => {
  const styles = useStyles2(getStyles);

  return (
    <FormLayout>
      <MultiHttpFeedbackAlert />
      <FormLayout.Section label="General settings" fields={[`enabled`, `job`, `probes`, `labels`]}>
        <CheckEnabled />
        <CheckJobName />
        <ProbeOptions checkType={CheckType.MULTI_HTTP} />
        <LabelField<CheckFormValuesMultiHttp> />
      </FormLayout.Section>
      <FormLayout.Section
        contentClassName={styles.requestsContainer}
        label="Requests"
        fields={[`settings.multihttp.entries`]}
        isOpen
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
