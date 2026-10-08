import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Dropdown, Icon, Menu, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';
import { StyledField } from 'components/Checkster/components/ui/StyledField';

import { KG_FRONTEND_APP_ID_LABEL, KG_NAMESPACE_LABEL, KG_SERVICE_NAME_LABEL } from './knowledgeGraph';
import { useKnowledgeGraphEnabled, useKnowledgeGraphFrontendEnabled } from './knowledgeGraph.hooks';
import { KnowledgeGraphConnectionRow } from './KnowledgeGraphConnectionRow';
import { KnowledgeGraphFrontendLink } from './KnowledgeGraphFrontendLink';
import { KGLinkedLabel, useKGLinkedLabel, useKGServiceMatch } from './KnowledgeGraphServiceLink.hooks';
import { KnowledgeGraphValueCombobox } from './KnowledgeGraphValueCombobox';

type ConnectionType = 'frontend' | 'service';

// Gate first so the KG-fetching hooks below never run when the integration is disabled.
export function KnowledgeGraphServiceLink() {
  const kgEnabled = useKnowledgeGraphEnabled();

  if (!kgEnabled) {
    return null;
  }

  return <KnowledgeGraphConnectionFields />;
}

function KnowledgeGraphConnectionFields() {
  const addButtonId = useDOMId();
  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const frontend = useKGLinkedLabel(KG_FRONTEND_APP_ID_LABEL);
  const serviceName = useKGLinkedLabel(KG_SERVICE_NAME_LABEL);
  const namespace = useKGLinkedLabel(KG_NAMESPACE_LABEL);
  // Empty rows are UI-only. Saved values (including asynchronously loaded CALs) stay authoritative.
  const [drafts, setDrafts] = useState({ frontend: false, service: false });
  const frontendEnabled = useKnowledgeGraphFrontendEnabled();
  const showFrontend = frontendEnabled && Boolean(frontend.value || drafts.frontend);
  const showService = Boolean(serviceName.value || namespace.value || drafts.service);

  const removeConnection = (type: ConnectionType) => {
    if (type === 'frontend') {
      frontend.onChange('');
    } else {
      serviceName.onChange('');
      namespace.onChange('');
    }
    setDrafts((current) => ({ ...current, [type]: false }));
    requestAnimationFrame(() => document.getElementById(addButtonId)?.focus());
  };

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="column" gap={0.5}>
        <Text variant="bodySmall" weight="medium">
          Knowledge Graph connections
        </Text>
        <Text color="secondary" variant="bodySmall">
          {frontendEnabled
            ? 'Connect this check to a frontend application, a service, or both.'
            : 'Connect this check to a service.'}
        </Text>
      </Stack>
      {showFrontend && (
        <KnowledgeGraphFrontendLink
          frontend={frontend}
          disabled={disabled}
          autoFocus={drafts.frontend}
          onRemove={() => removeConnection('frontend')}
        />
      )}
      {showService && (
        <ServiceConnection
          serviceName={serviceName}
          namespace={namespace}
          disabled={disabled}
          autoFocus={drafts.service}
          onRemove={() => removeConnection('service')}
        />
      )}
      {!showFrontend && !showService && <Text color="secondary">No connections added.</Text>}
      {((frontendEnabled && !showFrontend) || !showService) && (
        <div>
          <Dropdown
            placement="bottom-start"
            overlay={
              <Menu ariaLabel="Add Knowledge Graph connection">
                {frontendEnabled && !showFrontend && (
                  <Menu.Item
                    label="Frontend application"
                    icon="monitor"
                    onClick={() => setDrafts((current) => ({ ...current, frontend: true }))}
                  />
                )}
                {!showService && (
                  <Menu.Item
                    label="Service"
                    icon="cube"
                    onClick={() => setDrafts((current) => ({ ...current, service: true }))}
                  />
                )}
              </Menu>
            }
          >
            <Button id={addButtonId} type="button" variant="secondary" size="sm" icon="plus" disabled={disabled}>
              Add connection <Icon name="angle-down" />
            </Button>
          </Dropdown>
        </div>
      )}
      <Text color="secondary" variant="bodySmall">
        Changes may take a few minutes to appear after saving.
      </Text>
    </Stack>
  );
}

interface ServiceConnectionProps {
  serviceName: KGLinkedLabel;
  namespace: KGLinkedLabel;
  disabled?: boolean;
  autoFocus: boolean;
  onRemove: () => void;
}

function ServiceConnection({ serviceName, namespace, disabled, autoFocus, onRemove }: ServiceConnectionProps) {
  const styles = useStyles2(getStyles);
  const id = useDOMId();
  const matchState = useKGServiceMatch(serviceName.value, namespace.value);

  return (
    <KnowledgeGraphConnectionRow
      label="Service"
      labelId={`${id}-heading`}
      icon="cube"
      disabled={disabled}
      autoFocus={autoFocus}
      onRemove={onRemove}
    >
      <Stack direction="column" gap={1}>
        <div className={styles.serviceFields}>
          <StyledField label="Service name" htmlFor={`${id}-service`}>
            <KnowledgeGraphValueCombobox
              id={`${id}-service`}
              property="name"
              value={serviceName.value}
              onChange={serviceName.onChange}
              placeholder="Select or type a service name"
              isClearable={false}
              disabled={disabled}
            />
          </StyledField>
          <StyledField label="Namespace" htmlFor={`${id}-namespace`}>
            <KnowledgeGraphValueCombobox
              id={`${id}-namespace`}
              property="namespace"
              value={namespace.value}
              onChange={namespace.onChange}
              placeholder="Select or type a namespace"
              emptyOptionLabel="Any namespace"
              isClearable={false}
              disabled={disabled}
            />
          </StyledField>
        </div>
        {matchState === 'no-match' && serviceName.value && (
          <Text color="secondary" variant="bodySmall">
            No matching service in the Knowledge Graph yet. The link will become active once service {serviceName.value}
            {namespace.value && ` (namespace ${namespace.value})`} is discovered.
          </Text>
        )}
      </Stack>
    </KnowledgeGraphConnectionRow>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  serviceFields: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    alignItems: 'end',
    gap: theme.spacing(2),
  }),
});
