import React from 'react';
import { Box, Button, Column, Dropdown, Field, IconButton, Input, InteractiveTable, Menu, Tag } from '@grafana/ui';
import { css } from '@emotion/css';

interface RowData {
  id: number;
  name: string;
  type: string;
  version?: number;
  labels?: Array<[string, string]>;
  modified: string;
}

const styles = {
  centeredColumn: css`
    text-align: center;
  `,
};

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
  // {
  //   id: 'type',
  //   header: 'Type',
  //   cell: (cell) =>
  //     cell.row.original.type === 'string' ? (
  //       <Icon color="crimson" name="text-fields" />
  //     ) : (
  //       <Icon color="#5bb0ef" name="clock-nine" />
  //     ),
  // },
  {
    id: 'version',
    // @ts-expect-error Supplied types are invalid
    header: () => <div className={styles.centeredColumn}>Version</div>,
    cell({ cell }) {
      return <div className={styles.centeredColumn}>{cell.value}</div>;
    },
  },
  { id: 'modified', header: 'Modified' },
  {
    id: 'actions',
    header: undefined,
    cell: () => (
      <Box display="flex" justifyContent="flex-end">
        <Dropdown
          placement="bottom-end"
          overlay={
            <Menu>
              <Menu.Item label="Edit" icon="pen" />
              <Menu.Item label="Delete" icon="trash-alt" destructive />
            </Menu>
          }
        >
          <IconButton aria-label="Open secret actions menu" name="ellipsis-v" size="lg" />
        </Dropdown>
      </Box>
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
  {
    id: 7,
    name: 'SECRET_SOCIETY_PASSWORD',
    type: 'string',
    version: 9999,
    modified: '2024-11-27',
    labels: [
      ['team', 'sm-frontend'],
      ['do/not', 'use'],
    ],
  },
];

export function SecretsTable() {
  return (
    <div>
      <Field label="Filter data">
        <Input placeholder={'Filter by name'} onChange={(event) => {}} />
      </Field>
      <InteractiveTable columns={columns} data={rows} getRowId={({ id }) => String(id)} renderExpandedRow={undefined} />
    </div>
  );
}
