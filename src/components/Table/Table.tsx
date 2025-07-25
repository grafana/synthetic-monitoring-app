import React from 'react';
import DataTable, { ExpanderComponentProps, TableColumn } from 'react-data-table-component';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Pagination, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { createTableTheme } from './tableTheme';

interface Props<T> {
  // Data to be displayed in the table
  data: T[];
  // Column definitions
  columns: Array<TableColumn<T>>;
  noDataText: string;
  // Actions to be performed when a row is clicked
  onRowClicked?(row: T): void;
  // Show pagination component, uses pagination from Grafana UI
  pagination: boolean;
  paginationPerPage?: number;
  pointerOnHover?: boolean;
  id: string;
  name: string;
  dataTableProps?: any;
  defaultSortField?: string;
  expandableRows?: boolean;
  // Component to be displayed when a row is expanded
  expandableComponent?: React.FC<ExpanderComponentProps<T>> | null;
  // Requires config object from '@grafana/runtime'
  expandTooltipText?: string;
}

export const Table = <T extends unknown>({
  data,
  columns,
  noDataText,
  onRowClicked,
  pagination,
  paginationPerPage = 15,
  pointerOnHover = true,
  id,
  name,
  dataTableProps = {},
  defaultSortField = undefined,
  expandableRows = false,
  expandableComponent = null,
  expandTooltipText = 'Actions and additional data',
}: Props<T>) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  createTableTheme(theme);

  return (
    <DataTable
      paginationDefaultPage={1}
      pagination={pagination}
      noDataComponent={noDataText}
      columns={columns}
      data={data}
      key={`${theme.name}`}
      id={id}
      name={name}
      theme={`grafana`}
      defaultSortFieldId={defaultSortField}
      highlightOnHover
      pointerOnHover={pointerOnHover}
      onRowClicked={(row: T) => (onRowClicked ? onRowClicked(row) : undefined)}
      paginationPerPage={paginationPerPage}
      expandableRows={expandableRows}
      expandableRowsComponent={expandableComponent}
      expandableIcon={{
        collapsed: (
          <Tooltip content={expandTooltipText} placement="top">
            <Icon size="lg" name="angle-right" style={{ color: theme.colors.text.primary }} />
          </Tooltip>
        ),
        expanded: <Icon size="lg" name="angle-down" style={{ color: theme.colors.text.primary }} />,
      }}
      paginationComponent={({ currentPage, rowCount, rowsPerPage, onChangePage }) => (
        <div className={styles.paginationWrapper}>
          <Pagination
            currentPage={currentPage}
            numberOfPages={Math.ceil(rowCount / rowsPerPage)}
            onNavigate={(toPage) => {
              onChangePage(toPage, rowCount);
            }}
          />
        </div>
      )}
      {...dataTableProps}
    />
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  paginationWrapper: css`
    display: flex;
    margin: ${theme.spacing(2)} 0 ${theme.spacing(1)};
    align-items: flex-end;
    justify-content: flex-end;
    position: relative;
  `,
  pageSize: css`
    margin-right: ${theme.spacing(1)};
  `,
  expandRow: css`
    padding: 20px 20px 20px 65px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    background: ${theme.colors.background.secondary};
  `,
  expandRowData: css`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;

    div {
      margin-right: 50px;

      p:first-child {
        font-weight: bold;
      }
    }
  `,
  expandRowActions: css`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  `,
});

export type { TableColumn, ExpanderComponentProps };
