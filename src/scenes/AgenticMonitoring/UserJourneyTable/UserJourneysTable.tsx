import React, { useMemo, useState } from 'react';
import { Badge, CollapsableSection, PanelChrome, Stack } from '@grafana/ui';

import { UserJourneyStepIndexed, UserJourneyTest } from '../types';

export const UserJourneysTable = ({ userJourneyTests }: { userJourneyTests: UserJourneyTest[] }) => {
  const memory = useMemo(() => {
    return userJourneyTests
      .flatMap((test) => test.steps)
      .filter((step) => step.memory && step.memory.length > 0)
      .map((step) => step.memory);
  }, [userJourneyTests]);

  return (
    <div style={{ width: '100%', height: 'auto' }}>
      <PanelChrome title="User Journeys" description="User journeys discovered and analyzed by the AI agent">
        <Stack direction="column">
          {userJourneyTests.map((test) => (
            <UserJourneyTestItem key={test.user_flow.title} test={test} />
          ))}
        </Stack>
        <div style={{ paddingLeft: '32px', marginTop: '20px' }}>
          <CollapsableSection label={<h6>Knowledge base</h6>} isOpen={false}>
            {memory.map((memory, index) => (
              <p key={`$memory-${index}`}>{memory}</p>
            ))}
          </CollapsableSection>
        </div>
      </PanelChrome>
    </div>
  );
};

const UserJourneyTestItem = ({ test }: { test: UserJourneyTest }) => {
  const [collapsed, setCollapsed] = useState(true);

  const stepGroups = test.steps.reduce((acc, step, index) => {
    if (!acc || acc.at(-1)?.at(-1)?.url !== step.url) {
      acc.push([{ ...step, index }]);
      return acc;
    } else {
      acc.at(-1)?.push({ ...step, index });
      return acc;
    }
  }, [] as UserJourneyStepIndexed[][]);

  return (
    <CollapsableSection
      label={
        <div>
          <Stack alignItems="center">
            <Badge
              color={test.success ? 'green' : 'red'}
              text=""
              icon={test.success ? 'check' : 'times'}
              tooltip={test.success ? 'Success' : 'Failed'}
            />
            {test.user_flow.title}
          </Stack>
        </div>
      }
      isOpen={!collapsed}
      onToggle={() => setCollapsed(!collapsed)}
    >
      <div style={{ paddingLeft: '32px', paddingRight: '16px', marginTop: '-20px', marginBottom: '-20px' }}>
        <h5>Summary</h5>
        <p>{test.summary}</p>

        <h5>Steps</h5>
        <Stack direction="column">
          {stepGroups.map((group, groupIndex) => (
            <PanelChrome key={`step-group-${groupIndex}`} title={group[0].url.replace('https://', '')}>
              {group.map((step) => (
                <CollapsableSection
                  key={`step-${step.index}`}
                  label={
                    <h6>
                      {step.index + 1}. {step.action}
                    </h6>
                  }
                  isOpen={false}
                >
                  <div style={{ paddingLeft: '32px', paddingRight: '16px', marginTop: '-10px', marginBottom: '-20px' }}>
                    <p>
                      <b>Goal: </b>
                      {step.goal}
                    </p>
                    <p>
                      <b>Result: </b>
                      {step.result}
                    </p>
                  </div>
                </CollapsableSection>
              ))}
            </PanelChrome>
          ))}
        </Stack>
      </div>
    </CollapsableSection>
  );
};
