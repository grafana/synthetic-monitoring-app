import React, { ReactNode, useCallback, useId, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { IconName, NavModelItem, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, Text } from '@grafana/ui';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { CheckTypeGroup } from 'types';
import { useCheckTypeGroupOptions } from 'hooks/useCheckTypeGroupOptions';
import { useLimits } from 'hooks/useLimits';
import { AgentSkillPicker } from 'components/AgentSkillReference/AgentSkillPicker';
import { ChoiceTile, ChoiceTileGrid } from 'components/ChoiceTile';
import { OverLimitAlert } from 'components/OverLimitAlert';

import { CheckTemplate } from './components/CheckTemplate';
import { CHECK_TEMPLATES } from './components/checkTemplates';
import { getGroupAvailability, GroupTile, ProtocolTile } from './components/CheckTypeChoices';

// Matches the protocol label in useCheckTypeGroupOptions, which is also its tracking identity.
const WEBSOCKET_PROTOCOL_LABEL = 'WebSockets';

export const CHOOSE_CHECK_TAB_PARAM = 'tab';

export enum ChooseCheckTab {
  CheckType = 'check-type',
  Template = 'template',
  Agent = 'agent',
}

const TABS: Array<{ id: ChooseCheckTab; label: string; icon: IconName }> = [
  { id: ChooseCheckTab.CheckType, label: 'By check type', icon: 'apps' },
  { id: ChooseCheckTab.Template, label: 'From a template', icon: 'file-copy-alt' },
  { id: ChooseCheckTab.Agent, label: 'With a coding agent', icon: 'ai-sparkle' },
];

// Tiles stop gaining anything from extra width well before the page does, so cap the content.
// In theme spacing units: 1200px.
const CONTENT_MAX_WIDTH = 150;

export const ChooseCheckGroup = () => {
  const activeTab = useActiveTab();
  const getTabUrl = useTabUrl();

  const pageNav: NavModelItem = useMemo(
    () => ({
      text: 'Create a new check',
      url: getTabUrl(ChooseCheckTab.CheckType),
      children: TABS.map(({ id, label, icon }) => ({
        text: label,
        icon,
        url: getTabUrl(id),
        active: id === activeTab,
      })),
    }),
    [activeTab, getTabUrl]
  );

  return (
    <PluginPage
      layout={PageLayoutType.Standard}
      pageNav={pageNav}
      subTitle="Choose what to test. Each check runs on a schedule from the probe locations you pick."
    >
      <Stack direction="column" gap={2} maxWidth={CONTENT_MAX_WIDTH}>
        <OverLimitAlert />
        {activeTab === ChooseCheckTab.CheckType && <CheckTypeTab />}
        {activeTab === ChooseCheckTab.Template && <TemplateTab />}
        {activeTab === ChooseCheckTab.Agent && <AgentSkillPicker source="choose-check-type" />}
      </Stack>
    </PluginPage>
  );
};

function useActiveTab() {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get(CHOOSE_CHECK_TAB_PARAM);

  return TABS.find(({ id }) => id === requested)?.id ?? ChooseCheckTab.CheckType;
}

// Tabs keep the current path because /checks/new renders this page as well as /checks/choose-type.
function useTabUrl() {
  const { pathname, search } = useLocation();

  return useCallback(
    (tab: ChooseCheckTab) => {
      const params = new URLSearchParams(search);

      if (tab === ChooseCheckTab.CheckType) {
        params.delete(CHOOSE_CHECK_TAB_PARAM);
      } else {
        params.set(CHOOSE_CHECK_TAB_PARAM, tab);
      }

      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, search]
  );
}

function CheckTypeTab() {
  const groups = useCheckTypeGroupOptions();
  const limits = useLimits();

  const endpointGroup = groups.find(({ value }) => value === CheckTypeGroup.ApiTest);
  const journeyGroups = groups.filter(({ value }) => value !== CheckTypeGroup.ApiTest);

  return (
    <Stack direction="column" gap={4} data-testid={CHECKS_TEST_ID.form.chooseType}>
      {endpointGroup && (
        <ChoiceSection
          title="API endpoint"
          description="Send a single request to a URL, host or service."
          data-testid={`${CHECKS_TEST_ID.groupCard}-${endpointGroup.value}`}
        >
          {endpointGroup.protocols.map((protocol) => (
            <ProtocolTile
              key={protocol.label}
              protocol={protocol}
              availability={getGroupAvailability(limits, endpointGroup.value)}
            />
          ))}
        </ChoiceSection>
      )}

      {journeyGroups.length > 0 && (
        <ChoiceSection
          title="Journeys and scripts"
          description="Test a sequence of requests, custom k6 logic or a full browser session."
        >
          {journeyGroups.map((group) => (
            <GroupTile key={group.value} group={group} availability={getGroupAvailability(limits, group.value)} />
          ))}
        </ChoiceSection>
      )}
    </Stack>
  );
}

function TemplateTab() {
  const groups = useCheckTypeGroupOptions();
  const limits = useLimits();

  const websocketExample = groups
    .find(({ value }) => value === CheckTypeGroup.Scripted)
    ?.protocols.find(({ label }) => label === WEBSOCKET_PROTOCOL_LABEL);
  const scriptedAvailability = getGroupAvailability(limits, CheckTypeGroup.Scripted);

  return (
    <Stack direction="column" gap={2}>
      <Text color="secondary">Start from a check that is already set up for a common task.</Text>
      <ChoiceTileGrid>
        {CHECK_TEMPLATES.map((template) => (
          <CheckTemplate key={template.id} template={template} />
        ))}
        {websocketExample?.href && (
          <ChoiceTile
            title="Test a WebSocket API"
            description="Open a scripted check with a working WebSocket example."
            icon="exchange-alt"
            href={websocketExample.href}
            onClick={websocketExample.onClick}
            disabled={scriptedAvailability.disabled}
            disabledReason={scriptedAvailability.reason}
          />
        )}
      </ChoiceTileGrid>
    </Stack>
  );
}

interface ChoiceSectionProps {
  title: string;
  description: string;
  children: NonNullable<ReactNode>;
  'data-testid'?: string;
}

function ChoiceSection({ title, description, children, 'data-testid': testId }: ChoiceSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} data-testid={testId}>
      <Stack direction="column" gap={2}>
        <Stack direction="column" gap={0.5}>
          <Text element="h2" variant="h4" id={headingId}>
            {title}
          </Text>
          <Text color="secondary">{description}</Text>
        </Stack>
        <ChoiceTileGrid>{children}</ChoiceTileGrid>
      </Stack>
    </section>
  );
}
