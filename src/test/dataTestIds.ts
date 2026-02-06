import { CheckAlertType } from 'types';
import { FormSectionName } from 'components/Checkster/types';

export const ACTIONS_TEST_ID = {
  create: {
    check: 'action create check',
  },
} as const;

export const APP_INITIALIZER_TEST_ID = {
  root: 'app-init container',
  initButton: 'app-init init-button',
} as const;

export const ASSERTION_TEST_ID = {
  individual: 'individual-assertion',
  request: 'request-assertion',
  multiHttp: 'multihttp-request',
} as const;

export const CHECKS_TEST_ID = {
  card: 'check-card',
  emptyState: 'checks-empty-state',
  groupCard: 'check-group-card',
  usage: 'check-usage',
  form: {
    submitButton: 'check-form-submit-button',
    chooseType: 'choose-check-type',
  },
  filters: {
    search: 'check-search-input',
    status: 'check-status-filter',
    alerts: 'check-alerts-filter',
    probes: 'check-probes-filter',
  },
  header: {
    selectAll: 'select-all-checks',
    sortBy: 'sort-checks-by-combobox',
  },
  listItem: {
    editButton: 'edit-check-button',
  },
} as const;

export const CHECKSTER_TEST_ID = {
  navigation: {
    root: 'checkEditor navigation root',
    [FormSectionName.Check]: `checkEditor navigation ${FormSectionName.Check}`,
    [FormSectionName.Uptime]: `checkEditor navigation ${FormSectionName.Uptime}`,
    [FormSectionName.Labels]: `checkEditor navigation ${FormSectionName.Labels}`,
    [FormSectionName.Execution]: `checkEditor navigation ${FormSectionName.Execution}`,
    [FormSectionName.Alerting]: `checkEditor navigation ${FormSectionName.Alerting}`,
  },
  ui: {
    formTabs: {
      content: 'checkEditor formTabs content',
    },
  },
  form: {
    root: 'checkEditor form',
    submitButton: 'checkEditor form submit',
    inputs: {
      job: 'checkEditor form job',
      instance: 'checkEditor form instance',
      chooseAPICheckType: 'checkEditor form chooseAPICheckType',
      httpRequestMethod: 'checkEditor form httpRequestMethod',
      validStatusCodes: 'checkEditor form validStatusCodes',
      probeCheckbox: 'checkEditor form probeCheckbox',
      probeLabel: 'checkEditor form probeLabel',
    },
    components: {
      GenericNameValueField: {
        addButton: 'checkEditor nameValue addButton',
      },
      GenericLabelContent: {
        root: 'checkEditor genericLabelContent',
      },
    },
  },
  feature: {
    adhocCheck: {
      LogMessage: {
        checkIcon: 'checkEditor feat-adhoc-check LogMessage checkIcon',
      },
      TestButton: {
        root: 'checkEditor feat-adhoc-check testButton',
      },
    },
    terraform: {
      root: 'checkEditor feat-terraform root',
      tab: (format: 'hcl' | 'json') => `checkEditor feat-terraform tab-${format}`,
      copyButton: 'checkEditor feat-terraform copyButton',
      codeContent: 'checkEditor feat-terraform codeContent',
    },
    perCheckAlerts: {
      [CheckAlertType.ProbeFailedExecutionsTooHigh]: {
        selectedCheckbox: `checkEditor alerts ${CheckAlertType.ProbeFailedExecutionsTooHigh} selectedCheckbox`,
        periodCombobox: `checkEditor alerts ${CheckAlertType.ProbeFailedExecutionsTooHigh} periodCombobox`,
        thresholdInput: `checkEditor alerts ${CheckAlertType.ProbeFailedExecutionsTooHigh} thresholdInput`,
        runbookUrlInput: `checkEditor alerts ${CheckAlertType.ProbeFailedExecutionsTooHigh} runbookUrlInput`,
      },
      [CheckAlertType.TLSTargetCertificateCloseToExpiring]: {
        selectedCheckbox: `checkEditor alerts ${CheckAlertType.TLSTargetCertificateCloseToExpiring} selectedCheckbox`,
        periodCombobox: `not used for this alert`,
        thresholdInput: `checkEditor alerts ${CheckAlertType.TLSTargetCertificateCloseToExpiring} thresholdInput`,
        runbookUrlInput: `checkEditor alerts ${CheckAlertType.TLSTargetCertificateCloseToExpiring} runbookUrlInput`,
      },
      [CheckAlertType.HTTPRequestDurationTooHighAvg]: {
        selectedCheckbox: `checkEditor alerts ${CheckAlertType.HTTPRequestDurationTooHighAvg} selectedCheckbox`,
        periodCombobox: `checkEditor alerts ${CheckAlertType.HTTPRequestDurationTooHighAvg} periodCombobox`,
        thresholdInput: `checkEditor alerts ${CheckAlertType.HTTPRequestDurationTooHighAvg} thresholdInput`,
        runbookUrlInput: `checkEditor alerts ${CheckAlertType.HTTPRequestDurationTooHighAvg} runbookUrlInput`,
      },
      [CheckAlertType.PingRequestDurationTooHighAvg]: {
        selectedCheckbox: `checkEditor alerts ${CheckAlertType.PingRequestDurationTooHighAvg} selectedCheckbox`,
        periodCombobox: `checkEditor alerts ${CheckAlertType.PingRequestDurationTooHighAvg} periodCombobox`,
        thresholdInput: `checkEditor alerts ${CheckAlertType.PingRequestDurationTooHighAvg} thresholdInput`,
        runbookUrlInput: `checkEditor alerts ${CheckAlertType.PingRequestDurationTooHighAvg} runbookUrlInput`,
      },
      [CheckAlertType.DNSRequestDurationTooHighAvg]: {
        selectedCheckbox: `checkEditor alerts ${CheckAlertType.DNSRequestDurationTooHighAvg} selectedCheckbox`,
        periodCombobox: `checkEditor alerts ${CheckAlertType.DNSRequestDurationTooHighAvg} periodCombobox`,
        thresholdInput: `checkEditor alerts ${CheckAlertType.DNSRequestDurationTooHighAvg} thresholdInput`,
        runbookUrlInput: `checkEditor alerts ${CheckAlertType.DNSRequestDurationTooHighAvg} runbookUrlInput`,
      },
    },
  },
} as const;

