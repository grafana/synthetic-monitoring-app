import React from 'react';
import { Box, Column, InteractiveTable, LinkButton, Tag, Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';

import { ROUTES } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { Secret } from 'datasource/types';

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

const columns: Array<Column<Secret>> = [
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
        <Tooltip interactive content={`by ${row.original.created_by ?? 'unknown'}`}>
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
    id: 'labels',
    header: 'Labels',
    cell({ row, cell }) {
      if (!row.original.labels || !row.original.labels.length) {
        return <div className={styles.noLabel}>None</div>;
      }

      return (
        <div className={styles.labelContainer}>
          {row.original.labels.map(({ name, value }) => {
            return <Tag colorIndex={11} key={name} name={`${name}/${value}`} />;
          })}
        </div>
      );
    },
  },

  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Box display="flex" justifyContent="flex-end" gap={1}>
        <LinkButton aria-label="Delete" icon="trash-alt" variant="destructive" fill="text" />
        <LinkButton
          aria-label="Edit"
          icon="pen"
          variant="secondary"
          fill="text"
          href={generateRoutePath(ROUTES.EditSecret, { id: row.id })}
        />
        {/*<Dropdown*/}
        {/*  placement="bottom-end"*/}
        {/*  overlay={*/}
        {/*    <Menu>*/}
        {/*      <Menu.Item label="Edit" icon="pen" />*/}
        {/*      <Menu.Item label="Delete" icon="trash-alt" destructive />*/}
        {/*    </Menu>*/}
        {/*  }*/}
        {/*>*/}
        {/*  <IconButton aria-label="Open secret actions menu" name="ellipsis-v" size="lg" />*/}
        {/*</Dropdown>*/}
      </Box>
    ),
  },
];

export function SecretsTable({ secrets }: { secrets?: Secret[] }) {
  if (!secrets) {
    return <div>Loading...</div>;
  }
  return (
    <InteractiveTable columns={columns} data={secrets} getRowId={({ uuid }) => uuid} renderExpandedRow={undefined} />
  );
}
