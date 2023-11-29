import React, { useContext, useState } from 'react';
import { Button, Drawer } from '@grafana/ui';

import { CheckType } from 'types';
import { checkType } from 'utils';
import { ChecksContext } from 'contexts/ChecksContext';

import { MultiHttpSettingsForm } from './MultiHttp/MultiHttpSettingsForm';
import { CheckEditor } from './CheckEditor';
import { ScriptedCheckCodeEditor } from './ScriptedCheckCodeEditor';

function getCheckEditor(type: CheckType, checkId: string, callback: () => void) {
  switch (type) {
    case CheckType.MULTI_HTTP:
      return <MultiHttpSettingsForm />;
    case CheckType.K6:
      return <ScriptedCheckCodeEditor checkId={checkId} onSubmit={callback} />;
    default:
      return <CheckEditor onReturn={callback} />;
  }
}

export function EditCheckDrawer({ checkId, onClose, ...rest }: { checkId: string; onClose?: () => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { checks } = useContext(ChecksContext);
  const check = checks.find((c) => String(c.id) === checkId);
  if (!check) {
    return null;
  }
  const type = checkType(check.settings);
  function handleSuccess() {
    if (onClose) {
      onClose();
    }
    setDrawerOpen(false);
  }
  return (
    <>
      <Button
        onClick={() => {
          setDrawerOpen(true);
        }}
      >
        Edit
      </Button>
      {drawerOpen && (
        <Drawer title="Edit" size="md" onClose={handleSuccess}>
          {getCheckEditor(type, checkId, handleSuccess)}
        </Drawer>
      )}
    </>
  );
}
