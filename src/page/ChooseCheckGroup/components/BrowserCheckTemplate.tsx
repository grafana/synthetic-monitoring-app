import React, { useState } from 'react';
import { locationService } from '@grafana/runtime';
import { Button, Field, Input, Modal } from '@grafana/ui';
import { trackCheckTemplateDraftCreated, trackCheckTemplateSelected } from 'features/tracking/checkTemplateEvents';
import { encode } from 'js-base64';

import { BrowserCheck, CheckType, CheckTypeGroup } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';
import { useIsOverlimit } from 'hooks/useIsOverlimit';
import { DEFAULT_CHECK_CONFIG_MAP } from 'components/Checkster/constants';

import { BrowserCheckTemplateDefinition } from './browserCheckTemplates';
import { CheckTemplateCard } from './CheckTemplateCard';

export function BrowserCheckTemplate({ template }: { template: BrowserCheckTemplateDefinition }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string>();
  const isOverlimit = useIsOverlimit(false, CheckType.Browser);
  const { canWriteChecks } = getUserPermissions();
  const disabled = isOverlimit !== false || !canWriteChecks;

  function continueToCheck(event: React.FormEvent) {
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

    const defaults = DEFAULT_CHECK_CONFIG_MAP[CheckType.Browser] as BrowserCheck;
    const prefilledCheck: BrowserCheck = {
      ...defaults,
      job: `${template.jobPrefix} ${pageUrl.hostname}`,
      target: pageUrl.href,
      frequency: 60 * 60 * 1000,
      settings: {
        browser: {
          ...defaults.settings.browser,
          script: encode(template.createScript(pageUrl.href)),
        },
      },
    };

    trackCheckTemplateDraftCreated({ check_template_id: template.id });
    locationService.push({
      pathname: `${getRoute(AppRoutes.NewCheck)}/${CheckTypeGroup.Browser}`,
      state: { prefilledCheck, checkTemplateId: template.id },
    });
  }

  return (
    <>
      <CheckTemplateCard
        title={template.title}
        icon={template.icon}
        description={template.description}
        checkType="Browser"
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

