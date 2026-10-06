import React, { ReactNode, useCallback, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Alert, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FormSectionName } from '../../../../types';
import { CheckFormValues, FeatureName } from 'types';
import { useProbesWithMetadata } from 'data/useProbes';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';

import { useChecksterContext } from '../../../../contexts/ChecksterContext';

export function GenericProbesSelectField() {
  const styles = useStyles2(getStyles);
  const { checkType, formNavigation, check, isNew } = useChecksterContext();
  const { isEnabled: isVersionManagementEnabled } = useFeatureFlag(FeatureName.VersionManagement);
  const {
    control,
    formState: { disabled, errors },
  } = useFormContext<CheckFormValues>();
  const { data: availableProbes = [] } = useProbesWithMetadata();
  const { field: probesField } = useController({ control, name: 'probes' });
  const deprecatedProbes = availableProbes.filter((probe) => probe.deprecated && probesField.value.includes(probe.id!));
  const omittedProbes = isNew
    ? availableProbes.filter((probe) => probe.deprecated && check?.probes.includes(probe.id!))
    : [];
  const handleProbesChange = useCallback(
    (probes: number[]) => {
      probesField.onChange(probes);
    },
    [probesField]
  );

  const enhancedError: ReactNode | undefined = useMemo(() => {
    const message = errors.probes?.message;
    if (!message || !isVersionManagementEnabled || !message.includes('are not compatible with channel')) {
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
    <>
      {deprecatedProbes.length > 0 && (
        <Alert severity="warning" title="This check uses deprecated probes">
          Choose another location and remove {deprecatedProbes.map((probe) => probe.displayName).join(', ')}.{' '}
          {deprecatedProbes.every((probe) => !isNew && check?.probes.includes(probe.id!))
            ? 'You can still save other changes while existing probe assignments remain.'
            : 'Remove these probes before saving.'}
        </Alert>
      )}
      {omittedProbes.length > 0 && (
        <Alert severity="info" title="Deprecated probes were not copied">
          {omittedProbes.map((probe) => probe.displayName).join(', ')} cannot be added to new checks. Review the probe
          locations before saving.
        </Alert>
      )}
      <ProbeOptions
        checkType={checkType}
        disabled={disabled}
        error={enhancedError}
        errors={errors.probes}
        onlyProbes
        selectedProbes={probesField.value}
        assignedProbes={isNew ? [] : check?.probes}
        onChange={handleProbesChange}
      />
    </>
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
