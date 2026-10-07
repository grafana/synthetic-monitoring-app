import React, { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Dropdown, Icon, IconButton, Menu, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';
import { StyledField } from 'components/Checkster/components/ui/StyledField';

import { KG_FRONTEND_APP_ID_LABEL, KG_NAMESPACE_LABEL, KG_SERVICE_NAME_LABEL } from './knowledgeGraph';
import { useKnowledgeGraphEnabled } from './knowledgeGraph.hooks';
import { KnowledgeGraphFrontendLink } from './KnowledgeGraphFrontendLink';
import { KGLinkedLabel, useKGLinkedLabel, useKGServiceMatch } from './KnowledgeGraphServiceLink.hooks';
import { KnowledgeGraphValueCombobox } from './KnowledgeGraphValueCombobox';

type ConnectionType = 'service' | 'frontend';

// Gate first so the KG-fetching hooks below never run when the integration is disabled.
export function KnowledgeGraphServiceLink() {
  const kgEnabled = useKnowledgeGraphEnabled();

  if (!kgEnabled) {
    return null;
  }

  return <KnowledgeGraphConnectionFields />;
}

function KnowledgeGraphConnectionFields() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusAdd, setFocusAdd] = useState(false);
  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const serviceName = useKGLinkedLabel(KG_SERVICE_NAME_LABEL);
  const namespace = useKGLinkedLabel(KG_NAMESPACE_LABEL);
  const frontend = useKGLinkedLabel(KG_FRONTEND_APP_ID_LABEL);

  // Draft rows are UI state only: adding one does not create labels or dirty the form.
  // Saved values stay authoritative, including values hydrated asynchronously or edited through CALs.
  const [drafts, setDrafts] = useState<ConnectionType[]>([]);
  const showService = Boolean(serviceName.value || namespace.value || drafts.includes('service'));
  const showFrontend = Boolean(frontend.value || drafts.includes('frontend'));

  useEffect(() => {
    if (!focusAdd) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      containerRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Add connection"]')?.focus();
      setFocusAdd(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusAdd]);

  const addConnection = (type: ConnectionType) => setDrafts((current) => [...new Set([...current, type])]);
  const removeDraft = (type: ConnectionType) => {
    setDrafts((current) => current.filter((draft) => draft !== type));
    setFocusAdd(true);
  };
  const removeService = () => {
    serviceName.onChange('');
    namespace.onChange('');
    removeDraft('service');
  };

  return (
    <div ref={containerRef}>
      <StyledField
        label="Knowledge Graph connections"
        description="Connect this check to the applications and services it monitors."
        emulate
      >
        <Stack direction="column" gap={2}>
          {showFrontend && (
            <KnowledgeGraphFrontendLink
              autoFocus={drafts.includes('frontend')}
              onRemove={() => removeDraft('frontend')}
            />
          )}
          {showService && (
            <ServiceConnection
              serviceName={serviceName}
              namespace={namespace}
              disabled={disabled}
              autoFocus={drafts.includes('service')}
              onEdit={() => addConnection('service')}
              onRemove={removeService}
            />
          )}
          {!showService && !showFrontend && <Text color="secondary">No connections added.</Text>}
          {(!showService || !showFrontend) && (
            <div>
              <Dropdown
                placement="bottom-start"
                overlay={
                  <Menu ariaLabel="Add Knowledge Graph connection">
                    {!showService && (
                      <Menu.Item
                        label="Service"
                        description="Connect a backend service"
                        disabled={disabled}
                        onClick={() => addConnection('service')}
                      />
                    )}
                    {!showFrontend && (
                      <Menu.Item
                        label="Frontend application"
                        description="Connect a browser application"
                        disabled={disabled}
                        onClick={() => addConnection('frontend')}
                      />
                    )}
                  </Menu>
                }
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon="plus"
                  disabled={disabled}
                  aria-label="Add connection"
                >
                  Add connection <Icon name="angle-down" />
                </Button>
              </Dropdown>
            </div>
          )}
          <Text color="secondary" variant="bodySmall">
            Changes apply after saving and may take a few minutes to appear.
          </Text>
        </Stack>
      </StyledField>
    </div>
  );
}

interface ServiceConnectionProps {
  serviceName: KGLinkedLabel;
  namespace: KGLinkedLabel;
  disabled?: boolean;
  autoFocus: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

function ServiceConnection({ serviceName, namespace, disabled, autoFocus, onEdit, onRemove }: ServiceConnectionProps) {
  const styles = useStyles2(getStyles);
  const labelIdPrefix = useDOMId();
  const nameId = `${labelIdPrefix}-service-name`;
  const namespaceId = `${labelIdPrefix}-namespace`;
  const focusOnMount = useRef(autoFocus);

  useEffect(() => {
    if (!focusOnMount.current) {
      return;
    }
    const frame = requestAnimationFrame(() => document.getElementById(nameId)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [nameId]);
  const matchState = useKGServiceMatch(serviceName.value, namespace.value);
  const serviceLabel = namespace.value ? `${serviceName.value} (namespace ${namespace.value})` : serviceName.value;

  return (
    <StyledField
      label={
        <Stack alignItems="center" gap={1}>
          <Icon name="cube" size="sm" />
          <span>Service</span>
        </Stack>
      }
      emulate
    >
      <Stack direction="column" gap={1}>
        <div className={styles.serviceFields}>
          <StyledField label="Service name" htmlFor={nameId}>
            <KnowledgeGraphValueCombobox
              property="name"
              value={serviceName.value}
              onChange={(value) => {
                onEdit();
                serviceName.onChange(value);
              }}
              placeholder="Select or type a service name"
              disabled={disabled}
              id={nameId}
            />
          </StyledField>
          <StyledField label="Namespace" htmlFor={namespaceId}>
            <KnowledgeGraphValueCombobox
              property="namespace"
              value={namespace.value}
              onChange={(value) => {
                onEdit();
                namespace.onChange(value);
              }}
              placeholder="Select or type a namespace"
              disabled={disabled}
              id={namespaceId}
            />
          </StyledField>
          <div className={styles.remove}>
            <IconButton name="times" tooltip="Remove service connection" disabled={disabled} onClick={onRemove} />
          </div>
        </div>
        {matchState === 'no-match' && serviceName.value && (
          <Text color="secondary" variant="bodySmall">
            No matching service in the Knowledge Graph yet. The link will become active once service {serviceLabel} is
            discovered.
          </Text>
        )}
      </Stack>
    </StyledField>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  serviceFields: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
    alignItems: 'end',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      '& > :first-child': { gridColumn: '1 / -1' },
    },
  }),
  remove: css({
    display: 'flex',
    alignItems: 'center',
    height: theme.spacing(4),
  }),
});
