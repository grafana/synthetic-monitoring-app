import React, { useContext } from 'react';
import { Table } from '@grafana/cloud-features';
import { config, PluginPage } from '@grafana/runtime';
import { SceneComponentProps, sceneGraph, SceneObjectBase } from '@grafana/scenes';
import { LoadingState } from '@grafana/schema';
import { Alert, Drawer, IconButton, LoadingPlaceholder } from '@grafana/ui';

import { Check, ROUTES } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { useNavigation } from 'hooks/useNavigation';

import { ScriptedCheckCodeEditor } from './ScriptedCheckCodeEditor';

interface DataTableScriptedCheck extends Check {
  up?: number;
  uptime?: number;
  reachability?: number;
  notFound?: boolean;
}

export class ScriptedChecksListSceneObject extends SceneObjectBase {
  static Component = ScriptedCheckList;
}

export function ScriptedCheckList({ model }: SceneComponentProps<any>) {
  const navigate = useNavigation();
  const { scriptedChecks: checks, refetchChecks } = useContext(ChecksContext);
  const [editCheck, setEditCheck] = React.useState<Check | undefined>(undefined);

  const data = sceneGraph.getData(model).useState();
  const fields = data.data?.series?.[0]?.fields;
  const tableData = checks.map((check) => {
    const dataIndex = data.data?.series?.[0]?.fields?.[0]?.values.findIndex((v) => v === check.job);
    if (dataIndex === undefined || dataIndex < 0) {
      return {
        ...check,
        notFound: true,
      };
    }
    return {
      ...check,
      up: fields?.[3]?.values?.[dataIndex],
      uptime: fields?.[4]?.values?.[dataIndex],
      reachability: fields?.[5]?.values?.[dataIndex],
      notFound: false,
    };
  });

  const columns = [
    {
      sortable: true,
      selector: (row: DataTableScriptedCheck) => row.up,
      cell: (row: DataTableScriptedCheck) => {
        if (row.up === undefined) {
          return <div></div>;
        }
        if (row.up === 1) {
          return <div>Up</div>;
        }
        return <div>Down</div>;
      },
    },
    {
      name: 'job',
      sortable: true,
      selector: (row: DataTableScriptedCheck) => row.job,
    },
    {
      name: 'interface',
      sortable: true,
      selector: (row: DataTableScriptedCheck) => row.target,
    },
    {
      name: 'uptime',
      sortable: true,
      selector: (row: DataTableScriptedCheck) => row.uptime,
      cell: (row: DataTableScriptedCheck) => {
        if (!row.uptime) {
          return <div></div>;
        }
        const percent = row.uptime * 100;
        if (percent === 100) {
          return <div>{percent}%</div>;
        }
        return <div>{percent.toFixed(2)}%</div>;
      },
    },

    {
      name: 'probes',
      sortable: true,
      selector: (row: DataTableScriptedCheck) => row.probes,
    },
    {
      cell: (row: DataTableScriptedCheck) => {
        return (
          <IconButton
            name="edit"
            aria-label="Edit check"
            onClick={() => {
              console.log('edit', row.id);
              setEditCheck(row);
            }}
          />
        );
      },
    },
  ];

  if (checks.length === 0) {
    return (
      <PluginPage pageNav={{ text: 'Scripted checks' }}>
        <Alert
          severity="info"
          title="Grafana Cloud Synthetic Monitoring"
          buttonContent={<span>New Check</span>}
          onRemove={() => navigate(`${ROUTES.ScriptedChecks}/new`)}
        >
          This account does not currently have any scripted checks configured. Click the New Check button to start
          monitoring your services with Grafana Cloud, or{' '}
          <a href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/">
            check out the Synthetic Monitoring docs.
          </a>
        </Alert>
      </PluginPage>
    );
  }

  if (data.data?.state === LoadingState.Loading) {
    return <LoadingPlaceholder text={undefined} />;
  }
  return (
    <div>
      <Table<DataTableScriptedCheck>
        id="scripted-checks-table"
        name="scripted-checks-table"
        noDataText="No scripted checks found"
        columns={columns}
        config={config}
        data={tableData}
        pagination
      />
      {editCheck && (
        <Drawer
          title={`Editing ${editCheck.job}`}
          size="md"
          onClose={() => {
            setEditCheck(undefined);
          }}
        >
          <ScriptedCheckCodeEditor
            onSubmit={(values: any, errors: any) => {
              console.log(values);
              refetchChecks();
              return Promise.resolve();
            }}
            saving={false}
          />
        </Drawer>
      )}
    </div>
  );
}
