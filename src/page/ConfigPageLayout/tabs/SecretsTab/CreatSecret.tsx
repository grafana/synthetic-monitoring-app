import React from 'react';

import { ConfigContent } from '../../components/ConfigContent';

export function CreateSecret() {
  return (
    <ConfigContent title="New Secret">
      <ConfigContent.Section>
        <h3>Create me</h3>
      </ConfigContent.Section>
    </ConfigContent>
  );
}
