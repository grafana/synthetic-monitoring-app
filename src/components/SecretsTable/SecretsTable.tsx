import React from 'react';
import { Box, Button, Column, Icon, InteractiveTable, Tag } from '@grafana/ui';

interface RowData {
  id: number;
  name: string;
  type: string;
  version?: number;
  labels?: Array<[string, string]>;
  modified: string;
}

const columns: Array<Column<RowData>> = [
  {
    id: 'name',
    header: 'Name',
    cell(cell) {
      return (
        <div>
          <code>{cell.row.original.name.toLowerCase()}</code>
        </div>
      );
    },
  },
  {
    id: 'labels',
    header: 'Labels',
    cell({ row }) {
      if (!row.original.labels || !row.original.labels.length) {
        return (
          <Button icon="plus" size="sm" variant="secondary">
            Add
          </Button>
        );
      }

      return (
        <Box display="flex" gap={1}>
          {row.original.labels.map(([key, value]) => {
            return <Tag key={key} name={`${key}/${value}`} />;
          })}
        </Box>
      );
    },
  },
  {
    id: 'type',
    header: 'Type',
    cell: (cell) =>
      cell.row.original.type === 'string' ? (
        <Icon color="crimson" name="text-fields" />
      ) : (
        <Icon color="#5bb0ef" name="clock-nine" />
      ),
  },
  { id: 'version', header: 'Version' },
  { id: 'modified', header: 'Modified' },
  {
    id: 'actions',
    header: '',
    cell: () => (
      <div>
        <Button fill="text" size="sm" variant="destructive">
          Delete
        </Button>
        &nbsp;
        <Button size="sm" variant="secondary">
          Edit
        </Button>
      </div>
    ),
  },
];

const rows: RowData[] = [
  { id: 1, name: 'PROD_ADMIN_PASSWORD', type: 'string', version: 1, modified: '2021-09-01' },
  {
    id: 2,
    name: 'PROD_USER_PASSWORD',
    type: 'string',
    version: 102,
    labels: [['environment', 'production']],
    modified: '2021-09-01',
  },
  { id: 3, name: 'STAGING_ACCESS_TOKEN', type: 'string', version: 1, modified: '2021-09-01' },
  { id: 4, name: 'OKTA_TBT', type: 'Time-based token', version: 4, modified: '2021-09-01' },
  { id: 5, name: 'PROD_ACCESS_TOKEN', type: 'string', version: 1, modified: '2021-09-01' },
  {
    id: 6,
    name: 'OKTA_TBT_STAGING',
    type: 'Time-based token',
    labels: [
      ['environment', 'staging'],
      ['service', 'okta'],
    ],
    version: 9,
    modified: '2021-09-01',
  },
];

export function SecretsTable() {
  return (
    <div>
      <InteractiveTable columns={columns} data={rows} getRowId={({ id }) => String(id)} renderExpandedRow={undefined} />
    </div>
  );
}
