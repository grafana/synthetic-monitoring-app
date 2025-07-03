import React, { useState } from 'react';
import { SceneComponentProps, SceneFlexItem, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Badge, CollapsableSection, PanelChrome, Stack } from '@grafana/ui';

import { UserJourneyStepIndexed, UserJourneyTest } from '../types';

import userJourneyTests from '../data/user-journeys.json';

interface UserJourneysTableState extends SceneObjectState {
  userJourneyTests: UserJourneyTest[];
}

export class UserJourneysTable extends SceneObjectBase<UserJourneysTableState> {
  static Component = UserJourneysTableRenderer;

  public constructor(state: UserJourneysTableState) {
    super(state);
  }

  public useUserJourneyTests() {
    return this.useState().userJourneyTests;
  }
}

function UserJourneysTableRenderer({ model }: SceneComponentProps<UserJourneysTable>) {
  const userJourneyTests = model.useUserJourneyTests();

  return (
    <div style={{ width: '100%', height: 'auto' }}>
      <PanelChrome title="User Journeys" description="User journeys discovered and analyzed by the AI agent">
        <Stack direction="column">
          {userJourneyTests.map((test) => (
            <UserJourneyTestItem key={test.user_flow.title} test={test} />
          ))}
        </Stack>
      </PanelChrome>
    </div>
  );
}

function UserJourneyTestItem({ test }: { test: UserJourneyTest }) {
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
                  </div>
                </CollapsableSection>
              ))}
            </PanelChrome>
          ))}
        </Stack>
      </div>
    </CollapsableSection>
  );
}
export function getUserJourneysTable() {
  return new SceneFlexItem({
    body: new UserJourneysTable({
      userJourneyTests: userJourneyTests,
    }),
  });
}
