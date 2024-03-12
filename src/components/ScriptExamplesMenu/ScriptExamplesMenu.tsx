import React from 'react';
import { Button, Dropdown, Menu } from '@grafana/ui';

import { SCRIPT_EXAMPLE_CHOICES } from './constants';

interface ScriptExamplesMenuProps {
  onSelectExample: (script: string) => void;
}

export const ScriptExamplesMenu = ({ onSelectExample }: ScriptExamplesMenuProps) => {
  return (
    <Dropdown
      placement="bottom-end"
      overlay={
        <Menu>
          {SCRIPT_EXAMPLE_CHOICES.map(({ label, options }) => (
            <Menu.Item
              key={label}
              label={label}
              childItems={options.map(({ label, script }) => (
                <Menu.Item key={label} label={label!} onClick={() => onSelectExample(script)} />
              ))}
            />
          ))}
        </Menu>
      }
    >
      <Button type="button" variant="secondary" icon="angle-down" fill="text">
        Script Examples
      </Button>
    </Dropdown>
  );
};
