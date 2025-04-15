# Analytics report

This report contains all the analytics events that are defined in the project.

## Events

### check_creation

#### synthetic-monitoring_check_creation_add_new_check_button_clicked

Tracks when the "Add New Check" button is clicked

##### Properties

| name   | type                         | description             |
| ------ | ---------------------------- | ----------------------- |
| source | `"check-list" \| "homepage"` | The source of the click |

#### synthetic-monitoring_check_creation_add_check_type_group_button_clicked

Tracks when the "Add Check Type Group" button is clicked

##### Properties

| name           | type                                                        | description                 |
| -------------- | ----------------------------------------------------------- | --------------------------- |
| checkTypeGroup | `"api-endpoint" \| "multistep" \| "scripted" \| "browser,"` | The type group of the check |

#### synthetic-monitoring_check_creation_add_check_type_button_clicked

Tracks when the "Add Check Type" button is clicked

##### Properties

| name      | type                                                                                                      | description           |
| --------- | --------------------------------------------------------------------------------------------------------- | --------------------- |
| checkType | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute,"` | The type of the check |

### check_form

#### synthetic-monitoring_check_form_navigate_wizard_form

Tracks navigation events within the check form wizard.

##### Properties

| name       | type                                                                                                      | description                                     |
| ---------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| checkState | `"new" \| "existing"`                                                                                     | Whether the check is new or existing.           |
| checkType  | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute,"` | The type of check.                              |
| step       | `"job" \| "uptime" \| "labels" \| "alerting" \| "execution"`                                              | The current step in the wizard.                 |
| component  | `"forward-button" \| "back-button" \| "stepper"`                                                          | The UI component that triggered the navigation. |

#### synthetic-monitoring_check_form_adhoc_test_created

Tracks when an adhoc test is created.

##### Properties

| name       | type                                                                                                      | description                           |
| ---------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| checkState | `"new" \| "existing"`                                                                                     | Whether the check is new or existing. |
| checkType  | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute,"` | The type of check.                    |

#### synthetic-monitoring_check_form_check_created

Tracks when a regular check is created.

##### Properties

| name       | type                                                                                                      | description                           |
| ---------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| checkState | `"new" \| "existing"`                                                                                     | Whether the check is new or existing. |
| checkType  | `"browser" \| "dns" \| "grpc" \| "http" \| "multihttp" \| "ping" \| "scripted" \| "tcp" \| "traceroute,"` | The type of check.                    |
