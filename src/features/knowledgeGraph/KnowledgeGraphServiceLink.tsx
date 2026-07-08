import React, { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { useAppPluginInstalled } from '@grafana/runtime';
import { Button, Icon, IconButton, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';
import { StyledField } from 'components/Checkster/components/ui/StyledField';

import { KG_NAMESPACE_LABEL, KG_PLUGIN_ID, KG_SERVICE_NAME_LABEL } from './knowledgeGraph';
import { KGServiceMatchState, useKGLinkedLabel, useKGServiceMatch } from './KnowledgeGraphServiceLink.hooks';
import { KnowledgeGraphValueCombobox } from './KnowledgeGraphValueCombobox';

const CAL_MANAGED_HINT = 'Also a cost attribution label';

export function KnowledgeGraphServiceLink() {
  const styles = useStyles2(getStyles);
  const { value: kgInstalled } = useAppPluginInstalled(KG_PLUGIN_ID);
  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();

  const serviceName = useKGLinkedLabel(KG_SERVICE_NAME_LABEL);
  const namespace = useKGLinkedLabel(KG_NAMESPACE_LABEL);

  const hasValues = Boolean(serviceName.value || namespace.value);
  const [expanded, setExpanded] = useState(hasValues);

  // Stay open once a value appears (e.g. set via the CAL row) and while the user is editing;
  // only the explicit remove action collapses the section again.
  useEffect(() => {
    if (hasValues) {
      setExpanded(true);
    }
  }, [hasValues]);

  const matchState = useKGServiceMatch(serviceName.value, namespace.value);

  const handleRemove = useCallback(() => {
    serviceName.onChange('');
    namespace.onChange('');
    setExpanded(false);
  }, [serviceName, namespace]);

  if (!kgInstalled) {
    return null;
  }

  const description = (
    <>
      Link this check to a service discovered by the{' '}
      <TextLink href={`/a/${KG_PLUGIN_ID}/`} external variant="bodySmall">
        Knowledge Graph
      </TextLink>
      . This enables the MONITORS relationship in the entity graph.
    </>
  );

  return (
    <div className={styles.container}>
      <StyledField label="Link to Knowledge Graph service" description={description} emulate>
        {expanded ? (
          <Stack direction="column" gap={1}>
            <Stack alignItems="start">
              <StyledField
                label="Service name"
                description={serviceName.isCalManaged ? CAL_MANAGED_HINT : undefined}
                emulate
                grow
              >
                <KnowledgeGraphValueCombobox
                  property="name"
                  value={serviceName.value}
                  onChange={serviceName.onChange}
                  placeholder="Select or type a service name"
                  disabled={disabled}
                />
              </StyledField>
              <StyledField
                label="Service namespace"
                description={namespace.isCalManaged ? CAL_MANAGED_HINT : undefined}
                emulate
                grow
              >
                <KnowledgeGraphValueCombobox
                  property="namespace"
                  value={namespace.value}
                  onChange={namespace.onChange}
                  placeholder="Select or type a namespace"
                  disabled={disabled}
                />
              </StyledField>
              <IconButton
                className={styles.removeButton}
                name="times"
                aria-label="Remove service link"
                tooltip="Remove service link"
                onClick={handleRemove}
                disabled={disabled}
              />
            </Stack>
            <ServiceMatchIndicator state={matchState} serviceName={serviceName.value} namespace={namespace.value} />
          </Stack>
        ) : (
          <div>
            <Button
              icon="plus"
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setExpanded(true)}
              disabled={disabled}
            >
              Service link
            </Button>
          </div>
        )}
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
  removeButton: css({
    // Align with the combobox inputs, matching the remove-button column of the custom label rows
    marginTop: theme.spacing(4),
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
