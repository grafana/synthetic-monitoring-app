import React, { useState } from 'react';
import { locationService } from '@grafana/runtime';
import { Button, Field, Input, Modal } from '@grafana/ui';
import { trackCheckTemplateDraftCreated, trackCheckTemplateSelected } from 'features/tracking/checkTemplateEvents';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';
import { CHECK_TYPE_OPTIONS } from 'hooks/useCheckTypeOptions.constants';
import { useIsOverlimit } from 'hooks/useIsOverlimit';

import { CheckTemplateCard } from './CheckTemplateCard';
import { CheckTemplateDefinition } from './checkTemplates';

export function CheckTemplate({ template }: { template: CheckTemplateDefinition }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string>();
  const isOverlimit = useIsOverlimit(false, template.checkType);
  const { canWriteChecks } = getUserPermissions();
  const checkTypeOption = CHECK_TYPE_OPTIONS.find((option) => option.value === template.checkType)!;
  const disabled = isOverlimit !== false || !canWriteChecks;

  function continueToCheck(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      return;
    }

    let pageUrl: URL;
    try {
      pageUrl = new URL(url.trim());
      if (!(template.httpsOnly ? ['https:'] : ['http:', 'https:']).includes(pageUrl.protocol)) {
        throw new Error('Unsupported protocol');
      }
    } catch {
      setError(template.httpsOnly ? 'Enter a valid URL starting with https://.' : 'Enter a valid URL starting with https:// or http://.');
      return;
    }

    const prefilledCheck = template.createCheck(pageUrl);

    trackCheckTemplateDraftCreated({ check_template_id: template.id });
    locationService.push({
      pathname: `${getRoute(AppRoutes.NewCheck)}/${checkTypeOption.group}`,
      search: `?checkType=${template.checkType}`,
      state: { prefilledCheck, checkTemplateId: template.id },
    });
  }

  return (
    <>
      <CheckTemplateCard
        title={template.title}
        icon={template.icon}
        description={template.description}
        checkType={checkTypeOption.label}
        disabled={disabled}
        onSelect={() => {
          trackCheckTemplateSelected({ check_template_id: template.id });
          setIsOpen(true);
        }}
      />
      {isOpen && (
        <Modal title={template.title} isOpen onDismiss={() => setIsOpen(false)}>
          <form onSubmit={continueToCheck} noValidate>
            <Field
              label="Page URL"
              htmlFor={`${template.id}-page-url`}
              description={template.urlDescription}
              invalid={!!error}
              error={error}
            >
              <Input
                id={`${template.id}-page-url`}
                type="url"
                autoFocus
                placeholder="https://grafana.com"
                value={url}
                onChange={(event) => {
                  setUrl(event.currentTarget.value);
                  setError(undefined);
                }}
              />
            </Field>
            <Modal.ButtonRow>
              <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={disabled}>Continue</Button>
            </Modal.ButtonRow>
          </form>
        </Modal>
      )}
    </>
  );
}
