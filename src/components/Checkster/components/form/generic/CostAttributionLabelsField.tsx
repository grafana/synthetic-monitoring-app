import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { useAppPluginInstalled } from '@grafana/runtime';
import { IconButton, Input, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { KG_NAMESPACE_LABEL, KG_PLUGIN_ID, KG_SERVICE_NAME_LABEL } from 'features/knowledgeGraph/knowledgeGraph';
import { KnowledgeGraphValueCombobox } from 'features/knowledgeGraph/KnowledgeGraphValueCombobox';

import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { StyledField } from '../../ui/StyledField';

const CAL_DESCRIPTION =
  'Cost attribution labels help track costs across teams and services. Enter a value for each label or leave blank for unattributed.';

interface CostAttributionLabelsFieldProps {
  calNames: string[];
}

export function CostAttributionLabelsField({ calNames }: CostAttributionLabelsFieldProps) {
  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const { value: kgInstalled } = useAppPluginInstalled(KG_PLUGIN_ID);
  const styles = useStyles2(getStyles);
  const labelIdPrefix = useDOMId();

  if (calNames.length === 0) {
    return null;
  }

  return (
    <StyledField label="Cost attribution labels" description={CAL_DESCRIPTION} emulate>
      <Stack direction="column" gap={0.5}>
        {calNames.map((calName, index) => {
          // service_name / namespace double as the Knowledge Graph service link, so their
          // values get the same KG-suggestions combobox as the service link section.
          const kgProperty =
            kgInstalled && calName === KG_SERVICE_NAME_LABEL
              ? ('name' as const)
              : kgInstalled && calName === KG_NAMESPACE_LABEL
                ? ('namespace' as const)
                : undefined;
          const valueLabelId = `${labelIdPrefix}-cal-value-${index}`;

          return (
            <Stack key={calName} alignItems="start">
              <StyledField className={styles.nameField}>
                <Input value={calName} readOnly aria-label={`Cost attribution label ${index + 1} name`} />
              </StyledField>
              <StyledField className={styles.valueField}>
                <Controller
                  name={`calLabels.${index}.value`}
                  render={({ field }) =>
                    kgProperty ? (
                      <>
                        <span id={valueLabelId} className={styles.srOnly}>
                          Cost attribution label {index + 1} value
                        </span>
                        <KnowledgeGraphValueCombobox
                          property={kgProperty}
                          value={field.value || undefined}
                          onChange={field.onChange}
                          placeholder="unattributed"
                          disabled={disabled}
                          aria-labelledby={valueLabelId}
                        />
                      </>
                    ) : (
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="unattributed"
                        disabled={disabled}
                        aria-label={`Cost attribution label ${index + 1} value`}
                      />
                    )
                  }
                />
              </StyledField>
              {/* Reserve the remove-button column so rows align with the KG service link and custom label rows. */}
              <IconButton
                style={{ marginTop: '8px', visibility: 'hidden' }}
                disabled
                name="minus"
                aria-label="Remove row"
              />
            </Stack>
          );
        })}
      </Stack>
    </StyledField>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    nameField: css`
      flex: 1 1 0;
    `,
    valueField: css`
      flex: 1 1 0;
    `,
    srOnly: css`
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `,
  };
}
