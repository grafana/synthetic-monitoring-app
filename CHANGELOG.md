# Change Log

# [1.11.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.2...v1.11.3) (2023-7-10)

- Fix an incorrect frequency value in the HTTP scene
- Add an "edit check" button to all scenes

# [1.11.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.1...v1.11.2) (2023-26-1)

- Fix broken dashboard link from summary page
- Fix repeated "dashboard" on summary page

# [1.11.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.0...v1.11.1) (2023-26-1)

- Add a multihttp scene behind a feature flag

# [1.11.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.10.1...v1.11.0) (2023-6-1)

- Include some fixes for scenes
- Fix some issues with identifying datasources when an instance is renamed
- Replace the visualization list view with a scene
- Remove legacy theming

# [1.10.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.10.0...v1.10.1) (2023-4-26)

- Suppress an erroneous error toast in the alerting view
- Add some testing for Terraform generation output

# [1.10.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.36...v1.10.0) (2023-4-21)

- Add and release multi-http functionality behind feature flag
- Add and release scenes based dashboards behind feature flag
- Fix a bug with base64 encoding in TCP query/response
- Update datasource query editor to include probes in traceroute queries

# [1.9.36](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.35...v1.9.36) (2023-3-15)

- Update build tooling from grafana-toolkit to create-plugin

# [1.9.35](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.34...v1.9.35) (2023-2-16)

- Fix a bug with rendering data in the node panel for traceroute checks

# [1.9.34](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.33...v1.9.34) (2023-2-09)

- Fix a bug with the config page not rendering in cloud instances

# [1.9.33](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.32...v1.9.33) (2023-2-07)

- Upgrade the Worldmap panel dependency

# [1.9.32](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.31...v1.9.32) (2023-2-06)

- Fix a bug with the config page not rendering in cloud instances

# [1.9.31](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.30...v1.9.31) (2023-1-13)

- Fix a bug where checks weren't refetched after bulk updating probes
- Add some information on how to set up a private probe after creating a token
- Show error state if validating the body of an HTTP HEAD request
- Remove the legacy initialization flow

# [1.9.30](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.29...v1.9.30) (2023-1-9)

- Remove deprecated initialization flow

# [1.9.29](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.28...v1.9.29) (2023-1-4)

- Add proxy headers to HTTP checks

# [1.9.28](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.27...v1.9.28) (2022-11-9)

- Update Alert URL for compatiblity with Grafana 9

# [1.9.27](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.26...v1.9.27) (2022-11-8)

- Fix error message on non-traceroutes timeout field

# [1.9.26](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.25...v1.9.26) (2022-11-2)

- Fix a duplicate button on the setup page

# [1.9.25](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.24...v1.9.25) (2022-10-24)

- Support the new Grafana navigation setup

# [1.9.24](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.23...v1.9.24) (2022-10-11)

- Fix a bug with dashboard redirects that were causing them to lose query params

# [1.9.23](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.22...v1.9.23) (2022-10-5)

- Bump Grafana dependencies to version 9

# [1.9.22](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.21...v1.9.22) (2022-9-15)

- Update worldmap panel dependency

# [1.9.21](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.20...v1.9.21) (2022-8-10)

- Update link to alerting UI

# [1.9.20](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.19...v1.9.20) (2022-8-2)

- Make sure 100% is never rendered as 100.0%

# [1.9.19](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.18...v1.9.19) (2022-6-21)

- Fix a bug with some promql queries that could result in values over 100%

# [1.9.18](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.17...v1.9.18) (2022-6-21)

- Fix a bug with settting default alert rules in Grafana v9

# [1.9.17](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.16...v1.9.17) (2022-6-9)

- Handles a breaking change in the alerting api for Grafana v9

# [1.9.16](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.15...v1.9.16) (2022-6-3)

- Adds a more helpful error message when probe deletion fails

# [1.9.15](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.14...v1.9.15) (2022-4-28)

- Fixes a routing issue where the unprovisioned plugin could get stuck in an infinite loop
- Fixes a routing issue where the plugin could prevent navigation to other parts of Grafana

# [1.9.14](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.13...v1.9.14) (2022-4-15)

- Fixes a bug where there alerting tab could end up in a disabled state when it shouldn't

# [1.9.13](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.12...v1.9.13) (2022-3-29)

### Bug fixes

- Fixes reachability queries that could sometimes be over 100% for long time windows
- Hides dashboard update modal from users that don't have permissions to update dashboards

# [1.9.12](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.11...v1.9.12) (2022-3-16)

### Bug fixes

- Dashboard maps weren't displaying thresholds correctly
- Show custom alert thresholds in the check editor form

# [1.9.11](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.10...v1.9.11) (2022-3-3)

### Bug fixes

- Fix broken dashboard redirect logic

# [1.9.10](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.9...v1.9.10) (2022-2-16)

### Bug fixes

- Use datasource UIDs when creating dashboards instead of names
- Fix a potential infinite routing loop when initializing on prem

