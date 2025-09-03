# Analytics Events

_This document is generated automatically and should not be edited directly. To see how to generate this document, see [docs/analytics/analytics.md](./analytics.md#generating-the-analytics-eventsmd-file)._

This document contains all the analytics events that are defined in the project.

## Events

### check_creation

#### synthetic-monitoring_check_creation_add_new_check_button_clicked

Tracks when the "Add New Check" button is clicked.

##### Properties

| name   | type                         | description                                |
| ------ | ---------------------------- | ------------------------------------------ |
| source | `"check-list" \| "homepage"` | What location the button was clicked from. |

#### synthetic-monitoring_check_creation_add_check_type_group_button_clicked

Tracks when the Primary Button of the check type card is clicked.

##### Properties

| name           | type                                                       | description                        |
| -------------- | ---------------------------------------------------------- | ---------------------------------- |
| checkTypeGroup | `"api-endpoint" \| "multistep" \| "scripted" \| "browser"` | The check group type of the check. |

#### synthetic-monitoring_check_creation_add_check_type_button_clicked

Tracks when the 'protocol' buttons on the check type card are clicked.

##### Properties

| name           | type                                                       | description                        |
| -------------- | ---------------------------------------------------------- | ---------------------------------- |
| checkTypeGroup | `"api-endpoint" \| "multistep" \| "scripted" \| "browser"` | The check group type of the check. |
| protocol       | `string`                                                   | The protocol of the check.         |

### check_form

#### synthetic-monitoring_check_form_navigate_wizard_form_button_clicked

Tracks navigation events within the check form wizard.

##### Properties

| name      | type                                                                                                     | description                                     |
| --------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check.                              |
| step      | `string`                                                                                                 | The current step in the wizard.                 |
| component | `"forward-button" \| "back-button" \| "stepper"`                                                         | The UI component that triggered the navigation. |

#### synthetic-monitoring_check_form_adhoc_test_created

Tracks when an adhoc test is successfully created.

##### Properties

| name       | type                                                                                                     | description                           |
| ---------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| checkType  | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check.                    |
| checkState | `"new" \| "existing"`                                                                                    | Whether the check is new or existing. |

#### synthetic-monitoring_check_form_check_created

Tracks when a check is successfully created.

##### Properties

| name      | type                                                                                                     | description        |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------------ |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check. |

#### synthetic-monitoring_check_form_check_updated

Tracks when a check is successfully updated.

##### Properties

| name      | type                                                                                                     | description        |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------------ |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check. |

### feature_feedback

#### synthetic-monitoring_feature_feedback_feature_feedback_submitted

Tracks when a feature feedback thumbs up or a thumbs down is clicked.

##### Properties

| name     | type              | description                  |
| -------- | ----------------- | ---------------------------- |
| feature  | `string`          | The type of feature.         |
| reaction | `"good" \| "bad"` | The reaction to the feature. |

#### synthetic-monitoring_feature_feedback_feature_feedback_comment_submitted

Tracks when a feature feedback comment is submitted.

##### Properties

| name     | type              | description                  |
| -------- | ----------------- | ---------------------------- |
| feature  | `string`          | The type of feature.         |
| reaction | `"good" \| "bad"` | The reaction to the feature. |
| comment  | `string`          | The comment text.            |

### per_check_alerts

#### synthetic-monitoring_per_check_alerts_select_alert

Tracks when an alert is selected from the per-check alerts list

##### Properties

| name | type                                                                                                                                                                              | description           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| name | `"ProbeFailedExecutionsTooHigh" \| "TLSTargetCertificateCloseToExpiring" \| "HTTPRequestDurationTooHighAvg" \| "PingRequestDurationTooHighAvg" \| "DNSRequestDurationTooHighAvg"` | The name of the alert |

#### synthetic-monitoring_per_check_alerts_unselect_alert

Tracks when an alert is unselected from the per-check alerts list

##### Properties

| name | type                                                                                                                                                                              | description           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| name | `"ProbeFailedExecutionsTooHigh" \| "TLSTargetCertificateCloseToExpiring" \| "HTTPRequestDurationTooHighAvg" \| "PingRequestDurationTooHighAvg" \| "DNSRequestDurationTooHighAvg"` | The name of the alert |

#### synthetic-monitoring_per_check_alerts_change_period

Tracks when the period of an alert is changed

##### Properties

| name   | type                                                                                                                                                                              | description             |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| name   | `"ProbeFailedExecutionsTooHigh" \| "TLSTargetCertificateCloseToExpiring" \| "HTTPRequestDurationTooHighAvg" \| "PingRequestDurationTooHighAvg" \| "DNSRequestDurationTooHighAvg"` | The name of the alert   |
| period | `string`                                                                                                                                                                          | The period of the alert |

#### synthetic-monitoring_per_check_alerts_change_threshold

Tracks when the threshold of an alert is changed

##### Properties

| name      | type                                                                                                                                                                              | description                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| name      | `"ProbeFailedExecutionsTooHigh" \| "TLSTargetCertificateCloseToExpiring" \| "HTTPRequestDurationTooHighAvg" \| "PingRequestDurationTooHighAvg" \| "DNSRequestDurationTooHighAvg"` | The name of the alert      |
| threshold | `string`                                                                                                                                                                          | The threshold of the alert |

#### synthetic-monitoring_per_check_alerts_creation_success

Tracks when an alert is created successfully

##### Properties

| name | type                                                                                                                                                                              | description           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| name | `"ProbeFailedExecutionsTooHigh" \| "TLSTargetCertificateCloseToExpiring" \| "HTTPRequestDurationTooHighAvg" \| "PingRequestDurationTooHighAvg" \| "DNSRequestDurationTooHighAvg"` | The name of the alert |

#### synthetic-monitoring_per_check_alerts_deletion_success

Tracks when an alert is deleted successfully

##### Properties

| name | type                                                                                                                                                                              | description           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| name | `"ProbeFailedExecutionsTooHigh" \| "TLSTargetCertificateCloseToExpiring" \| "HTTPRequestDurationTooHighAvg" \| "PingRequestDurationTooHighAvg" \| "DNSRequestDurationTooHighAvg"` | The name of the alert |

### timepoint_explorer

#### synthetic-monitoring_timepoint_explorer_view_toggle

Tracks when the Timepoint Explorer view type is changed.

##### Properties

| name     | type     | description    |
| -------- | -------- | -------------- |
| viewMode | `string` | The view type. |

#### synthetic-monitoring_timepoint_explorer_mini_map_section_clicked

Tracks when a section of the Timepoint Explorer mini map is clicked.

##### Properties

| name      | type                                         | description                                                |
| --------- | -------------------------------------------- | ---------------------------------------------------------- |
| index     | `number`                                     | The index of the section of the mini map that was clicked. |
| component | `"left-arrow" \| "right-arrow" \| "section"` | The UI component that was clicked.                         |

#### synthetic-monitoring_timepoint_explorer_mini_map_page_clicked

Tracks when the Timepoint Explorer mini map page is changed.

##### Properties

| name  | type     | description                             |
| ----- | -------- | --------------------------------------- |
| index | `number` | The index of the page that was clicked. |

#### synthetic-monitoring_timepoint_explorer_timepoint_click

Tracks when a probe entry in the Timepoint Viewer is clicked.

##### Properties

| name      | type                                                                                     | description                                              |
| --------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| component | `"tooltip" \| "reachability-entry" \| "viewer-tab" \| "uptime-entry" \| "pending-entry"` | The UI component that was clicked.                       |
| status    | `"success" \| "failure" \| "missing" \| "pending"`                                       | The status of the Timepoint List entry that was clicked. |

#### synthetic-monitoring_timepoint_explorer_timepoint_viz_legend_toggled

Tracks when a Timepoint Viz Legend is clicked.

##### Properties

| name       | type     | description                        |
| ---------- | -------- | ---------------------------------- |
| vizOptions | `string` | The viz options that were toggled. |

#### synthetic-monitoring_timepoint_explorer_timepoint_viz_legend_color_clicked

Tracks when a Timepoint Viz Legend color is clicked.

##### Properties

| name      | type                                               | description                                   |
| --------- | -------------------------------------------------- | --------------------------------------------- |
| color     | `string`                                           | The color of the viz option that was clicked. |
| vizOption | `"success" \| "failure" \| "missing" \| "pending"` | The viz option that was clicked.              |

#### synthetic-monitoring_timepoint_explorer_timepoint_viewer_action_clicked

Tracks when a Timepoint Viewer action is clicked

##### Properties

| name   | type                                                                                        | description                  |
| ------ | ------------------------------------------------------------------------------------------- | ---------------------------- |
| action | `"previous-timepoint" \| "next-timepoint" \| "view-explore-logs" \| "view-explore-metrics"` | The action that was clicked. |

#### synthetic-monitoring_timepoint_explorer_timepoint_viewer_logs_view_toggled

Tracks when the Timepoint Viewer logs view is toggled

##### Properties

| name   | type                    | description                  |
| ------ | ----------------------- | ---------------------------- |
| action | `"event" \| "raw-logs"` | The action that was clicked. |
