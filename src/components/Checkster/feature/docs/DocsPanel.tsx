import React, { ComponentType } from 'react';

import { CheckType } from 'types';
import { useChecksterContext } from 'components/Checkster/contexts/ChecksterContext';
import { DocsPanelAPIEndpoint } from 'components/Checkster/feature/docs/DocsPanelAPIEndpoint';
import { DocsPanelBrowserCheck } from 'components/Checkster/feature/docs/DocsPanelBrowser';
import { DocsPanelMultiStep } from 'components/Checkster/feature/docs/DocsPanelMultiStep';
import { DocsPanelScriptedCheck } from 'components/Checkster/feature/docs/DocsPanelScripted';

// empty array means all check types are supported
export const DOCS_CHECK_COMPATABILITY: CheckType[] = [];

const CHECK_TYPE_DOCS_MAP: Array<[ComponentType, CheckType[]]> = [
  [
    DocsPanelAPIEndpoint,
    [CheckType.Dns, CheckType.Grpc, CheckType.Http, CheckType.Ping, CheckType.Tcp, CheckType.Traceroute],
  ],
  [DocsPanelMultiStep, [CheckType.MultiHttp]],
  [DocsPanelScriptedCheck, [CheckType.Scripted]],
  [DocsPanelBrowserCheck, [CheckType.Browser]],
] as const;

export const DocsPanel = () => {
  const { checkType } = useChecksterContext();

  const DocsPanelComponent = CHECK_TYPE_DOCS_MAP.find(([_, checkTypes]) => checkTypes.includes(checkType))?.[0];

  return DocsPanelComponent ? <DocsPanelComponent /> : null;
};
