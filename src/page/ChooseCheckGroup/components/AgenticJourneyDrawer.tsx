import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Combobox, Field, IconButton, Input, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { jobSchema } from 'schemas/general/Job';

import { CheckAlertDraft } from 'types';

import { AGENTIC_JOURNEY_STEP_TYPES, AgenticJourneyStep,createAgenticJourneyCheck } from './agenticJourney';
import { LLMProviderField } from './LLMProviderField';
import { AGENTIC_JOURNEY_ALERTS } from './templateAlerts';
import { TemplateDrawer } from './TemplateDrawer';
import { parseHttpUrl, TemplateUrlField, URL_FORMAT_ERROR } from './TemplateUrlField';

const MAX_STEPS = 20;
const INSTRUCTION_PLACEHOLDERS: Record<AgenticJourneyStep['type'], string> = {
  action: 'click the "Sign in" button',
  assertion: 'the order confirmation is showing',
  wait: 'the page URL contains "/dashboard"',
  agent: 'add a pizza to the cart and open the checkout',
};

const newStep = (): AgenticJourneyStep => ({ type: 'action', instruction: '' });

export function AgenticJourneyDrawer({
  onClose,
  alerts = AGENTIC_JOURNEY_ALERTS,
}: {
  onClose: () => void;
  alerts?: CheckAlertDraft[];
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secretName, setSecretName] = useState<string>();
  const [steps, setSteps] = useState<AgenticJourneyStep[]>([newStep()]);

  function updateStep(index: number, patch: Partial<AgenticJourneyStep>) {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function moveStep(index: number, offset: -1 | 1) {
    setSteps((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <TemplateDrawer
      templateId="agentic_journey"
      allowTest
      title="Agentic journey"
      subtitle="Describe the steps of a flow. AI runs them in a browser on a regular schedule."
      alerts={alerts}
      onClose={onClose}
      validate={() => {
        const errors: Record<string, string> = {};
        if (name.trim()) {
          const result = jobSchema.safeParse(name);
          if (!result.success) {
            errors.name = result.error.issues[0].message;
          }
        }
        if (!parseHttpUrl(url)) {
          errors.url = URL_FORMAT_ERROR;
        }
        if (!secretName) {
          errors.secret = 'Select the secret that contains your Anthropic API key.';
        }
        steps.forEach((step, index) => {
          if (!step.instruction.trim()) {
            errors[`step-${index}`] = 'Describe this step.';
          }
        });
        return errors;
      }}
      buildCheck={() => createAgenticJourneyCheck(parseHttpUrl(url)!, steps, secretName!, name)}
      renderFields={(errors, folderField) => (
        <>
          <Field label="Name (optional)" htmlFor="template-name" error={errors.name} invalid={!!errors.name}>
            <Input
              id="template-name"
              autoFocus
              placeholder="Checkout flow"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </Field>
          <TemplateUrlField
            label="Start URL"
            autoFocus={false}
            value={url}
            onChange={setUrl}
            submitError={errors.url}
          />
          {folderField}
          <Field label="Steps" description="Steps run in order, starting from the page above.">
            <Stack direction="column" gap={2}>
              {steps.map((step, index) => (
                <StepCard
                  key={index}
                  index={index}
                  step={step}
                  total={steps.length}
                  error={errors[`step-${index}`]}
                  onChange={(patch) => updateStep(index, patch)}
                  onMove={(offset) => moveStep(index, offset)}
                  onRemove={() => setSteps((current) => current.filter((_, i) => i !== index))}
                />
              ))}
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  icon="plus"
                  disabled={steps.length >= MAX_STEPS}
                  onClick={() => setSteps((current) => [...current, newStep()])}
                >
                  Add step
                </Button>
              </div>
            </Stack>
          </Field>
          <LLMProviderField value={secretName} onChange={setSecretName} error={errors.secret} />
        </>
      )}
    />
  );
}

function StepCard({
  index,
  step,
  total,
  error,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  step: AgenticJourneyStep;
  total: number;
  error?: string;
  onChange: (patch: Partial<AgenticJourneyStep>) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
}) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.step}>
      <div className={styles.row}>
        <span className={styles.badge}>{index + 1}</span>
        <div className={styles.type}>
          <Combobox
            aria-label={`Step ${index + 1} type`}
            options={AGENTIC_JOURNEY_STEP_TYPES}
            value={step.type}
            onChange={(option) => onChange({ type: option.value })}
          />
        </div>
        <div className={styles.instruction}>
          <Input
            aria-label={`Step ${index + 1} instruction`}
            invalid={!!error}
            placeholder={INSTRUCTION_PLACEHOLDERS[step.type]}
            value={step.instruction}
            onChange={(event) => onChange({ instruction: event.currentTarget.value })}
          />
        </div>
        <Stack gap={0.5} wrap="nowrap">
          <IconButton name="arrow-up" tooltip="Move step up" disabled={index === 0} onClick={() => onMove(-1)} />
          <IconButton
            name="arrow-down"
            tooltip="Move step down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          />
          <IconButton name="trash-alt" tooltip="Remove step" disabled={total === 1} onClick={onRemove} />
        </Stack>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    step: css({ width: '100%' }),
    row: css({ display: 'flex', alignItems: 'center', gap: theme.spacing(1) }),
    badge: css({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      width: theme.spacing(3),
      height: theme.spacing(3),
      borderRadius: '50%',
      background: theme.colors.primary.transparent,
      color: theme.colors.primary.text,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightBold,
    }),
    type: css({ flex: '0 0 160px' }),
    instruction: css({ flex: 1, minWidth: 0 }),
    error: css({
      marginTop: theme.spacing(0.5),
      marginLeft: `calc(${theme.spacing(3)} + ${theme.spacing(1)})`,
      color: theme.colors.error.text,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
  };
}
