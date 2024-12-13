import React from 'react';
import { Box, Column, Dropdown, Field, IconButton, Input, InteractiveTable, Menu, Tag, Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';

interface RowData {
  id: number;
  name: string;
  type: string;
  version?: number;
  labels?: Array<[string, string]>;
  created: string;
  modified: string;
  manager?: string;
  modified_by?: string;
  created_by?: string;
}

const styles = {
  centeredColumn: css`
    text-align: center;
  `,
  labelContainer: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  `,
  noLabel: css`
    opacity: 0.5;
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
    id: 'keeper',
    header: 'Keeper',
    cell(row) {
      return <div>{row.value ?? 'Default'}</div>;
    },
  },
  {
    id: 'labels',
    header: 'Labels',
    cell({ row, cell }) {
      if (!row.original.labels || !row.original.labels.length) {
        return <div className={styles.noLabel}>None</div>;
      }

      return (
        <div className={styles.labelContainer}>
          {row.original.labels.map(([key, value]) => {
            return <Tag key={key} name={`${key}/${value}`} />;
          })}
        </div>
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
  {
    id: 'created',
    header: 'Created',
    cell({ cell, row }) {
      return (
        <Tooltip interactive content={`by ${row.original.modified_by ?? 'unknown'}`}>
          <div>{cell.value}</div>
        </Tooltip>
      );
    },
  },
  {
    id: 'modified',
    header: 'Modified',
    cell({ cell, row }) {
      return (
        <Tooltip interactive content={`by ${row.original.created_by ?? 'unknown'}`}>
          <div>{cell.value}</div>
        </Tooltip>
      );
    },
  },
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
  { id: 1, name: 'PROD_ADMIN_PASSWORD', type: 'string', version: 1, modified: '2021-09-01', created: '2021-09-01' },
  {
    id: 1,
    name: 'PROD_ADMIN_PASSWORD',
    type: 'string',
    version: 1,
    modified: '2021-09-01',
    created: '2021-09-01',
  },
  {
    id: 2,
    name: 'PROD_USER_PASSWORD',
    type: 'string',
    version: 102,
    labels: [['environment', 'production']],
    created: '2021-09-01',
    modified: '2021-09-01',
    created_by: 'thomas.wikman@grafana.com',
    modified_by: 'thomas.wikman@grafana.com',
  },
  { id: 3, name: 'STAGING_ACCESS_TOKEN', type: 'string', version: 1, modified: '2021-09-01', created: '2021-09-01' },
  { id: 4, name: 'OKTA_TBT', type: 'Time-based token', version: 4, modified: '2021-09-01', created: '2021-09-01' },
  { id: 5, name: 'PROD_ACCESS_TOKEN', type: 'string', version: 1, modified: '2021-09-01', created: '2021-09-01' },
  {
    id: 6,
    name: 'OKTA_TBT_STAGING',
    type: 'Time-based token',
    labels: [
      ['environment', 'staging'],
      ['service', 'okta'],
      ['app', 'https://ezpz.se'],
    ],
    version: 9,
    modified: '2021-09-01',
    created: '2021-09-01',
  },
  {
    id: 7,
    name: 'SECRET_SOCIETY_PASSWORD',
    type: 'string',
    version: 9999,
    modified: '2024-11-27',
    labels: [
      ['team', 'sm-frontend'],
      ['soo', 'many'],
      ['labels-in', 'here'],
      ['how-wil-it-look', 'something like this'],
      ['foo', 'bar'],
      ['foobar', 'root'],
    ],
    created: '2021-09-01',
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
