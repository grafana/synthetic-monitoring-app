# Analytics Events

_This document is generated automatically and should not be edited directly. To see how to generate this document, see [docs/analytics/analytics.md](./analytics.md)._

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

| name           | type                                                       | description                  |
| -------------- | ---------------------------------------------------------- | ---------------------------- |
| checkTypeGroup | `"api-endpoint" \| "multistep" \| "scripted" \| "browser"` | The type group of the check. |

#### synthetic-monitoring_check_creation_add_check_type_button_clicked

Tracks when the 'protocol' buttons on the check type card are clicked.

##### Properties

| name           | type                                                       | description                        |
| -------------- | ---------------------------------------------------------- | ---------------------------------- |
| checkTypeGroup | `"api-endpoint" \| "multistep" \| "scripted" \| "browser"` | The check type group of the check. |
| protocol       | `string`                                                   | The protocol of the check.         |

### check_form

#### synthetic-monitoring_check_form_navigate_wizard_form_button_clicked

Tracks navigation events within the check form wizard.

##### Properties

| name      | type                                                                                                     | description                                     |
| --------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check.                              |
| step      | `"job" \| "uptime" \| "labels" \| "alerting" \| "execution"`                                             | The current step in the wizard.                 |
| component | `"forward-button" \| "back-button" \| "stepper"`                                                         | The UI component that triggered the navigation. |

#### synthetic-monitoring_check_form_adhoc_test_created

Tracks when an adhoc test is successfully created.

##### Properties

| name       | type                                                                                                     | description                           |
| ---------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| checkType  | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check.                    |
| checkState | `"new" \| "existing"`                                                                                    | Whether the check is new or existing. |

#### synthetic-monitoring_check_form_check_created

Tracks when a regular check is successfully created.

##### Properties

| name      | type                                                                                                     | description        |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------------ |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check. |

#### synthetic-monitoring_check_form_check_updated

Tracks when a regular check is successfully updated.

##### Properties

| name      | type                                                                                                     | description        |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------------ |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute"` | The type of check. |
