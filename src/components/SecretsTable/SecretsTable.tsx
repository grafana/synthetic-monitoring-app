import React from 'react';
import { Button, Column, Icon, InteractiveTable } from '@grafana/ui';

interface RowData {
  id: number;
  name: string;
  type: string;
  description?: string;
  modified: string;
}

const columns: Array<Column<RowData>> = [
  {
    id: 'name',
    header: 'Name',
    cell(cell) {
      return (
        <div>
          <code>{cell.row.original.name}</code>
        </div>
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
  { id: 'description', header: 'Description' },
  { id: 'modified', header: 'Modified' },
  {
    id: 'actions',
    header: '',
    cell: () => (
      <div>
        <Button size="sm" variant="destructive">
          Delete
        </Button>
        &nbsp;
        <Button size="sm" variant="secondary">
          Update
        </Button>
      </div>
    ),
  },
];

const rows: RowData[] = [
  { id: 1, name: 'PROD_ADMIN_PASSWORD', type: 'string', description: 'My secret', modified: '2021-09-01' },
  { id: 2, name: 'PROD_USER_PASSWORD', type: 'string', description: 'My secret', modified: '2021-09-01' },
  { id: 3, name: 'STAGING_ACCESS_TOKEN', type: 'string', description: 'My secret', modified: '2021-09-01' },
  { id: 4, name: 'OKTA_TBT', type: 'Time-based token', description: 'My secret', modified: '2021-09-01' },
  { id: 5, name: 'PROD_ACCESS_TOKEN', type: 'string', description: 'My secret', modified: '2021-09-01' },
  { id: 6, name: 'OKTA_TBT_STAGING', type: 'Time-based token', description: 'My secret', modified: '2021-09-01' },
];

export function SecretsTable() {
  return (
    <div>
      <InteractiveTable columns={columns} data={rows} getRowId={({ id }) => String(id)} renderExpandedRow={undefined} />
    </div>
  );
}
