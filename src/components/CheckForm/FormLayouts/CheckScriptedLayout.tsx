import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesScripted, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ScriptedCheckInstance } from 'components/CheckEditor/FormComponents/ScriptedCheckInstance';
import { ScriptedCheckScript } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { LabelField } from 'components/LabelField';

export const CheckScriptedLayout = () => {
  const styles = useStyles2(getStyles);

  return (
    <FormLayout>
      <FormLayout.Section
        label="General settings"
        fields={[`enabled`, `job`, `target`, `probes`, `frequency`, `timeout`]}
      >
        <CheckEnabled />
        <CheckJobName />
        <ScriptedCheckInstance />
        <ProbeOptions checkType={CheckType.Scripted} />
        <LabelField<CheckFormValuesScripted> labelDestination="check" />
      </FormLayout.Section>
      <FormLayout.Section
        contentClassName={styles.scriptContainer}
        label="Script"
        fields={[`settings.scripted.script`]}
        isOpen
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
