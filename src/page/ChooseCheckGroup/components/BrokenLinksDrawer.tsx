import React, { useState } from 'react';
import { Field, Input } from '@grafana/ui';

import { CheckAlertDraft } from 'types';

import { createBrokenLinksCheck } from './brokenLinks';
import { BROKEN_LINKS_ALERTS } from './templateAlerts';
import { TemplateDrawer } from './TemplateDrawer';
import { parseHttpUrl, TemplateUrlField, URL_FORMAT_ERROR } from './TemplateUrlField';

export function BrokenLinksDrawer({
  onClose,
  alerts = BROKEN_LINKS_ALERTS,
}: {
  onClose: () => void;
  alerts?: CheckAlertDraft[];
}) {
  const [url, setUrl] = useState('');
  const [maxLinks, setMaxLinks] = useState('');

  return (
    <TemplateDrawer
      templateId="broken_links"
      title="Detect broken links"
      subtitle="Check a page for broken links on a regular schedule."
      alerts={alerts}
      onClose={onClose}
      validate={() => {
        const errors: Record<string, string> = {};
        if (!parseHttpUrl(url)) {
          errors.url = URL_FORMAT_ERROR;
        }
        if (maxLinks.trim() && (!Number.isSafeInteger(Number(maxLinks)) || Number(maxLinks) < 1)) {
          errors.maxLinks = 'Enter a positive whole number.';
        }
        return errors;
      }}
      buildCheck={() =>
        createBrokenLinksCheck(parseHttpUrl(url)!, { maxLinks: maxLinks.trim() ? Number(maxLinks) : undefined })
      }
      renderFields={(errors, folderField) => (
        <>
          <TemplateUrlField label="Page URL" value={url} onChange={setUrl} submitError={errors.url} />
          {folderField}
          <Field
            label="Link limit"
            htmlFor="template-max-links"
            description="Maximum links per run."
            error={errors.maxLinks}
            invalid={!!errors.maxLinks}
          >
            <Input
              id="template-max-links"
              type="number"
              min={1}
              step={1}
              placeholder="10"
              value={maxLinks}
              onChange={(event) => setMaxLinks(event.currentTarget.value)}
            />
          </Field>
        </>
      )}
    />
  );
}
