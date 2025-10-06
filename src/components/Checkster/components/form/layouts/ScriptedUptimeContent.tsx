import React from 'react';
import { TextLink } from '@grafana/ui';

import { CHECK_TYPE_TIMEOUT_MAP } from '../../../constants';
import { SectionContent } from '../../ui/SectionContent';
import { FormTimeoutField } from '../FormTimeoutField';

export function ScriptedUptimeContent() {
  return (
    <SectionContent>
      <div>
        Include uptime checks and assertions in your script. See the docs about {` `}
        <TextLink href={`https://grafana.com/docs/k6/latest/javascript-api/k6/check/`} external>
          running checks in a k6 script.
        </TextLink>
      </div>
      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP.scripted} />
    </SectionContent>
  );
}