export const CONFIG_TEST_ID = {
  content: 'config-content',
  contentLoading: 'config-content-loading',
  layout: {
    activeTab: 'config-page-layout-active-tab',
  },
} as const;

export const PLUGIN_TEST_ID = {
  configPage: 'test-plugin-config-page',
  linkedDatasources: 'test-plugin-config-page-linked-datasources',
  linkedDatasourcesError: 'test-plugin-config-page-linked-datasources-error',
} as const;

export const PROBES_TEST_ID = {
  cards: {
    status: 'probes cards status',
    statusTooltip: 'probes cards statusTooltip',
  },
  list: {
    private: 'private-probes-list',
    public: 'public-probes-list',
  },
  usageLink: 'probe-usage-link',
  button: 'probe-button',
  card: {
    actionButton: 'probe-card-action-button',
  },
} as const;

export const ROUTER_TEST_ID = {
  info: 'test-router-info',
  pathname: 'test-router-info-pathname',
  search: 'test-router-info-search',
} as const;

export const UI_TEST_ID = {
  actionsBar: 'actions-bar',
  centeredSpinner: 'centered-spinner',
  frequency: 'frequency-component',
  preformatted: 'preformatted',
  timepointList: 'timepoint-list',
  modals: {
    confirmUnsavedHeading: 'confirm-unsaved-modal-heading',
  },
  page: {
    notReady: 'page-not-ready',
    ready: 'page-ready',
  },
} as const;

export const GROT_SAD_TEST_ID = 'grotSad';

export const CODE_EDITOR_TEST_ID = 'code-editor';
export const ALERT_TEST_ID = {
  probePercentage: 'alert-probe-percentage',
  timeUnitCombobox: 'alert-rule-form-time-unit-combobox',
} as const;
export const ALERT_SENSITIVITY_INPUT_TEST_ID = 'alert-sensitivity-input';
export const CLIPBOARD_CONTENT_TEST_ID = 'clipboard-content';
export const SECRET_EDIT_MODAL_TEST_ID = 'secret-edit-modal';
export const THRESHOLD_SAVE_TEST_ID = 'threshold-save';
export const THRESHOLD_DEFAULTS_TEST_ID = 'threshold-defaults';
export const THRESHOLD_UPPER_LIMIT_TEST_ID = 'threshold-upper-limit';
export const THRESHOLD_LOWER_LIMIT_TEST_ID = 'threshold-lower-limit';
export const REFRESH_PICKER_RUN_BUTTON_TEST_ID = 'refresh-picker-run-button';
