# Analytics Events

_This document is generated automatically and should not be edited directly. To see how to generate this document, see [docs/analytics/analytics.md](./analytics.md#generating-the-analytics-eventsmd-file)._

This document contains all the analytics events that are defined in the project.

## Events

### check_creation

#### synthetic-monitoring_check_creation_add_new_check_button_clicked

Tracks when the "Create New Check" button is clicked.

##### Properties

| name   | type                                                     | description                                |
| ------ | -------------------------------------------------------- | ------------------------------------------ |
| source | `"check-list-empty-state" \| "check-list" \| "homepage"` | What location the button was clicked from. |

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

### check_dashboard

#### synthetic-monitoring_check_dashboard_viewed

Tracks when a check dashboard is viewed.

##### Properties

| name        | type                                                                                                     | description                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| checkType   | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check the dashboard belongs to.                                                                             |
| hasFailures | `undefined \| false \| true`                                                                             | Whether the check had any failed executions in the queried time period. Undefined when uptime could not be determined.  |
| uptime      | `undefined \| number`                                                                                    | The uptime percentage (0-100) of the check over the queried time period. Undefined when uptime could not be determined. |

### check_form

#### synthetic-monitoring_check_form_navigate_wizard_form_button_clicked

Tracks navigation events within the check form wizard.

##### Properties

| name      | type                                                                                                     | description                                     |
| --------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check.                              |
| step      | `"check" \| "uptime" \| "labels" \| "execution" \| "alerting"`                                           | The current step in the wizard.                 |
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

#### synthetic-monitoring_check_form_need_help_scripts_button_clicked

Tracks when the 'need help writing scripts' button is clicked.

##### Properties

| name   | type     | description                      |
| ------ | -------- | -------------------------------- |
| source | `string` | The source of the clicked button |

#### synthetic-monitoring_check_form_feature_tab_changed

Tracks when a feature tab is changed.

##### Properties

| name  | type     | description                   |
| ----- | -------- | ----------------------------- |
| label | `string` | The label of the feature tab. |

#### synthetic-monitoring_check_form_k6_channel_selected

Tracks when a k6 version channel is selected.

##### Properties

| name        | type                                                                                                     | description                       |
| ----------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| checkType   | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check.                |
| channelName | `string`                                                                                                 | The name of the selected channel. |

#### synthetic-monitoring_check_form_k6_channel_retry_clicked

Tracks when the retry button is clicked after k6 channels fail to load.

#### synthetic-monitoring_check_form_terraform_format_changed

Tracks when the Terraform format is changed.

##### Properties

| name   | type              | description                                    |
| ------ | ----------------- | ---------------------------------------------- |
| format | `"hcl" \| "json"` | The format that was switched to (hcl or json). |

#### synthetic-monitoring_check_form_terraform_config_copied

Tracks when Terraform configuration is copied.

##### Properties

| name   | type              | description                                    |
| ------ | ----------------- | ---------------------------------------------- |
| format | `"hcl" \| "json"` | The format that was switched to (hcl or json). |

#### synthetic-monitoring_check_form_terraform_full_config_clicked

Tracks when the full configuration link is clicked.

#### synthetic-monitoring_check_form_example_script_selected

Tracks when an example script is selected in the check form.

##### Properties

| name   | type     | description                                          |
| ------ | -------- | ---------------------------------------------------- |
| script | `string` | The value identifier of the selected example script. |

#### synthetic-monitoring_check_form_example_script_copied

Tracks when an example script is copied in the check form.

##### Properties

| name   | type     | description                                          |
| ------ | -------- | ---------------------------------------------------- |
| script | `string` | The value identifier of the selected example script. |

### check_list

#### synthetic-monitoring_check_list_duplicate_check_button_clicked

Tracks when the duplicate check button is clicked.

##### Properties

| name      | type                                                                                                     | description                         |
| --------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check being duplicated. |

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

### folders

#### synthetic-monitoring_folders_folder_selected

Tracks when a folder is selected in the folder selector.

##### Properties

| name      | type            | description                                           |
| --------- | --------------- | ----------------------------------------------------- |
| isDefault | `false \| true` | Whether the selected folder is the default SM folder. |

#### synthetic-monitoring_folders_folder_created

Tracks when a new folder is created via the folder selector.

### link

#### synthetic-monitoring_link_clicked

Tracks when a link is clicked.

##### Properties

| name     | type     | description                      |
| -------- | -------- | -------------------------------- |
| href     | `string` | The href of the clicked link     |
| hostname | `string` | The hostname of the clicked link |
| path     | `string` | The path of the clicked link     |
| search   | `string` | The search of the clicked link   |
| source   | `string` | Where the link was clicked from  |

### onboarding

#### synthetic-monitoring_onboarding_auto_initialized

Tracks a successful auto-initialization from a deep-link.

##### Properties

| name  | type     | description                                   |
| ----- | -------- | --------------------------------------------- |
| route | `string` | The route that triggered auto-initialization. |

#### synthetic-monitoring_onboarding_auto_initialize_failed

Tracks a failed auto-initialization from a deep-link.

##### Properties

| name   | type     | description                                   |
| ------ | -------- | --------------------------------------------- |
| route  | `string` | The route that triggered auto-initialization. |
| reason | `string` | Why initialization failed.                    |

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

#### synthetic-monitoring_per_check_alerts_routing_preview_toggled

Tracks when the routing preview is toggled for an alert

##### Properties

| name   | type                                                                                                                                                                              | description                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| name   | `"ProbeFailedExecutionsTooHigh" \| "TLSTargetCertificateCloseToExpiring" \| "HTTPRequestDurationTooHighAvg" \| "PingRequestDurationTooHighAvg" \| "DNSRequestDurationTooHighAvg"` | The name of the alert                                |
| action | `"show" \| "hide"`                                                                                                                                                                | Whether the routing preview is being shown or hidden |

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

### screenshots

#### synthetic-monitoring_screenshots_expanded

Tracks when a screenshot thumbnail is clicked to expand.

##### Properties

| name       | type                | description                           |
| ---------- | ------------------- | ------------------------------------- |
| hasCaption | `false \| true`     | Whether the screenshot has a caption. |
| source     | `"base64" \| "url"` | The source type of the screenshot.    |

#### synthetic-monitoring_screenshots_dismissed

Tracks when an expanded screenshot modal is dismissed.

#### synthetic-monitoring_screenshots_hide_toggled

Tracks when the hide screenshots toggle is changed.

##### Properties

| name   | type            | description                         |
| ------ | --------------- | ----------------------------------- |
| hidden | `false \| true` | Whether screenshots are now hidden. |

### secrets_management

#### synthetic-monitoring_secrets_management_create_secret_button_clicked

Tracks when the create secret button is clicked.

##### Properties

| name     | type                                                                 | description                                                       |
| -------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| source   | `"check_editor_sidepanel_feature_tabs" \| "config_page_secrets_tab"` | The source context where the secrets management UI is being used. |
| location | `"empty_state" \| "header_action"`                                   | The location where the create button was clicked.                 |

#### synthetic-monitoring_secrets_management_edit_secret_button_clicked

Tracks when the edit secret button is clicked.

##### Properties

| name   | type                                                                 | description                                                       |
| ------ | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| source | `"check_editor_sidepanel_feature_tabs" \| "config_page_secrets_tab"` | The source context where the secrets management UI is being used. |

#### synthetic-monitoring_secrets_management_delete_secret_button_clicked

Tracks when the delete secret button is clicked.

##### Properties

| name   | type                                                                 | description                                                       |
| ------ | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| source | `"check_editor_sidepanel_feature_tabs" \| "config_page_secrets_tab"` | The source context where the secrets management UI is being used. |

#### synthetic-monitoring_secrets_management_secret_created

Tracks when a secret is successfully created.

##### Properties

| name   | type                                                                 | description                                                       |
| ------ | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| source | `"check_editor_sidepanel_feature_tabs" \| "config_page_secrets_tab"` | The source context where the secrets management UI is being used. |

#### synthetic-monitoring_secrets_management_secret_updated

Tracks when a secret is successfully updated.

##### Properties

| name   | type                                                                 | description                                                       |
| ------ | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| source | `"check_editor_sidepanel_feature_tabs" \| "config_page_secrets_tab"` | The source context where the secrets management UI is being used. |

#### synthetic-monitoring_secrets_management_secret_deleted

Tracks when a secret is successfully deleted.

##### Properties

| name   | type                                                                 | description                                                       |
| ------ | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| source | `"check_editor_sidepanel_feature_tabs" \| "config_page_secrets_tab"` | The source context where the secrets management UI is being used. |

### testing_synthetics_landing

#### synthetic-monitoring_testing_synthetics_landing_viewed

Tracks when the Testing & synthetics landing page is viewed.

##### Properties

| name          | type            | description                                         |
| ------------- | --------------- | --------------------------------------------------- |
| hasAgentic    | `false \| true` | Whether the Agentic testing section was shown.      |
| hasK6         | `false \| true` | Whether the Performance testing section was shown.  |
| hasSynthetics | `false \| true` | Whether the Synthetic monitoring section was shown. |

#### synthetic-monitoring_testing_synthetics_landing_agentic_learn_more_button_clicked

Tracks when the Agentic Learn more button is clicked.

#### synthetic-monitoring_testing_synthetics_landing_agentic_create_button_clicked

Tracks when the Agentic Create a test button is clicked.

#### synthetic-monitoring_testing_synthetics_landing_open_link_clicked

Tracks when an Open link is clicked.

##### Properties

| name    | type                                         | description                                 |
| ------- | -------------------------------------------- | ------------------------------------------- |
| product | `"agentic" \| "performance" \| "synthetics"` | The product panel the Open link belongs to. |

#### synthetic-monitoring_testing_synthetics_landing_performance_browse_projects_button_clicked

Tracks when the Browse projects button is clicked.

#### synthetic-monitoring_testing_synthetics_landing_performance_start_testing_button_clicked

Tracks when the Start testing button is clicked.

#### synthetic-monitoring_testing_synthetics_landing_synthetics_tile_clicked

Tracks when a Synthetic monitoring action tile is clicked.

##### Properties

| name        | type                                             | description                                                  |
| ----------- | ------------------------------------------------ | ------------------------------------------------------------ |
| tile        | `"make-check" \| "manage-probes" \| "terraform"` | The synthetics action tile that was clicked.                 |
| interaction | `"tile" \| "action-button"`                      | Whether the tile container or its action button was clicked. |

### timepoint_explorer

#### synthetic-monitoring_timepoint_explorer_view_toggle

Tracks when the Timepoint Explorer view type is changed.

##### Properties

| name      | type                                                                                                     | description                       |
| --------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check being explored. |
| viewMode  | `string`                                                                                                 | The view type.                    |

#### synthetic-monitoring_timepoint_explorer_mini_map_section_clicked

Tracks when a section of the Timepoint Explorer mini map is clicked.

##### Properties

| name      | type                                                                                                     | description                                                |
| --------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check being explored.                          |
| index     | `number`                                                                                                 | The index of the section of the mini map that was clicked. |
| component | `"left-arrow" \| "right-arrow" \| "section"`                                                             | The UI component that was clicked.                         |

#### synthetic-monitoring_timepoint_explorer_mini_map_page_clicked

Tracks when the Timepoint Explorer mini map page is changed.

##### Properties

| name      | type                                                                                                     | description                             |
| --------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check being explored.       |
| index     | `number`                                                                                                 | The index of the page that was clicked. |

#### synthetic-monitoring_timepoint_explorer_timepoint_click

Tracks when a probe entry in the Timepoint Viewer is clicked.

##### Properties

| name      | type                                                                                                     | description                                              |
| --------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check being explored.                        |
| component | `"tooltip" \| "reachability-entry" \| "viewer-tab" \| "uptime-entry" \| "pending-entry"`                 | The UI component that was clicked.                       |
| status    | `"success" \| "failure" \| "missing" \| "pending"`                                                       | The status of the Timepoint List entry that was clicked. |

#### synthetic-monitoring_timepoint_explorer_timepoint_viz_legend_toggled

Tracks when a Timepoint Viz Legend is clicked.

##### Properties

| name       | type                                                                                                     | description                        |
| ---------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| checkType  | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check being explored.  |
| vizOptions | `string`                                                                                                 | The viz options that were toggled. |

#### synthetic-monitoring_timepoint_explorer_timepoint_viz_legend_color_clicked

Tracks when a Timepoint Viz Legend color is clicked.

##### Properties

| name      | type                                                                                                     | description                                   |
| --------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check being explored.             |
| color     | `string`                                                                                                 | The color of the viz option that was clicked. |
| vizOption | `"success" \| "failure" \| "missing" \| "pending"`                                                       | The viz option that was clicked.              |

#### synthetic-monitoring_timepoint_explorer_timepoint_viewer_action_clicked

Tracks when a Timepoint Viewer action is clicked

##### Properties

| name      | type                                                                                                                                 | description                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"`                             | The type of check being explored. |
| action    | `"previous-timepoint" \| "next-timepoint" \| "view-explore-logs" \| "view-explore-metrics" \| "view-frontend-observability-session"` | The action that was clicked.      |

#### synthetic-monitoring_timepoint_explorer_trace_icon_clicked

Tracks when a trace icon is clicked in the log view.

##### Properties

| name   | type                     | description                                        |
| ------ | ------------------------ | -------------------------------------------------- |
| action | `"expand" \| "collapse"` | Whether the trace panel was expanded or collapsed. |

#### synthetic-monitoring_timepoint_explorer_timepoint_viewer_logs_view_toggled

Tracks when the Timepoint Viewer logs view is toggled

##### Properties

| name      | type                                                                                                     | description                       |
| --------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check being explored. |
| action    | `"event" \| "raw-logs"`                                                                                  | The action that was clicked.      |
