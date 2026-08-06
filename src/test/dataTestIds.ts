import { CheckAlertType } from 'types';
import { FormSectionName } from 'components/Checkster/types';

export { CHECKS_TEST_ID, SCENES_TEST_ID } from './dataTestIds.constants';

export const ACTIONS_TEST_ID = {
  create: {
    check: 'action create check',
  },
} as const;

export const ALERT_TEST_ID = {
  probePercentage: 'alert probe-percentage',
  timeUnitCombobox: 'alert time-unit-combobox',
  sensitivityInput: 'alert sensitivity-input',
} as const;

export const APP_INITIALIZER_TEST_ID = {
  root: 'app-init container',
  initButton: 'app-init init-button',
  autoInitSpinner: 'app-init auto-init-spinner',
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
  content: 'config content',
  contentLoading: 'config content-loading',
  layout: {
    activeTab: 'config layout active-tab',
  },
  secretEditModal: 'config secret-edit-modal',
} as const;

export const PLUGIN_TEST_ID = {
  configPage: 'plugin config-page',
  linkedDatasources: 'plugin linked-datasources',
  linkedDatasourcesError: 'plugin linked-datasources-error',
} as const;

export const PROBES_TEST_ID = {
  cards: {
    status: 'probes cards status',
    statusTooltip: 'probes cards statusTooltip',
  },
  list: {
    private: 'probes list private',
    public: 'probes list public',
  },
  button: 'probes button',
  card: {
    actionButton: 'probes card action-button',
  },
  usageLink: 'probes usage-link',
  checkExecutionStats: 'probes check-execution-stats',
} as const;

export const ROUTER_TEST_ID = {
  info: 'router info',
  pathname: 'router pathname',
  search: 'router search',
} as const;

export const THRESHOLD_TEST_ID = {
  save: 'threshold save',
  defaults: 'threshold defaults',
  upperLimit: 'threshold upper-limit',
  lowerLimit: 'threshold lower-limit',
} as const;

export const UI_TEST_ID = {
  centeredSpinner: 'ui centered-spinner',
  frequency: 'ui frequency',
  preformatted: 'ui preformatted',
  codeEditor: 'ui code-editor',
  modals: {
    confirmUnsavedHeading: 'ui modals confirm-unsaved-heading',
  },
  page: {
    ready: 'ui page ready',
    notReady: 'ui page not-ready',
  },
  refreshPicker: {
    runButton: 'refresh-picker-run-button',
  },
} as const;

export const LOGS_TEST_ID = {
  executionId: 'logs execution-id',
} as const;

export const GROT_SAD_TEST_ID = 'grotSad';