# [1.9.9](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.8...v1.9.9) (2022-2-04)

## Features

- Rearranged checklist filters under a central dropdown

# [1.9.8](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.7...v1.9.8) (2022-2-01)

# [1.9.7](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.6...v1.9.7) (2022-1-25)

## Features

- Adds a map to the probe edit page to visualize longitude & latitude

# [1.9.6](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.5...v1.9.6) (2022-1-21)

### Features

- Increase the maximum quantity of labels per check to 10.

# [1.9.5](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.4...v1.9.5) (2022-1-21)

### Bug fixes

- Fix a race condition that prevented values from showing up when navigating to the edit check form

# [1.9.4](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.3...v1.9.4) (2022-1-19)

### Bug fixes

- Update routing to use React router
- Fix a bug in the usage prediction calculation
- Accessibility fixes

### Features

- Include traceroute checks in the Terraform config export

# [1.9.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.2...v1.9.3) (2022-1-10)

### Bug fixes

- Gracefully handle inability to connect to API

# [1.9.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.8.1...v1.9.2) (2022-1-06)

### Features

- Added the ability to bulk edit probes for checks

# [1.8.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.8.0...v1.8.1) (2022-1-04)

### Bug Fixes

- Update the README with additional configuration details

# [1.8.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.7.0...v1.8.0) (2022-1-04)

### Features

- Add a `terraform import` command to the terraform config download. This allows users to generate intial TF state.

### Bug Fixes

- Replace worldmap panel plugin with geomap panel in all the dashboards
- Use the updated timeseries panel in the summary dashboard
- Rename the DNS dashboard to align with the other dashboards

# [1.7.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.61...v1.7.0) (2021-12-01)

### Features

- Add the ability to export checks and probes as terraform config from the plugin config page
- Add a button to generate a new API key in the plugin config page

# [1.6.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.5.6...v1.6.0) (2021-11-17)

### Features

- Add traceroute check type

# [1.5.6](https://github.com/grafana/synthetic-monitoring-app/compare/v1.5.5...v1.5.6) (2021-11-15)

### Bug Fixes

- Add data points per minute to usage calculator

# [1.5.5](https://github.com/grafana/synthetic-monitoring-app/compare/v1.5.4...v1.5.5) (2021-10-29)

### Features

- Mark deprecated probes as such in check editor. Prevent adding deprecated probes to checks.

# [1.5.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.5.2...v1.5.3) (2021-09-20)

### Bug Fixes

- Fix a dashboard config error

# [1.5.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.3.3...v1.5.2) (2021-09-20)

### Bug Fixes

- make homepage usage breakpoints smaller ([#367](https://github.com/grafana/synthetic-monitoring-app/issues/367)) ([d157abe](https://github.com/grafana/synthetic-monitoring-app/commit/d157abe6fdb53a1aefcfba81cc08270ab9a9e735))

# [1.5.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.3.3...v1.6.0) (2021-09-14)

### Bug Fixes

- config setup button was routing to a 404 ([#365](https://github.com/grafana/synthetic-monitoring-app/issues/365)) ([a08a9c8](https://github.com/grafana/synthetic-monitoring-app/commit/a08a9c8ac335d83bada5ee23a081be4f3fbee4fd))

# [1.5.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.3.3...v1.5.0) (2021-09-13)

### Features

- add a homepage ([625beb9](https://github.com/grafana/synthetic-monitoring-app/commit/625beb9a1bfad4e504d48791aef6417354195353))

# [1.4.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.3.3...v1.4.0) (2021-09-08)

### Features

- Add beta feature traceroute behind a feature flag ([#245](https://github.com/grafana/synthetic-monitoring-app/issues/245)) ([89ab9b1](https://github.com/grafana/synthetic-monitoring-app/commit/89ab9b1427734f88f8590bb15f59b786f02bed11))

# [1.3.2](https://github.com/grafana/synthetic-monitoring-app/compare/1.3.1...1.3.2) (2021-09-08)

### Bug Fixes

- check type selector should be disabled on edit ([#360](https://github.com/grafana/synthetic-monitoring-app/issues/360)) ([dda165e](https://github.com/grafana/synthetic-monitoring-app/commit/dda165e6187370d2726d4db0e31b8af2fe5bfa36))

# [1.3.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.2.30...v1.3.0) (2021-08-27)

### Bug Fixes

- go back to circle bild ([7d159fa](https://github.com/grafana/synthetic-monitoring-app/commit/7d159fadf099845dbe09b8bd4e57ea210bb783c7))

### Features

- almost there... skipping docs publish step ([d97521c](https://github.com/grafana/synthetic-monitoring-app/commit/d97521ce6038149f406bcce6406bc9242b11242e))
- gcom token secret ([1c2b5b8](https://github.com/grafana/synthetic-monitoring-app/commit/1c2b5b8473cc1cf719c0c678db1af60829f33ad1))

## [1.2.30] - 2021-08-27

- New start to changelog with updated build process
