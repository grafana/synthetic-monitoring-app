import React from 'react';

import { FormSectionName } from '../../types';
import { CheckType } from 'types';
import { BROWSER_EXAMPLES, SCRIPT_EXAMPLES } from 'components/WelcomeTabs/constants';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { DnsCheckSection } from './layouts/DnsCheckSection';
import { GrpcCheckSection } from './layouts/GrpcCheckSection';
import { HTTP_CHECK_FIELDS, HttpCheckSection } from './layouts/HttpCheckSection';
import { MULTI_HTTP_CHECK_REG_EXP_LIST, MultiHttpCheckSections } from './layouts/MultiHttpCheckSections';
import { PingCheckSection } from './layouts/PingCheckSection';
import { SCRIPTED_CHECK_FIELDS, ScriptedCheckSection } from './layouts/ScriptedCheckSection';
import { TcpCheckSection } from './layouts/TcpCheckSection';
import { TracerouteCheckSection } from './layouts/TracerouteCheckSection';
import { FormSection } from './FormSection';

function getCheckTypeFields(checkType: CheckType) {
  switch (checkType) {
    case CheckType.HTTP:
      return HTTP_CHECK_FIELDS;
    case CheckType.MULTI_HTTP:
      return MULTI_HTTP_CHECK_REG_EXP_LIST;
    case CheckType.Scripted:
      return SCRIPTED_CHECK_FIELDS;
    default:
      return undefined;
  }
}

export function FormCheckSection() {
  const {
    checkMeta: { type },
  } = useChecksterContext();

  return (
    <FormSection sectionName={FormSectionName.Check} fields={getCheckTypeFields(type)}>
      {/* Protocol checks (blackbox exporter)*/}
      {type === CheckType.HTTP && <HttpCheckSection />}
      {type === CheckType.PING && <PingCheckSection />}
      {type === CheckType.GRPC && <GrpcCheckSection />}
      {type === CheckType.DNS && <DnsCheckSection />}
      {type === CheckType.TCP && <TcpCheckSection />}
      {type === CheckType.Traceroute && <TracerouteCheckSection />}
      {/* Scripted checks (k6) */}
      {type === CheckType.MULTI_HTTP && <MultiHttpCheckSections label="Requests" />}
      {type === CheckType.Scripted && (
        <ScriptedCheckSection scriptField="settings.scripted.script" label="Script" examples={SCRIPT_EXAMPLES} />
      )}
      {type === CheckType.Browser && (
        <ScriptedCheckSection
          scriptField="settings.browser.script"
          label="Browser script"
          examples={BROWSER_EXAMPLES}
        />
      )}
    </FormSection>
  );
}
