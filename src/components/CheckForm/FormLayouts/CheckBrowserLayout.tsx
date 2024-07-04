import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormTypeLayoutProps, CheckFormValuesBrowser, CheckType } from 'types';
import { BrowserCheckInstance } from 'components/CheckEditor/FormComponents/BrowserCheckInstance';
import { BrowserCheckScript } from 'components/CheckEditor/FormComponents/BrowserCheckScript';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';

export const CheckBrowserLayout = ({
  formActions,
  onSubmit,
  onSubmitError,
  errorMessage,
  schema,
}: CheckFormTypeLayoutProps) => {
  const styles = useStyles2(getStyles);

  return (
    <FormLayout
      formActions={formActions}
      onSubmit={(...rest) => {
        console.log(`onSubmit`);
        onSubmit(...rest);
      }}
      onSubmitError={onSubmitError}
      errorMessage={errorMessage}
      schema={schema}
    >
      <FormLayout.Section label="Define check" fields={[`enabled`, `job`, `target`]} required>
        <CheckEnabled />
        <CheckJobName />
        <BrowserCheckInstance />
        <LabelField<CheckFormValuesBrowser> labelDestination="check" />
      </FormLayout.Section>
      <FormLayout.Section label="Probes" fields={[`probes`, `frequency`, `timeout`]} required>
        <CheckUsage checkType={CheckType.Browser} />
        <ProbeOptions checkType={CheckType.Browser} />
      </FormLayout.Section>
      <FormLayout.Section contentClassName={styles.scriptContainer} label="Script" fields={[`settings.browser.script`]}>
        <BrowserCheckScript />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  scriptContainer: css({
    maxWidth: `1200px`,
  }),
});
