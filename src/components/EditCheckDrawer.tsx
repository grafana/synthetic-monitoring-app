import React, { useContext, useState } from 'react';
import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
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

const appEvents = getAppEvents();
export function EditCheckDrawer({ checkId }: { checkId: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { checks, refetchChecks } = useContext(ChecksContext);
  const check = checks.find((c) => String(c.id) === checkId);
  if (!check) {
    return null;
  }
  const type = checkType(check.settings);
  function handleSuccess() {
    setDrawerOpen(false);
    refetchChecks();
    appEvents.publish({
      type: AppEvents.alertSuccess.name,
      payload: ['Check updated successfully. It will take a minute or two for changes to be reflected in the results.'],
    });
  }
  return (
    <>
      <Button onClick={() => setDrawerOpen(true)}>Edit</Button>
      {drawerOpen && (
        <Drawer title="Edit" size="md" onClose={handleSuccess}>
          {getCheckEditor(type, checkId, handleSuccess)}
        </Drawer>
      )}
    </>
  );
}
