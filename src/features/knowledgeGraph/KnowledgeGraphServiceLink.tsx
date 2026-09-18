import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconButton, Input, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';
import { StyledField } from 'components/Checkster/components/ui/StyledField';

import { KG_NAMESPACE_LABEL, KG_PLUGIN_ID, KG_SERVICE_NAME_LABEL } from './knowledgeGraph';
import { useKnowledgeGraphEnabled } from './knowledgeGraph.hooks';
import {
  KGLinkedLabel,
  KGServiceMatchState,
  KGServiceProperty,
  useKGLinkedLabel,
  useKGServiceMatch,
} from './KnowledgeGraphServiceLink.hooks';
import { KnowledgeGraphValueCombobox } from './KnowledgeGraphValueCombobox';

// Gate first so the KG-fetching hooks below never run when the integration is disabled.
export function KnowledgeGraphServiceLink() {
  const kgEnabled = useKnowledgeGraphEnabled();

  if (!kgEnabled) {
    return null;
  }

  return <KnowledgeGraphServiceLinkFields />;
}

function KnowledgeGraphServiceLinkFields() {
  const styles = useStyles2(getStyles);
  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const labelIdPrefix = useDOMId();

  const serviceName = useKGLinkedLabel(KG_SERVICE_NAME_LABEL);
  const namespace = useKGLinkedLabel(KG_NAMESPACE_LABEL);

  const matchState = useKGServiceMatch(serviceName.value, namespace.value);

  const description = (
    <>
      Link this check to a service discovered by the{' '}
      <TextLink href={`/a/${KG_PLUGIN_ID}/`} external variant="bodySmall">
        Knowledge Graph
      </TextLink>
      . This enables the MONITORED_BY relationship in the entity graph.
    </>
  );

  // Rendered as key/value rows to match the cost attribution and custom label fields:
  // the label name sits in a disabled field on the left, the value combobox on the right.
  // Values are optional and cleared individually via the combobox — no remove action, no validation.
  const rows: Array<{ key: string; property: KGServiceProperty; linked: KGLinkedLabel; placeholder: string }> = [
    {
      key: KG_SERVICE_NAME_LABEL,
      property: 'name',
      linked: serviceName,
      placeholder: 'Select or type a service name',
    },
    {
      key: KG_NAMESPACE_LABEL,
      property: 'namespace',
      linked: namespace,
      placeholder: 'Select or type a namespace',
    },
  ];

  return (
    <div className={styles.container}>
      <StyledField label="Link to Knowledge Graph service" description={description} emulate>
        <Stack direction="column" gap={0.5}>
          {rows.map((row, index) => {
            const valueLabelId = `${labelIdPrefix}-kg-value-${index}`;

            return (
              <Stack key={row.key} alignItems="start">
                <StyledField className={styles.field}>
                  <Input value={row.key} readOnly aria-label={`Service link label ${index + 1} name`} />
                </StyledField>
                <StyledField className={styles.field}>
                  <>
                    <span id={valueLabelId} className={styles.srOnly}>{`${row.key} value`}</span>
                    <KnowledgeGraphValueCombobox
                      property={row.property}
                      value={row.linked.value}
                      onChange={row.linked.onChange}
                      placeholder={row.placeholder}
                      disabled={disabled}
                      aria-labelledby={valueLabelId}
                    />
                  </>
                </StyledField>
                {/* Reserve the remove-button column so rows align with the CAL and custom label rows. */}
                <IconButton
                  className={styles.removeButtonPlaceholder}
                  style={{ visibility: 'hidden' }}
                  name="minus"
                  aria-label="Remove row"
                  disabled
                />
              </Stack>
            );
          })}
          <ServiceMatchIndicator state={matchState} serviceName={serviceName.value} namespace={namespace.value} />
        </Stack>
      </StyledField>
    </div>
  );
}

interface ServiceMatchIndicatorProps {
  state: KGServiceMatchState;
  serviceName?: string;
  namespace?: string;
}

function ServiceMatchIndicator({ state, serviceName, namespace }: ServiceMatchIndicatorProps) {
  const styles = useStyles2(getStyles);

  if (state === 'idle' || state === 'checking' || !serviceName) {
    return null;
  }

  const serviceLabel = namespace ? `${serviceName} (namespace ${namespace})` : serviceName;

  if (state === 'match') {
    return (
      <div className={styles.matchIndicator}>
        <Icon name="check-circle" size="sm" />
        <span>Will link to service {serviceLabel} in the Knowledge Graph.</span>
      </div>
    );
  }

  return (
    <div className={styles.noMatchIndicator}>
      <Icon name="info-circle" size="sm" />
      <span>
        No matching service in the Knowledge Graph yet. The link will become active once service {serviceLabel} is
        discovered.
      </span>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2, 2, 0, 2),
  }),
  field: css({
    // basis 0 so the key and value columns split exactly in half regardless of the
    // combobox vs input intrinsic width; keeps rows aligned with the CAL/custom rows
    flex: '1 1 0',
  }),
  removeButtonPlaceholder: css({
    // Align with the row inputs, matching the remove-button column of the custom label rows
    marginTop: theme.spacing(1),
  }),
  srOnly: css({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  }),
  matchIndicator: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.success.text,
  }),
  noMatchIndicator: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
});
