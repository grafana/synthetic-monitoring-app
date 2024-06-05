import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormTypeLayoutProps, CheckFormValuesScripted, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ScriptedCheckInstance } from 'components/CheckEditor/FormComponents/ScriptedCheckInstance';
import { ScriptedCheckScript } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';

export const CheckScriptedLayout = ({
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
      onSubmit={onSubmit}
      onSubmitError={onSubmitError}
      errorMessage={errorMessage}
      schema={schema}
    >
      <FormLayout.Section label="Define check" fields={[`enabled`, `job`, `target`]} required>
        <CheckEnabled />
        <CheckJobName />
        <ScriptedCheckInstance />
        <LabelField<CheckFormValuesScripted> labelDestination="check" />
      </FormLayout.Section>
      <FormLayout.Section label="Probes" fields={[`probes`, `frequency`, `timeout`]} required>
        <CheckUsage checkType={CheckType.Scripted} />
        <ProbeOptions checkType={CheckType.Scripted} />
      </FormLayout.Section>
      <FormLayout.Section
        contentClassName={styles.scriptContainer}
        label="Script"
        fields={[`settings.scripted.script`]}
      >
        <ScriptedCheckScript />
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
