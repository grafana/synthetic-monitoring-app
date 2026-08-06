export const CHECKS_TEST_ID = {
  card: 'checks card',
  emptyState: 'checks empty-state',
  groupCard: 'checks group-card',
  usage: 'checks usage',
  form: {
    chooseType: 'checks form choose-type',
  },
  filters: {
    search: 'checks filters search',
    status: 'checks filters status',
    alerts: 'checks filters alerts',
    probes: 'checks filters probes',
  },
  header: {
    selectAll: 'checks header select-all',
    sortBy: 'checks header sort-by',
  },
  listItem: {
    editButton: 'checks list-item edit-button',
  },
} as const;

export const SCENES_TEST_ID = {
  timepoint: {
    list: 'scenes timepoint list',
    listEntryBar: 'scenes timepoint list-entry-bar',
    viewer: 'scenes timepoint viewer',
  },
} as const;
