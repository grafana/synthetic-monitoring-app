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

export const PROBES_TEST_ID = {
  cards: {
    status: 'probes cards status',
    statusTooltip: 'probes cards statusTooltip',
  },
} as const;

export const GROT_SAD_TEST_ID = 'grotSad';

// deprecated -- look to migrate these to follow the same patterns as above
export enum DataTestIds {
  ActionsBar = 'actions-bar',
  AlertProbePercentage = 'alert-probe-percentage',
  AlertRuleFormTimeUnitCombobox = 'alert-rule-form-time-unit-combobox',
  AlertSensitivityInput = 'alert-sensitivity-input',
  CenteredSpinner = 'centered-spinner',
  CheckAlertsFilter = 'check-alerts-filter',
  CheckCard = 'check-card',
  CheckFormSubmitButton = 'check-form-submit-button',
  CheckGroupCard = 'check-group-card',
  CheckSearchInput = 'check-search-input',
  CheckStatusFilter = 'check-status-filter',
  CheckUsage = 'check-usage',
  ChecksEmptyState = 'checks-empty-state',
  ChooseCheckType = 'choose-check-type',
  ClipboardContent = 'clipboard-content',
  CodeEditor = 'code-editor',
  ConfigContent = 'config-content',
  ConfigContentLoading = 'config-content-loading',
  ConfigPageLayoutActiveTab = 'config-page-layout-active-tab',
  ConfirmUnsavedModalHeading = 'confirm-unsaved-modal-heading',
  EditCheckButton = 'edit-check-button',
  FrequencyComponent = 'frequency-component',
  IndividualAssertion = 'individual-assertion',
  MultiHttpRequest = 'multihttp-request',
  PageNotReady = 'page-not-ready',
  PageReady = 'page-ready',
  Preformatted = 'preformatted',
  PrivateProbesList = 'private-probes-list',
  ProbeButton = 'probe-button',
  ProbeCardActionButton = 'probe-card-action-button',
  ProbeUsageLink = 'probe-usage-link',
  PublicProbesList = 'public-probes-list',
  RefreshPickerRunButton = 'refresh-picker-run-button',
  RequestAssertion = 'request-assertion',
  SecretEditModal = 'secret-edit-modal',
  SelectAllChecks = 'select-all-checks',
  SortChecksByCombobox = 'sort-checks-by-combobox',
  TestPluginConfigPage = 'test-plugin-config-page',
  TestPluginConfigPageLinkedDatasources = 'test-plugin-config-page-linked-datasources',
  TestPluginConfigPageLinkedDatasourcesError = 'test-plugin-config-page-linked-datasources-error',
  TestRouterInfo = 'test-router-info',
  TestRouterInfoPathname = 'test-router-info-pathname',
  TestRouterInfoSearch = 'test-router-info-search',
  ThresholdDefaults = 'threshold-defaults',
  ThresholdLowerLimit = 'threshold-lower-limit',
  ThresholdSave = 'threshold-save',
  ThresholdUpperLimit = 'threshold-upper-limit',
  TimepointList = 'timepoint-list',
}
