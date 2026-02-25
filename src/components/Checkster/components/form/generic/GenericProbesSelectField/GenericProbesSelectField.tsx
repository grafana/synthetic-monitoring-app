import React, { ReactNode, useCallback, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FormSectionName } from '../../../../types';
import { CheckFormValues, FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';

import { useChecksterContext } from '../../../../contexts/ChecksterContext';

export function GenericProbesSelectField() {
  const styles = useStyles2(getStyles);
  const { checkType, formNavigation } = useChecksterContext();
  const { isEnabled: isVersionManagementEnabled } = useFeatureFlag(FeatureName.VersionManagement);
  const {
    control,
    formState: { disabled, errors },
  } = useFormContext<CheckFormValues>();
  const { field: probesField } = useController({ control, name: 'probes' });
  const handleProbesChange = useCallback(
    (probes: number[]) => {
      probesField.onChange(probes);
    },
    [probesField]
  );

  const enhancedError: ReactNode | undefined = useMemo(() => {
    const message = errors.probes?.message;
    if (!message || !isVersionManagementEnabled) {
      return undefined;
    }

    return (
      <span>
        {message} Please unselect them or{' '}
        <button
          type="button"
          onClick={() => formNavigation.setSectionActive(FormSectionName.Check)}
          className={styles.inlineButton}
        >
          choose a different channel
        </button>
        .
      </span>
    );
  }, [errors.probes?.message, isVersionManagementEnabled, formNavigation, styles.inlineButton]);

  return (
    <ProbeOptions
      checkType={checkType}
      disabled={disabled}
      error={enhancedError}
      errors={errors.probes}
      onlyProbes
      selectedProbes={probesField.value}
      onChange={handleProbesChange}
    />
  );
}

const getStyles = () => ({
  inlineButton: css({
    color: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  }),
});
