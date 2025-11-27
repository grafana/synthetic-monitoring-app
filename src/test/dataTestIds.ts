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
  ACTIONS_BAR = 'actions-bar',
  CENTERED_SPINNER = 'centered-spinner',
  CHECK_FORM_SUBMIT_BUTTON = 'check-form-submit-button',
  CHECK_GROUP_CARD = 'check-group-card',
  CHECK_USAGE = 'check-usage',
  CHECKS_EMPTY_STATE = 'checks-empty-state',
  CHOOSE_CHECK_TYPE = 'choose-check-type',
  CONFIG_CONTENT = 'config-content',
  CONFIG_CONTENT_LOADING = 'config-content-loading',
  CONFIG_PAGE_LAYOUT_ACTIVE_TAB = 'config-page-layout-active-tab',
  CONFIRM_UNSAVED_MODAL_HEADING = 'confirm-unsaved-modal-heading',
  FREQUENCY_COMPONENT = 'frequency-component',
  INDIVIDUAL_ASSERTION = 'individual-assertion',
  MULTI_HTTP_REQUEST = 'multihttp-request',
  PAGE_NOT_READY = 'page-not-ready',
  PAGE_READY = 'page-ready',
  PREFORMATTED = 'preformatted',
  PRIVATE_PROBES_LIST = 'private-probes-list',
  PROBE_USAGE_LINK = 'probe-usage-link',
  PUBLIC_PROBES_LIST = 'public-probes-list',
  REQUEST_ASSERTION = 'request-assertion',
  TEST_PLUGIN_CONFIG_PAGE = 'test-plugin-config-page',
  TEST_PLUGIN_CONFIG_PAGE_LINKED_DATASOURCES = 'test-plugin-config-page-linked-datasources',
  TEST_PLUGIN_CONFIG_PAGE_LINKED_DATASOURCES_ERROR = 'test-plugin-config-page-linked-datasources-error',
  TEST_ROUTER_INFO = 'test-router-info',
  TEST_ROUTER_INFO_PATHNAME = 'test-router-info-pathname',
  TEST_ROUTER_INFO_SEARCH = 'test-router-info-search',
  TIMEPOINT_LIST = 'timepoint-list',
}
