# Changelog

## [1.35.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.34.1...v1.35.0) (2025-09-03)


### Features

* add lightweight feedback feature ([#1246](https://github.com/grafana/synthetic-monitoring-app/issues/1246)) ([3a83003](https://github.com/grafana/synthetic-monitoring-app/commit/3a830035fd7bfe6e4fbc0561043d0b89f0d420d3))
* Timepoint Explorer ([#1122](https://github.com/grafana/synthetic-monitoring-app/issues/1122)) ([f9142d3](https://github.com/grafana/synthetic-monitoring-app/commit/f9142d3afc7ce9ad1a0afe3ad0c5099b9682404c))


### Fixes

* correct danger js PR stats ([#1254](https://github.com/grafana/synthetic-monitoring-app/issues/1254)) ([5b191eb](https://github.com/grafana/synthetic-monitoring-app/commit/5b191eb5dfc115b5aa425fc6a4a9b7e48dea2dc5))
* update probe mappings ([#1251](https://github.com/grafana/synthetic-monitoring-app/issues/1251)) ([8cf8083](https://github.com/grafana/synthetic-monitoring-app/commit/8cf80834f8e087847957eda629851acec920fbc3))


### Miscellaneous Chores

* add gRPC dashboard and remove unused scenes components ([#1249](https://github.com/grafana/synthetic-monitoring-app/issues/1249)) ([1d14f43](https://github.com/grafana/synthetic-monitoring-app/commit/1d14f4318bd2b91874c20803fc7509fc7f32b0c1))
* convert tcp dashboard to react scenes ([#1241](https://github.com/grafana/synthetic-monitoring-app/issues/1241)) ([14ecef7](https://github.com/grafana/synthetic-monitoring-app/commit/14ecef718fb65a6c8bc248b1e64b7cd19f06ffad))
* convert traceroute dashboard to react scenes ([#1244](https://github.com/grafana/synthetic-monitoring-app/issues/1244)) ([3f14757](https://github.com/grafana/synthetic-monitoring-app/commit/3f14757ea95a5962de36178e52c0786de355f603))
* converted dns dashboard to react scenes ([#1240](https://github.com/grafana/synthetic-monitoring-app/issues/1240)) ([a29f5ad](https://github.com/grafana/synthetic-monitoring-app/commit/a29f5ad3ce271656b6ca038124ed840a889f5b78))
* converted ping dashboard to react scenes ([#1239](https://github.com/grafana/synthetic-monitoring-app/issues/1239)) ([9481b0d](https://github.com/grafana/synthetic-monitoring-app/commit/9481b0d49302f62d44838238d5c8e4281e6cb348))
* remove rbac feature flag ([#1257](https://github.com/grafana/synthetic-monitoring-app/issues/1257)) ([e999f92](https://github.com/grafana/synthetic-monitoring-app/commit/e999f92630755a3802cdb583cb7d2f2109b83504))
* remove scripted and unifiedAlerting feature flags ([#1255](https://github.com/grafana/synthetic-monitoring-app/issues/1255)) ([a449a74](https://github.com/grafana/synthetic-monitoring-app/commit/a449a7449e8e40f04440a118523374da656ad19f))
* update editor role description in plugins.json ([#1234](https://github.com/grafana/synthetic-monitoring-app/issues/1234)) ([d315240](https://github.com/grafana/synthetic-monitoring-app/commit/d31524090bb2d71cd425d08422a804f1aea0774f))

## [1.34.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.34.0...v1.34.1) (2025-08-21)


### Fixes

* update tsconfig for `monaco` (confirmed with k6 core dev) ([#1232](https://github.com/grafana/synthetic-monitoring-app/issues/1232)) ([3a082bd](https://github.com/grafana/synthetic-monitoring-app/commit/3a082bd1a11e64ddee8342bbcd11a0fd9f99e77f))

## [1.34.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.33.2...v1.34.0) (2025-08-19)


### Features

* apply granular secrets permissions ([#1218](https://github.com/grafana/synthetic-monitoring-app/issues/1218)) ([579d347](https://github.com/grafana/synthetic-monitoring-app/commit/579d347f86cda7cea28e1048a0b82fbcb8704020))
* change redirect logic for editing a check ([#1203](https://github.com/grafana/synthetic-monitoring-app/issues/1203)) ([7f8a192](https://github.com/grafana/synthetic-monitoring-app/commit/7f8a192053ae014bda9a784fc1a654dad0626522))


### Fixes

* always use latest terraform provider version for validation check ([#1220](https://github.com/grafana/synthetic-monitoring-app/issues/1220)) ([bc75a19](https://github.com/grafana/synthetic-monitoring-app/commit/bc75a1958fd1bea3d0dae29ad233069722ab2df5))
* explicit logs panel rendering height and width with new logs panel in core ([#1230](https://github.com/grafana/synthetic-monitoring-app/issues/1230)) ([669753e](https://github.com/grafana/synthetic-monitoring-app/commit/669753eb2708004101321c4f9de792de6fd6c4f6))
* make totalChecksPerPeriod calculation equal to backend ([#1221](https://github.com/grafana/synthetic-monitoring-app/issues/1221)) ([e45b993](https://github.com/grafana/synthetic-monitoring-app/commit/e45b993212ef813e70de3c6e54fa4a31268e5c4b))


### Miscellaneous Chores

* add versioning to dev deployments and update catalog  ([#1228](https://github.com/grafana/synthetic-monitoring-app/issues/1228)) ([c7af0af](https://github.com/grafana/synthetic-monitoring-app/commit/c7af0afa9d69ad5996ddf07ae53f0593176b67db))
* publish dev catalog ([#1224](https://github.com/grafana/synthetic-monitoring-app/issues/1224)) ([8585568](https://github.com/grafana/synthetic-monitoring-app/commit/8585568ff609258190fd9dc61484599f7f5c8ba0))
* publish to ops catalog ([#1225](https://github.com/grafana/synthetic-monitoring-app/issues/1225)) ([77e3fc1](https://github.com/grafana/synthetic-monitoring-app/commit/77e3fc17f827c70b8c752f312c142d46b346af3c))
* update create-plugin to latest version ([#1226](https://github.com/grafana/synthetic-monitoring-app/issues/1226)) ([8c91c83](https://github.com/grafana/synthetic-monitoring-app/commit/8c91c83f4b37a404274ea2356078a42ba2735d4c))

## [1.33.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.33.1...v1.33.2) (2025-08-04)


### Features

* add new latency alerts ([#1188](https://github.com/grafana/synthetic-monitoring-app/issues/1188)) ([81a5917](https://github.com/grafana/synthetic-monitoring-app/commit/81a59172c5b6cf3c0fb453903bb3a6ca0753953d))
* per check alerts runbooks UI support ([#1173](https://github.com/grafana/synthetic-monitoring-app/issues/1173)) ([80d78e2](https://github.com/grafana/synthetic-monitoring-app/commit/80d78e2085e858b8053c76f5bfa6a8bc7a6e52be))


### Fixes

* restrict secrets tab usage to admin users ([#1213](https://github.com/grafana/synthetic-monitoring-app/issues/1213)) ([be7475a](https://github.com/grafana/synthetic-monitoring-app/commit/be7475ae6c426a92886c617a10a08af50a4c1082))

## [1.33.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.33.0...v1.33.1) (2025-07-28)


### Fixes

* github actions staging value passthrough ([#1208](https://github.com/grafana/synthetic-monitoring-app/issues/1208)) ([df58967](https://github.com/grafana/synthetic-monitoring-app/commit/df589679753fc33d09221c603255377dd78cbe5d))

## [1.33.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.32.0...v1.33.0) (2025-07-24)


### Features

* add probe server api url alongside backend address for private probe creation ([#1194](https://github.com/grafana/synthetic-monitoring-app/issues/1194)) ([a69706e](https://github.com/grafana/synthetic-monitoring-app/commit/a69706e0c12207f06df40c53575d37e7848c0ca2))


### Fixes

* include body and headers in HTTP check Terraform export ([#1195](https://github.com/grafana/synthetic-monitoring-app/issues/1195)) ([1308ba7](https://github.com/grafana/synthetic-monitoring-app/commit/1308ba76e968bb9d0cbbd1c81cd0bdaa98261505))
* prevent loading errorRateMap when data has not finished loading ([#1201](https://github.com/grafana/synthetic-monitoring-app/issues/1201)) ([ad93b4d](https://github.com/grafana/synthetic-monitoring-app/commit/ad93b4dcc91e0d2b9788fa41149817715cae5ba0))
* use secret name, not UUID, to interact with the API ([#1205](https://github.com/grafana/synthetic-monitoring-app/issues/1205)) ([1ca2704](https://github.com/grafana/synthetic-monitoring-app/commit/1ca270499acdf56a8d7221839dd53317deef1c69))
* validation logic for DNS targets and add appropriate tests ([#1193](https://github.com/grafana/synthetic-monitoring-app/issues/1193)) ([2bf2f93](https://github.com/grafana/synthetic-monitoring-app/commit/2bf2f930483a2b8dbe37188df6d6ea5783d2185f))

## [1.32.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.31.0...v1.32.0) (2025-07-15)


### Features

* add GRAFANA_ALERTS to dashboard annotations for firing/pending alerts ([#1187](https://github.com/grafana/synthetic-monitoring-app/issues/1187)) ([8857da4](https://github.com/grafana/synthetic-monitoring-app/commit/8857da43f7a09fdc70fc150a2f1839c569dafc1e))


### Fixes

* add information about legacy vs per-check alerts in Alerting page ([#1176](https://github.com/grafana/synthetic-monitoring-app/issues/1176)) ([ed8713a](https://github.com/grafana/synthetic-monitoring-app/commit/ed8713a2364f1c23cccfbfde7b144976cd3723a5))
* add link to notification policies ([#1179](https://github.com/grafana/synthetic-monitoring-app/issues/1179)) ([21369e8](https://github.com/grafana/synthetic-monitoring-app/commit/21369e8143c6138acf8680e7cfe9b289b5be6e2b))
* change autoMerge to choice rather than string ([#1191](https://github.com/grafana/synthetic-monitoring-app/issues/1191)) ([6c1befb](https://github.com/grafana/synthetic-monitoring-app/commit/6c1befbaf94d096beb5066e485760ccd8fada55b))
* lint warnings ([#1190](https://github.com/grafana/synthetic-monitoring-app/issues/1190)) ([b32dd09](https://github.com/grafana/synthetic-monitoring-app/commit/b32dd098dc98e9cdfcf248d032de68162838a688))
* publish to gcom on release ([#1192](https://github.com/grafana/synthetic-monitoring-app/issues/1192)) ([2df299c](https://github.com/grafana/synthetic-monitoring-app/commit/2df299c1174ef739d80f9249cd83658815756236))
* restrict environment variable ([#1185](https://github.com/grafana/synthetic-monitoring-app/issues/1185)) ([bb1ff43](https://github.com/grafana/synthetic-monitoring-app/commit/bb1ff4300fa3fc4353ce75d1c5bf514db4a30990))
* updated gh action names ([#1183](https://github.com/grafana/synthetic-monitoring-app/issues/1183)) ([81e90ba](https://github.com/grafana/synthetic-monitoring-app/commit/81e90ba7838dbd06db262348c803d3cc7b802afe))

## [1.31.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.30.1...v1.31.0) (2025-07-10)


### Features

* pr creation GH action consolidation test ([#1158](https://github.com/grafana/synthetic-monitoring-app/issues/1158)) ([f4da4e2](https://github.com/grafana/synthetic-monitoring-app/commit/f4da4e2f39093e62a328882e779ba3e8aebefcd0))
* refactor `<CheckForm/>` ([#1170](https://github.com/grafana/synthetic-monitoring-app/issues/1170)) ([1bdd498](https://github.com/grafana/synthetic-monitoring-app/commit/1bdd498d8821d91a668bfd380243e4925ac0804b))


### Fixes

* update policybot configuration ([#1180](https://github.com/grafana/synthetic-monitoring-app/issues/1180)) ([9e7cebd](https://github.com/grafana/synthetic-monitoring-app/commit/9e7cebd1723a3e60506cc347cf4052d27395cc0e))
* updated check list search ([#1178](https://github.com/grafana/synthetic-monitoring-app/issues/1178)) ([5482c4d](https://github.com/grafana/synthetic-monitoring-app/commit/5482c4d192aa168f8e0bb052bb0f79843ce6fed4))

## [1.30.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.30.0...v1.30.1) (2025-06-25)


### Fixes

* add catch blocks to script examples ([#1154](https://github.com/grafana/synthetic-monitoring-app/issues/1154)) ([11818a3](https://github.com/grafana/synthetic-monitoring-app/commit/11818a39567cab4ebb95ab7f049e25b0aa760e61))
* change CODEOWNERS to match actual files ([#1168](https://github.com/grafana/synthetic-monitoring-app/issues/1168)) ([d8548d7](https://github.com/grafana/synthetic-monitoring-app/commit/d8548d7f5a40ecbe2424edb1fafa0dd889b48bb7))
* change reachability description for probes view ([#1161](https://github.com/grafana/synthetic-monitoring-app/issues/1161)) ([915983a](https://github.com/grafana/synthetic-monitoring-app/commit/915983ad326e1ecb73c04cc0d7262f9de2f6b107))
* typo in DNS form mentioning ICMP ([#1167](https://github.com/grafana/synthetic-monitoring-app/issues/1167)) ([0224f03](https://github.com/grafana/synthetic-monitoring-app/commit/0224f0383ea865ac02c0f56bd5eaa34dc8ad9960))

## [1.30.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.29.0...v1.30.0) (2025-06-13)


### Features

* add TLS Cert Expiry alert for TCP checks ([#1153](https://github.com/grafana/synthetic-monitoring-app/issues/1153)) ([7fe153a](https://github.com/grafana/synthetic-monitoring-app/commit/7fe153a937955a0121e3f602ff6a14923ba9fa02))

## [1.29.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.28.1...v1.29.0) (2025-06-09)


### Features

* add indicator when there is an error with per-check alerts ([#1148](https://github.com/grafana/synthetic-monitoring-app/issues/1148)) ([f1267e1](https://github.com/grafana/synthetic-monitoring-app/commit/f1267e126446e8836574e82ff9e6771ad4a5df04))
* register Component into Software Catalog and set up TechDocs publishing ([#1150](https://github.com/grafana/synthetic-monitoring-app/issues/1150)) ([b691b3f](https://github.com/grafana/synthetic-monitoring-app/commit/b691b3fb10a9fbde0297d80e6db04440b156af58))
* show per check alerts on checks list ([#1139](https://github.com/grafana/synthetic-monitoring-app/issues/1139)) ([8471cd2](https://github.com/grafana/synthetic-monitoring-app/commit/8471cd2ded85a1ac9e8f8f4fc5ce94d944814fcc))


### Fixes

* fix list check alerts case ([#1155](https://github.com/grafana/synthetic-monitoring-app/issues/1155)) ([9a4c6d6](https://github.com/grafana/synthetic-monitoring-app/commit/9a4c6d613535a12915214ab7a229b0106f449d1b))


### Miscellaneous Chores

* remove unnecessary console eslint rule ([#1157](https://github.com/grafana/synthetic-monitoring-app/issues/1157)) ([1deafd6](https://github.com/grafana/synthetic-monitoring-app/commit/1deafd67574d887ff6fdcc7641f804a4aab50f53))

## [1.28.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.28.0...v1.28.1) (2025-05-14)


### Fixes

* add sequence number to deduplicate probes made by the fixture factory ([#1143](https://github.com/grafana/synthetic-monitoring-app/issues/1143)) ([26d1fea](https://github.com/grafana/synthetic-monitoring-app/commit/26d1fea66928252a1d07479e5b3e67f6cdc06f5a))
* added correctSceneVariableInterpolation function with tests ([#1142](https://github.com/grafana/synthetic-monitoring-app/issues/1142)) ([03bf35c](https://github.com/grafana/synthetic-monitoring-app/commit/03bf35c43156cb4e84e2ef3219dfb09ac5f31677))
* invert order between Alerting/Execution when AlertsPerCheck is e… ([#1093](https://github.com/grafana/synthetic-monitoring-app/issues/1093)) ([8a39f3d](https://github.com/grafana/synthetic-monitoring-app/commit/8a39f3def66f8a635fdab69e5d0a8d3e8dbd9d5f))
* Resolve issues reported by zizmor ([#1126](https://github.com/grafana/synthetic-monitoring-app/issues/1126)) ([ba910c2](https://github.com/grafana/synthetic-monitoring-app/commit/ba910c25bd2737c77b762f2dfe505b7e800fffa3))
* update return type of update alerts PUT request ([#1135](https://github.com/grafana/synthetic-monitoring-app/issues/1135)) ([60feb7d](https://github.com/grafana/synthetic-monitoring-app/commit/60feb7d734eea64ada7d07291313d7d411499f1c))

## [1.28.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.27.0...v1.28.0) (2025-05-08)


### Features

* intermediate secrets management pt2 ([#1125](https://github.com/grafana/synthetic-monitoring-app/issues/1125)) ([566bf25](https://github.com/grafana/synthetic-monitoring-app/commit/566bf25771c0db12883c46b65c8ac1bc93939038))


### Fixes

* add existing secret names to client validation ([#1138](https://github.com/grafana/synthetic-monitoring-app/issues/1138)) ([5de4f03](https://github.com/grafana/synthetic-monitoring-app/commit/5de4f0312e7c04df31943163b0d59999c3a5a659))

## [1.27.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.26.0...v1.27.0) (2025-04-30)


### Features

* add event tracking for check creation and some form navigation ([#1114](https://github.com/grafana/synthetic-monitoring-app/issues/1114)) ([3d55c80](https://github.com/grafana/synthetic-monitoring-app/commit/3d55c807c75773a8922648ae76028cbff836b4c3))


### Fixes

* calculation to monthly usage ([#1123](https://github.com/grafana/synthetic-monitoring-app/issues/1123)) ([0c5a0b8](https://github.com/grafana/synthetic-monitoring-app/commit/0c5a0b8246ba0f79b7213461ec7b4969defe25ee))


### Miscellaneous Chores

* remove public preview badge ([#1127](https://github.com/grafana/synthetic-monitoring-app/issues/1127)) ([1e8544f](https://github.com/grafana/synthetic-monitoring-app/commit/1e8544f1c96843bc93efbc51f720e051088041fc))
* rename ROUTES enum to AppRoutes ([#1120](https://github.com/grafana/synthetic-monitoring-app/issues/1120)) ([3024c0a](https://github.com/grafana/synthetic-monitoring-app/commit/3024c0ab68cadb3969b86ac8b4fe0f6b42366fc1))

## [1.26.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.25.0...v1.26.0) (2025-04-22)


### Features

* set up bundle analyzer and dangerJS workflow ([#1112](https://github.com/grafana/synthetic-monitoring-app/issues/1112)) ([c8b86af](https://github.com/grafana/synthetic-monitoring-app/commit/c8b86af07c37ad2e655f2b7619355cf67045493d))


### Miscellaneous Chores

* bump prismjs from 1.29.0 to 1.30.0 ([#1115](https://github.com/grafana/synthetic-monitoring-app/issues/1115)) ([c7233cb](https://github.com/grafana/synthetic-monitoring-app/commit/c7233cb0c79d4fcf4f1734fcca839661a4d80f6a))
* fix release-please commit message format ([#1116](https://github.com/grafana/synthetic-monitoring-app/issues/1116)) ([2890e7e](https://github.com/grafana/synthetic-monitoring-app/commit/2890e7eff96b2312839a44656bfd7831f2aa43e9))
* standardize enum naming to PascalCase ([#1121](https://github.com/grafana/synthetic-monitoring-app/issues/1121)) ([e6b522e](https://github.com/grafana/synthetic-monitoring-app/commit/e6b522e52db13b5c435bfa84428e4b00b48f045e))
* upgraded eslint dependencies ([#1118](https://github.com/grafana/synthetic-monitoring-app/issues/1118)) ([307a8f7](https://github.com/grafana/synthetic-monitoring-app/commit/307a8f7a4cf672501772b5b6e745ff9fb4e12023))

## [1.25.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.24.0...v1.25.0) (2025-04-11)


### Features

* migrate HTTP dashboard to react-scenes ([#1079](https://github.com/grafana/synthetic-monitoring-app/issues/1079)) ([c840f7b](https://github.com/grafana/synthetic-monitoring-app/commit/c840f7b631c4103c9950aaabb7e48699a8e183f2))


### Fixes

* typing errors after upgrading dependencies ([#1107](https://github.com/grafana/synthetic-monitoring-app/issues/1107)) ([a76fc15](https://github.com/grafana/synthetic-monitoring-app/commit/a76fc15ceb440229f39a61530789284f7aaa0517))


### Miscellaneous Chores

* add cursor files to gitignore ([#1108](https://github.com/grafana/synthetic-monitoring-app/issues/1108)) ([5ae0f1d](https://github.com/grafana/synthetic-monitoring-app/commit/5ae0f1dd6216a6ca58ad91714ea27535de61a091))
* rename useQuery hook to useURLSearchParams ([#1111](https://github.com/grafana/synthetic-monitoring-app/issues/1111)) ([68c6d4a](https://github.com/grafana/synthetic-monitoring-app/commit/68c6d4ae626cfdc12df913c15b66b042d53c8496))
* renamed all schemas to camelcase ([#1106](https://github.com/grafana/synthetic-monitoring-app/issues/1106)) ([5b41cad](https://github.com/grafana/synthetic-monitoring-app/commit/5b41cad1423926e175a11473a74c36906b5a24ef))

## [1.24.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.23.0...v1.24.0) (2025-04-04)


### Features

* intermediate secrets management (part 1) ([#1087](https://github.com/grafana/synthetic-monitoring-app/issues/1087)) ([cc749dc](https://github.com/grafana/synthetic-monitoring-app/commit/cc749dcc84f0cd9c3ed395b300d015cb320343f2))


### Fixes

* recreate yarn.lock to upgrade dependencies ([#1105](https://github.com/grafana/synthetic-monitoring-app/issues/1105)) ([8d6d7b8](https://github.com/grafana/synthetic-monitoring-app/commit/8d6d7b849d165bca8bc09045100cc385241899a4))
* remove canary config ([#1101](https://github.com/grafana/synthetic-monitoring-app/issues/1101)) ([9dd6209](https://github.com/grafana/synthetic-monitoring-app/commit/9dd6209fbb8bb3ac3b1a9c5e9c5d9d65f90b2fea))
* Terraform fixes for scripted, browser and multiHTTP checks ([#1095](https://github.com/grafana/synthetic-monitoring-app/issues/1095)) ([84840aa](https://github.com/grafana/synthetic-monitoring-app/commit/84840aae9ceed6c51041b3ec37b54e1960e4da2a))

## [1.23.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.22.0...v1.23.0) (2025-03-31)


### Features

* rename the TLS certificate expiry alert ([#1102](https://github.com/grafana/synthetic-monitoring-app/issues/1102)) ([6ebaa66](https://github.com/grafana/synthetic-monitoring-app/commit/6ebaa6673c6d487a88663edba737577b659c2bf3))


### Fixes

* update drone signature to prevent having to manually approve builds ([#1099](https://github.com/grafana/synthetic-monitoring-app/issues/1099)) ([6b62ea1](https://github.com/grafana/synthetic-monitoring-app/commit/6b62ea112f4fd9ac65f6dbe6ec99a4f11f980123))

## [1.22.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.21.0...v1.22.0) (2025-03-25)


### Features

* add dev tools ([#1089](https://github.com/grafana/synthetic-monitoring-app/issues/1089)) ([33a30d2](https://github.com/grafana/synthetic-monitoring-app/commit/33a30d205b84c719a080f1c6fb03b5b82b74888a))
* improve new alerts UI ([#1064](https://github.com/grafana/synthetic-monitoring-app/issues/1064)) ([b2e1be4](https://github.com/grafana/synthetic-monitoring-app/commit/b2e1be46317d4d9865c7ceafc97e4b0d3af45928))


### Fixes

* add put allowed in datasource.json ([#1098](https://github.com/grafana/synthetic-monitoring-app/issues/1098)) ([48ac346](https://github.com/grafana/synthetic-monitoring-app/commit/48ac346cc356958be9316536bca3743336116ee2))
* edit check button disabled issue ([#1091](https://github.com/grafana/synthetic-monitoring-app/issues/1091)) ([c125b6c](https://github.com/grafana/synthetic-monitoring-app/commit/c125b6c509146718610fa3b92cf2226c41c7a735))


### Miscellaneous Chores

* bump @babel/runtime from 7.24.7 to 7.26.10 ([#1084](https://github.com/grafana/synthetic-monitoring-app/issues/1084)) ([45dd4e6](https://github.com/grafana/synthetic-monitoring-app/commit/45dd4e6deb46824e8cd436672fb0a7c5b15fa42b))
* bump axios from 1.7.4 to 1.8.2 ([#1083](https://github.com/grafana/synthetic-monitoring-app/issues/1083)) ([5bfd005](https://github.com/grafana/synthetic-monitoring-app/commit/5bfd005284fb2117e1c3e385a98da7941b5ca46f))
* bump k6 typings to v0.57.1 ([#1096](https://github.com/grafana/synthetic-monitoring-app/issues/1096)) ([8f82b93](https://github.com/grafana/synthetic-monitoring-app/commit/8f82b9358b4afd6e76a222693c8f6d28bc95e33d))

## [1.21.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.20.1...v1.21.0) (2025-03-11)


### Features

* checks empty state ([#1081](https://github.com/grafana/synthetic-monitoring-app/issues/1081)) ([b284567](https://github.com/grafana/synthetic-monitoring-app/commit/b28456772ec6937ffd2eea4f3f7e3c57dd83ee8f))

## [1.20.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.20.0...v1.20.1) (2025-03-03)


### Fixes

* handle fractional "check result" logs ([#1074](https://github.com/grafana/synthetic-monitoring-app/issues/1074)) ([d50448f](https://github.com/grafana/synthetic-monitoring-app/commit/d50448fc9acb371c541cd74b29ed0429343313ae))


### Miscellaneous Chores

* fix deprecation issues ([#1063](https://github.com/grafana/synthetic-monitoring-app/issues/1063)) ([f062845](https://github.com/grafana/synthetic-monitoring-app/commit/f0628456fe1799de82b44ae2d10dd8506aff269e))

## [1.20.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.19.1...v1.20.0) (2025-02-24)


### Features

* change browser, scripted and multihttp timeouts up to 180s ([#1075](https://github.com/grafana/synthetic-monitoring-app/issues/1075)) ([7cc9d64](https://github.com/grafana/synthetic-monitoring-app/commit/7cc9d6425a262f43cbdf0d5bba47fcdc041490a7))


### Fixes

* prevent adding duplicated probes when bulk editing ([#1072](https://github.com/grafana/synthetic-monitoring-app/issues/1072)) ([efb5d42](https://github.com/grafana/synthetic-monitoring-app/commit/efb5d4279f917e003c75f51c2ee3f36334a67828))
* terraform export fixes ([#1070](https://github.com/grafana/synthetic-monitoring-app/issues/1070)) ([2089ded](https://github.com/grafana/synthetic-monitoring-app/commit/2089ded43131bec4649012a4dbc74cb0ec599fc5))


### Miscellaneous Chores

* make plugin auto enabled ([#1067](https://github.com/grafana/synthetic-monitoring-app/issues/1067)) ([012c374](https://github.com/grafana/synthetic-monitoring-app/commit/012c374072a224ef1102019a67cab5b378372894))

## [1.19.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.19.0...v1.19.1) (2025-02-18)


### Fixes

* prevent submitting alerts per check when FF is off ([#1068](https://github.com/grafana/synthetic-monitoring-app/issues/1068)) ([a0062cd](https://github.com/grafana/synthetic-monitoring-app/commit/a0062cddad4321b7920ba1a6818aadab37fe4a1f))

## [1.19.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.18.0...v1.19.0) (2025-02-12)


### Features

* change browser, scripted and multihttp timeouts up to 120s ([#1065](https://github.com/grafana/synthetic-monitoring-app/issues/1065)) ([ff377b6](https://github.com/grafana/synthetic-monitoring-app/commit/ff377b68661544f76749db244085e1afca4be063))


### Fixes

* get web vitals value for gauge component ([#1059](https://github.com/grafana/synthetic-monitoring-app/issues/1059)) ([25dfac6](https://github.com/grafana/synthetic-monitoring-app/commit/25dfac6b67f18262360f3bf5c3684a1b9b808f75))
* probe filtering behaviour and reset button ([#1066](https://github.com/grafana/synthetic-monitoring-app/issues/1066)) ([1b7dfb4](https://github.com/grafana/synthetic-monitoring-app/commit/1b7dfb42dcd9e5536a20fc8442d0a4eb7c0a15e5))
* pull updater image from gar instead of gcr ([#1056](https://github.com/grafana/synthetic-monitoring-app/issues/1056)) ([654f478](https://github.com/grafana/synthetic-monitoring-app/commit/654f478b7234165bf3f5705f30f770bc1ee378e2))


### Miscellaneous Chores

* bump grafana packages to latest ([#1062](https://github.com/grafana/synthetic-monitoring-app/issues/1062)) ([4c90797](https://github.com/grafana/synthetic-monitoring-app/commit/4c907977213e1a3e6ed8484555e88f55fa007a93))
* fix test noise ([#1057](https://github.com/grafana/synthetic-monitoring-app/issues/1057)) ([427e834](https://github.com/grafana/synthetic-monitoring-app/commit/427e834d649fa60d2901b3fab0542ee0483b34ef))
* replace test services ([#1060](https://github.com/grafana/synthetic-monitoring-app/issues/1060)) ([b26d89a](https://github.com/grafana/synthetic-monitoring-app/commit/b26d89aa83247629f4bb10a5a35623cb69f7e4a6))

## [1.18.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.17.0...v1.18.0) (2025-02-04)


### Features

* Alerts per check ([#1011](https://github.com/grafana/synthetic-monitoring-app/issues/1011)) ([ef8c3f3](https://github.com/grafana/synthetic-monitoring-app/commit/ef8c3f3c9b0949a81977c209dd5c3d83906763b8))
* sort probes alphabetically ([#1050](https://github.com/grafana/synthetic-monitoring-app/issues/1050)) ([7bc5ede](https://github.com/grafana/synthetic-monitoring-app/commit/7bc5ede93b6c1b3ce2eaa7923704893cc9b5550d))


### Fixes

* add displayName on top of name rather than replace ([#1055](https://github.com/grafana/synthetic-monitoring-app/issues/1055)) ([b8264af](https://github.com/grafana/synthetic-monitoring-app/commit/b8264af83ee8a4583a2f98115bd71f8cf53ded17))
* fix broken checklist test ([#1058](https://github.com/grafana/synthetic-monitoring-app/issues/1058)) ([3be444d](https://github.com/grafana/synthetic-monitoring-app/commit/3be444d8ba3fd149f5eb2892368bb821f4228722))
* strip back ci.yml checks ([#1051](https://github.com/grafana/synthetic-monitoring-app/issues/1051)) ([c04a797](https://github.com/grafana/synthetic-monitoring-app/commit/c04a79758bec2313870e35b7f5a3b943dde951fe))


### Miscellaneous Chores

* introduce Fishery as object factory and yarn dev:msw ([#1023](https://github.com/grafana/synthetic-monitoring-app/issues/1023)) ([0253f91](https://github.com/grafana/synthetic-monitoring-app/commit/0253f91d070f2684ea5e4ea54aa39add98f9f71f))

## [1.17.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.12...v1.17.0) (2025-01-28)


### Features

* add policy bot configuration ([#1047](https://github.com/grafana/synthetic-monitoring-app/issues/1047)) ([406851a](https://github.com/grafana/synthetic-monitoring-app/commit/406851ab0f72a79f1c02a1378cd9e42772a07431))
* increase check timeout to scripted, browser and multihttp checks ([#1049](https://github.com/grafana/synthetic-monitoring-app/issues/1049)) ([df9c5d9](https://github.com/grafana/synthetic-monitoring-app/commit/df9c5d97a485475b618a7be93ad43c2c5fdc124d))


### Fixes

* add new probes metadata ([#1044](https://github.com/grafana/synthetic-monitoring-app/issues/1044)) ([006bc43](https://github.com/grafana/synthetic-monitoring-app/commit/006bc43071a0a642d8262a6f3d7fa2695617b7d6))
* wrap labels to always display View dashboard button ([#1045](https://github.com/grafana/synthetic-monitoring-app/issues/1045)) ([8c45572](https://github.com/grafana/synthetic-monitoring-app/commit/8c45572631cdf956327e8b6afe2308a663c3ba28))

## [1.16.12](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.11...v1.16.12) (2025-01-14)


### Fixes

* change dirty strategy in check form ([#1037](https://github.com/grafana/synthetic-monitoring-app/issues/1037)) ([25ee12f](https://github.com/grafana/synthetic-monitoring-app/commit/25ee12f59d67f6cf8efb27865105fb80894d15b0))
* filter by probe on data transferred and assertions panels for browser and scripted checks ([#1030](https://github.com/grafana/synthetic-monitoring-app/issues/1030)) ([23cf761](https://github.com/grafana/synthetic-monitoring-app/commit/23cf761c879dee96ece5b89f8ab7b8be9de3aecc))
* handle deprecated probes in the UI ([#1040](https://github.com/grafana/synthetic-monitoring-app/issues/1040)) ([c7b23ed](https://github.com/grafana/synthetic-monitoring-app/commit/c7b23ed9164a69af246dad266f1fd3cbae4109a1))
* keep reference of submitting form internally ([#1039](https://github.com/grafana/synthetic-monitoring-app/issues/1039)) ([bd91a18](https://github.com/grafana/synthetic-monitoring-app/commit/bd91a18214a287b7478ddf4356405e1d1ca7a11a))


### Miscellaneous Chores

* undo rollback to get main back on track ([#1035](https://github.com/grafana/synthetic-monitoring-app/issues/1035)) ([e287f10](https://github.com/grafana/synthetic-monitoring-app/commit/e287f10a7093cb9f9e7bfbe2d10cd216f63328ef))

## [1.16.11](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.10...v1.16.11) (2024-12-19)

### Fixes

* Revert to v1.16.9 ([#1027](https://github.com/grafana/synthetic-monitoring-app/issues/1027)) ([51e4d55](https://github.com/grafana/synthetic-monitoring-app/commit/51e4d5573d771f8aecd356a4dcb9a536b4c6f782))


## [1.16.10](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.9...v1.16.10) (2024-12-17)


### Features

* prompt on unsaved unload ([#1002](https://github.com/grafana/synthetic-monitoring-app/issues/1002)) ([9747b27](https://github.com/grafana/synthetic-monitoring-app/commit/9747b2778e824059768848014c53fba616a0d95a))


### Fixes

* add synthetic-monitoring-dev as owners of release files ([#1010](https://github.com/grafana/synthetic-monitoring-app/issues/1010)) ([d703e42](https://github.com/grafana/synthetic-monitoring-app/commit/d703e426e1e8a4c67689dd9794c4fd1f500fcf09))


### Miscellaneous Chores

* **deps:** bump nanoid from 3.3.7 to 3.3.8 ([#1018](https://github.com/grafana/synthetic-monitoring-app/issues/1018)) ([77032d0](https://github.com/grafana/synthetic-monitoring-app/commit/77032d060323c49ed68394a6e242b0b6aa528d29))
* update checks UI styling ([#1020](https://github.com/grafana/synthetic-monitoring-app/issues/1020)) ([2b69b02](https://github.com/grafana/synthetic-monitoring-app/commit/2b69b024e2759e862b6c1cc490e4490ccf4f4df4))

## [1.16.9](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.8...v1.16.9) (2024-11-29)


### Fixes

* create and organise CheckList page folder with dependent components ([#998](https://github.com/grafana/synthetic-monitoring-app/issues/998)) ([f45108e](https://github.com/grafana/synthetic-monitoring-app/commit/f45108eaf3cab5e9a6f94fb96d26c9bf6296ff1f))
* filter out disabled checks for execution count total ([#999](https://github.com/grafana/synthetic-monitoring-app/issues/999)) ([5383102](https://github.com/grafana/synthetic-monitoring-app/commit/53831026305a50b0102ef82817ab89015c17179c))
* moved routing components to own high-level folder ([#997](https://github.com/grafana/synthetic-monitoring-app/issues/997)) ([02a0a95](https://github.com/grafana/synthetic-monitoring-app/commit/02a0a9583a7c66d50bf7976e2c2d58cbb1f5bf07))


### Miscellaneous Chores

* update codeowners ([#1004](https://github.com/grafana/synthetic-monitoring-app/issues/1004)) ([edbf7a7](https://github.com/grafana/synthetic-monitoring-app/commit/edbf7a76f44aef259363011c57139c7e6c8fc87d))

## [1.16.8](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.7...v1.16.8) (2024-11-25)

### Features
* Feat/rework config page ([#990](https://github.com/grafana/synthetic-monitoring-app/pull/990))([56b05c3](https://github.com/grafana/synthetic-monitoring-app/commit/56b05c39e39e73a81656e43a6d27c1dc836bf6ab))

### Fixes

* probe selector column header color ([#995](https://github.com/grafana/synthetic-monitoring-app/issues/995)) ([08dbfba](https://github.com/grafana/synthetic-monitoring-app/commit/08dbfba0e18524d72b59c04bbe9e877abaed1a37))

### Miscellaneous Chores

* `react-router-dom` migration ([#980](https://github.com/grafana/synthetic-monitoring-app/issues/980)) ([f11b89a](https://github.com/grafana/synthetic-monitoring-app/commit/f11b89ae6fa1a8c42596dcb79de6f24772c94ea8))
* **deps:** bump cross-spawn from 7.0.3 to 7.0.6 ([#994](https://github.com/grafana/synthetic-monitoring-app/issues/994)) ([61073a3](https://github.com/grafana/synthetic-monitoring-app/commit/61073a33dc0bf172d659ea43431fee59f901920b))

## [1.16.7](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.6...v1.16.7) (2024-11-15)


### Fixes

* Changelog format ([#991](https://github.com/grafana/synthetic-monitoring-app/issues/991)) ([1142128](https://github.com/grafana/synthetic-monitoring-app/commit/1142128f3cc158682a1d0c306def7a4c3813521a))

## [1.16.6](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.5...v1.16.6) (2024-11-11)


### Fixes

* check usage calculation for MultiHTTP checks ([#984](https://github.com/grafana/synthetic-monitoring-app/issues/984)) ([c93de04](https://github.com/grafana/synthetic-monitoring-app/commit/c93de049c093c5cb1e6acc7ca59bcbcd651a3632))

## [1.16.5](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.4...v1.16.5) (2024-10-21)


### Features

* improve delete private probe flow ([#951](https://github.com/grafana/synthetic-monitoring-app/issues/951)) ([8be4a9e](https://github.com/grafana/synthetic-monitoring-app/commit/8be4a9ea3803dd909f774300bc787c0639e7d555))


### Fixes

* check target tooptip ([#971](https://github.com/grafana/synthetic-monitoring-app/issues/971)) ([e5533fe](https://github.com/grafana/synthetic-monitoring-app/commit/e5533fe9980da251d1730ce8de5112748d09fc2a))
* Update asc / desc reachability sorting ([#970](https://github.com/grafana/synthetic-monitoring-app/issues/970)) ([c281b77](https://github.com/grafana/synthetic-monitoring-app/commit/c281b7755055ae1958f4a758c448296e9e6aae6e))
* update browser examples to use async check ([#972](https://github.com/grafana/synthetic-monitoring-app/issues/972)) ([c7494ca](https://github.com/grafana/synthetic-monitoring-app/commit/c7494ca1c3a7641d88bd2356493fa0e9649f3e43))


### Miscellaneous Chores

* Update Drone signature ([#968](https://github.com/grafana/synthetic-monitoring-app/issues/968)) ([a40b5e6](https://github.com/grafana/synthetic-monitoring-app/commit/a40b5e6b4066ff57f2fb1d76a4bc725289edeec7))

## [1.16.4](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.3...v1.16.4) (2024-10-09)


### Fixes

* Publish script ([#966](https://github.com/grafana/synthetic-monitoring-app/issues/966)) ([b3a678b](https://github.com/grafana/synthetic-monitoring-app/commit/b3a678bb70b8a1d8343a74fb34520b97f67c9ca5))

## [1.16.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.2...v1.16.3) (2024-10-09)


### Miscellaneous Chores

* Add git to publish step ([#962](https://github.com/grafana/synthetic-monitoring-app/issues/962)) ([cfafe1f](https://github.com/grafana/synthetic-monitoring-app/commit/cfafe1f363086de0b209109e16f671dc26e41119))
* Change publish step image ([#964](https://github.com/grafana/synthetic-monitoring-app/issues/964)) ([d25ea9f](https://github.com/grafana/synthetic-monitoring-app/commit/d25ea9f808e735dcfe012493f00db6bb9bd151bd))

## [1.16.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.1...v1.16.2) (2024-10-08)


### Miscellaneous Chores

* Fix publish version ([#960](https://github.com/grafana/synthetic-monitoring-app/issues/960)) ([145fb08](https://github.com/grafana/synthetic-monitoring-app/commit/145fb0842f9fce80d0f90b496166ec6c81dab8d8))

## [1.16.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.16.0...v1.16.1) (2024-10-08)


### Miscellaneous Chores

* Fix release CI/CD ([#958](https://github.com/grafana/synthetic-monitoring-app/issues/958)) ([91ec8f9](https://github.com/grafana/synthetic-monitoring-app/commit/91ec8f972016b368128e62e774810a70d6bb225b))

## [1.16.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.15.2...v1.16.0) (2024-10-07)


### Features

* extra validations for browser checks ([#942](https://github.com/grafana/synthetic-monitoring-app/issues/942)) ([1e3960d](https://github.com/grafana/synthetic-monitoring-app/commit/1e3960dcb3b8a6b983e1821f65356620f70cb38b))
* set default timeout for browser checks to 1 min ([#945](https://github.com/grafana/synthetic-monitoring-app/issues/945)) ([e2be2da](https://github.com/grafana/synthetic-monitoring-app/commit/e2be2da8d4ef44dda965ff348f8386fbffcc3938))


### Fixes

* remove dynamic and unused data-fs-element attributes ([#941](https://github.com/grafana/synthetic-monitoring-app/issues/941)) ([d1b11ae](https://github.com/grafana/synthetic-monitoring-app/commit/d1b11aeccaf158b4fc25dd54e8a6845e37b125de))


### Miscellaneous Chores

* change browser checks to public preview status ([#952](https://github.com/grafana/synthetic-monitoring-app/issues/952)) ([26d0c5b](https://github.com/grafana/synthetic-monitoring-app/commit/26d0c5b8889b70bb98e2b9e2725a563e9afda74b))
* Setup release-please ([#933](https://github.com/grafana/synthetic-monitoring-app/issues/933)) ([e7ebcd6](https://github.com/grafana/synthetic-monitoring-app/commit/e7ebcd6d13f82d639aef240053bed6efa124cb2c))
* Tune release process ([#947](https://github.com/grafana/synthetic-monitoring-app/issues/947)) ([1b3f2c0](https://github.com/grafana/synthetic-monitoring-app/commit/1b3f2c0a54d62eb2a88093c9917d382cda001964))
* update fillform example to use async check ([#949](https://github.com/grafana/synthetic-monitoring-app/issues/949)) ([91b00e5](https://github.com/grafana/synthetic-monitoring-app/commit/91b00e5c39726a1ba7312f01778193afdd84632b))

## [1.15.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.15.1...v1.15.2) (2024-9-19)

- Allow to disable browser checks in probe creation (https://github.com/grafana/synthetic-monitoring-app/pull/928)
- Add browser checks validation (https://github.com/grafana/synthetic-monitoring-app/pull/930)
- New version of browser dashboards (https://github.com/grafana/synthetic-monitoring-app/pull/931)
- Add private preview badge to browser checks (https://github.com/grafana/synthetic-monitoring-app/pull/935)
- Updated status badge appearance and organisation (https://github.com/grafana/synthetic-monitoring-app/pull/936)
- Upgrade k6 types version to 0.53.0 (https://github.com/grafana/synthetic-monitoring-app/pull/937)
- Set browser checks min frequency to 60 seconds (https://github.com/grafana/synthetic-monitoring-app/pull/938)
- Add script examples specific to browser checks (https://github.com/grafana/synthetic-monitoring-app/pull/939)

## [1.15.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.13...v1.15.1) (2024-8-26)

- Bump axios from 1.6.7 to 1.7.4 (https://github.com/grafana/synthetic-monitoring-app/pull/909)
- Revert the way we do datasource lookups (https://github.com/grafana/synthetic-monitoring-app/pull/911)
- Fix typo in alerts error message (https://github.com/grafana/synthetic-monitoring-app/pull/913)
- Obtain SM datasource by its type and not name to prevent errors when it’s been renamed (https://github.com/grafana/synthetic-monitoring-app/pull/921)
- Revert sm:write permissions to be obtained froom org roles instead of datasource (https://github.com/grafana/synthetic-monitoring-app/pull/923)
- Add new version of uptime calculation query and set it under FF  (https://github.com/grafana/synthetic-monitoring-app/pull/840/)
- Hide grpc option in check cards when feature flag off (https://github.com/grafana/synthetic-monitoring-app/pull/922)

## [1.14.13](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.11...v1.14.13) (2024-8-20)

- Added datasource RBAC support in the plugin. The plugin now respects RBAC permissions for its datasources.
- Fix a bug with saving existing checks with empty TLS configs
- Fix a regression where the http checks follow redirects checkbox was missing
- Prevent problematic characters from being added to job names (commas and single/double quotes)
- Fix a bug with the assertions graph success / failure rate making the wrong query on scripted checks dashboard

## [1.14.11](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.10...v1.14.11) (2024-7-25)

- The check creation pages have been redesigned to be more user-friendly and intuitive. Every check now has five sections regardless of type.
- Check types now have a parent group: Api Endpoint, Multi step and Scripted in the plugin UI.
- Added restrictions when users have the viewer role.

## [1.14.10](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.9...v1.14.10) (2024-7-10)

- Upgrade scenes to version 5.1.0
- Fix cursor type on cards without links
- Improve non-initialized pages to provide section specific content
- Enforce named exports
- Avoid horizontal scrolling on check's dashboard
- Add regression test for longitud validation fix
- Add datasource to includes in order to provide support for loading synthentic monitoring appn assets from a CDN
- Make loki query fetch range instead of instant logs to prevent timeout errors on ad-hoc tests

## [1.14.9](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.8...v1.14.9) (2024-6-25)

- Fix home dashboard when applying filters for error percentage, latency and error rate panels.
- Fix validation for longitude field in custom probes creation form.

## [1.14.8](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.7...v1.14.8) (2024-6-19)

- Updated Grafana dependencies (@grafana/ui, @grafana/data, @grafana/runtime and @grafana/schema) to version 11.0.0
- Updated Grafana dependency version in plugin configuration.
- Added a PasswordField component to mask password inputs in the HTTP Auth section.
- Added a link to the docs in the check’s custom labels section.

## [1.14.7](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.6...v1.14.7) (2024-6-11)

- Added test execution rate in the check list page. Added accompaying sort options to sort checks by ascending / descending execution rates
- Fixed an issue where drilldowns are not working in the Scenes home dashboard
- Changed the HTTP authentication type to a radio button pattern rather than multiple checkboxes
- Changed probe form validation to zod schemas

## [1.14.6](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.5...v1.14.6) (2024-6-5)

- Removed public preview message from multihttp checks
- Added url parameters to manage check list state, allowing deep linking to specific checks
- Fix an issue on the homepage summary table where jobs were being duplicated
- Fix text for SSL tooltip in Scenes dashboards
- Fix alignment issues for labels and headers in the check creation forms
- Fix terraform export for private probes
- Fix wording for test executions in executions calculator
- Changed check form validation to zod schemas

## [1.14.5](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.4...v1.14.5) (2024-5-23)

- Fix a bug with with SSL failing checks option not being respected in http checks

## [1.14.4](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.3...v1.14.4) (2024-5-2)

- Fix a bug with traceroute timeouts gettings the wrong default value

## [1.14.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.2...v1.14.3) (2024-5-1)

- Fix a bug where checks with a frequency of 1 hour showing incorrect uptime on the check dashboards
- Fix a bug on the config page where the terraform export didn't have the dependencies it needed

## [1.14.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.1...v1.14.2) (2024-4-30)

- Make the check creation form responsive

## [1.14.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.14.0...v1.14.1) (2024-4-29)

- Temporarily disable responsive form layout that was causing issues with the scripted check editor

## [1.14.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.13.4...v1.14.0) (2024-4-29)

- Add a k6 based scripted check type
- Updates design of the check creation form
- Update documentation links
- Only show query params for the HTTP check type
- Fix the error log toggle to query by probe success instead of log error level

## [1.13.4](https://github.com/grafana/synthetic-monitoring-app/compare/v1.13.3...v1.13.4) (2024-4-18)

- Allow label limits to be configurable on a per tenant basis
- Fix a bug where check tests could timeout before their configured timeout
- Use average of http request duration for scripted check latency

## [1.13.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.13.2...v1.13.3) (2024-4-11)

- Fix a bug where the min step in dashboard queries was defaulting to 5 minutes unnecessarily

## [1.13.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.13.1...v1.13.2) (2024-4-10)

- Fix a bug where basic auth was always being submitted even when empty
- Fix a few typos in the scripted check form
- Clean up some old feature flags that were no longer used

## [1.13.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.13.0...v1.13.1) (2024-4-2)

- Fix a bug with empty search state and bulk selection
- Fix a bug with the TCP IP version selection section of the check edit form

## [1.13.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.13.0...v1.13.0) (2024-3-27)

- Lengthen frequency time range to up to 1 hour

## [1.12.10](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.9...v1.12.10) (2024-3-27)

- Fix a bug where uptime and reachability were reversed in the check list
- Redirect old scenes links to the updated model

## [1.12.9](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.8...v1.12.9) (2024-3-21)

- Fix a bug with bulk unselecting checks
- Fix a bug that prevented querying for long time periods

## [1.12.8](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.7...v1.12.8) (2024-3-13)

- Update dashboards to indicate they are deprecated. Newer versions are available inside the app itself.
- Fix a broken link to check creation when a user has no checks
- Add script examples to scripted check UI

## [1.12.7](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.6...v1.12.7) (2024-3-11)

- Update dashboards to use timeseries instead of the deprecated graph panel
- Fix a non-functional "Add check" button being visible for viewers.
- Remove deprecated arrayVector
- Add a probe region select

## [1.12.6](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.5...v1.12.6) (2024-2-26)

- Add alert annotations to the dashboards
- Allow unlimited headres in HTTP checks
- Improve navigation after check creation
- Change the navigation model to use individual checks instead of dashboard dropdowns

## [1.12.5](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.4...v1.12.5) (2024-1-25)

- Revamp the MultiHTTP dashboard
- Add a "Copy JSON" button to the dashboard menus so people can add charts to their own dashboards

## [1.12.4](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.3...v1.12.4) (2023-11-09)

- Bump up the max data points in the checks visualization view
- Fix a bug when instances have no alert ruler datasource

## [1.12.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.2...v1.12.3) (2023-11-07)

- Rework the summary dashboard to provide a more useful overview of checks
- Fix a bug with selecting individual URLs in the MultiHTTP scene
- Add improved description tooltips for reachability and uptime
- Improve error handling in the MultiHTTP form by scrolling to the first error and focusing inputs
- Change default MultiHTTP timeout
- Add additional context for assertion inputs
- Include MultiHTTP in generated terraform config
- Fix a bug with routing that caused flickers when the plugin had not yet been initialized

## [1.12.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.1...v1.12.2) (2023-10-16)

- Update docs on publisherToken provisioning
- Persist check filters after they've been selected and fix some layout issues
- Fix some layout issues in MultiHTTP checks
- Add check testing to MultiHTTP checks

## [1.12.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.12.0...v1.12.1) (2023-9-21)

- Fix some issues with check type selection
- Add a MultiHTTP usage calculator

## [1.12.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.7...v1.12.0) (2023-9-20)

- Allow all users to view alerts, and editors to edit them
- Fix spacing issues in the test check modal
- Update template dashboard JSON that was causing Grafana to crash on copy
- Update MultiHTTP URL validation
- Remove some old feature flags
- Remove the deprecated check list visualization view

## [1.11.7](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.6...v1.11.7) (2023-9-1)

- Add filtering and search to the check list visualization view
- Add enable/disable to the MultiHTTP form
- Fix query param fields in MultiHTTP
- Remove worldmap panel dependency

## [1.11.6](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.5...v1.11.6) (2023-8-23)

- Add an explore button to visualization menus
- Encode/decode MultiHTTP request bodies in base64

## [1.11.5](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.4...v1.11.5) (2023-8-14)

- Add alerting levels to MultiHTTP
- Fix error rate maps no filtering by probes
- Make the check editor back button less confusing
- Remove deprecated ArrayVector
- Fix some URL validation
- Various layout issues

## [1.11.4](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.3...v1.11.4) (2023-7-19)

- Fix an unhandled error in the traceroute nodegraph panel
- Various tweaks to the MultiHTTP scene and form

## [1.11.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.2...v1.11.3) (2023-7-10)

- Fix an incorrect frequency value in the HTTP scene
- Add an "edit check" button to all scenes

## [1.11.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.1...v1.11.2) (2023-26-1)

- Fix broken dashboard link from summary page
- Fix repeated "dashboard" on summary page

## [1.11.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.11.0...v1.11.1) (2023-26-1)

- Add a multihttp scene behind a feature flag

## [1.11.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.10.1...v1.11.0) (2023-6-1)

- Include some fixes for scenes
- Fix some issues with identifying datasources when an instance is renamed
- Replace the visualization list view with a scene
- Remove legacy theming

## [1.10.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.10.0...v1.10.1) (2023-4-26)

- Suppress an erroneous error toast in the alerting view
- Add some testing for Terraform generation output

## [1.10.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.36...v1.10.0) (2023-4-21)

- Add and release multi-http functionality behind feature flag
- Add and release scenes based dashboards behind feature flag
- Fix a bug with base64 encoding in TCP query/response
- Update datasource query editor to include probes in traceroute queries

## [1.9.36](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.35...v1.9.36) (2023-3-15)

- Update build tooling from grafana-toolkit to create-plugin

## [1.9.35](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.34...v1.9.35) (2023-2-16)

- Fix a bug with rendering data in the node panel for traceroute checks

## [1.9.34](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.33...v1.9.34) (2023-2-09)

- Fix a bug with the config page not rendering in cloud instances

## [1.9.33](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.32...v1.9.33) (2023-2-07)

- Upgrade the Worldmap panel dependency

## [1.9.32](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.31...v1.9.32) (2023-2-06)

- Fix a bug with the config page not rendering in cloud instances

## [1.9.31](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.30...v1.9.31) (2023-1-13)

- Fix a bug where checks weren't refetched after bulk updating probes
- Add some information on how to set up a private probe after creating a token
- Show error state if validating the body of an HTTP HEAD request
- Remove the legacy initialization flow

## [1.9.30](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.29...v1.9.30) (2023-1-9)

- Remove deprecated initialization flow

## [1.9.29](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.28...v1.9.29) (2023-1-4)

- Add proxy headers to HTTP checks

## [1.9.28](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.27...v1.9.28) (2022-11-9)

- Update Alert URL for compatiblity with Grafana 9

## [1.9.27](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.26...v1.9.27) (2022-11-8)

- Fix error message on non-traceroutes timeout field

## [1.9.26](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.25...v1.9.26) (2022-11-2)

- Fix a duplicate button on the setup page

## [1.9.25](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.24...v1.9.25) (2022-10-24)

- Support the new Grafana navigation setup

## [1.9.24](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.23...v1.9.24) (2022-10-11)

- Fix a bug with dashboard redirects that were causing them to lose query params

## [1.9.23](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.22...v1.9.23) (2022-10-5)

- Bump Grafana dependencies to version 9

## [1.9.22](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.21...v1.9.22) (2022-9-15)

- Update worldmap panel dependency

## [1.9.21](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.20...v1.9.21) (2022-8-10)

- Update link to alerting UI

## [1.9.20](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.19...v1.9.20) (2022-8-2)

- Make sure 100% is never rendered as 100.0%

## [1.9.19](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.18...v1.9.19) (2022-6-21)

- Fix a bug with some promql queries that could result in values over 100%

## [1.9.18](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.17...v1.9.18) (2022-6-21)

- Fix a bug with settting default alert rules in Grafana v9

## [1.9.17](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.16...v1.9.17) (2022-6-9)

- Handles a breaking change in the alerting api for Grafana v9

## [1.9.16](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.15...v1.9.16) (2022-6-3)

- Adds a more helpful error message when probe deletion fails

## [1.9.15](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.14...v1.9.15) (2022-4-28)

- Fixes a routing issue where the unprovisioned plugin could get stuck in an infinite loop
- Fixes a routing issue where the plugin could prevent navigation to other parts of Grafana

## [1.9.14](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.13...v1.9.14) (2022-4-15)

- Fixes a bug where there alerting tab could end up in a disabled state when it shouldn't

## [1.9.13](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.12...v1.9.13) (2022-3-29)

### Bug fixes

- Fixes reachability queries that could sometimes be over 100% for long time windows
- Hides dashboard update modal from users that don't have permissions to update dashboards

## [1.9.12](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.11...v1.9.12) (2022-3-16)

### Bug fixes

- Dashboard maps weren't displaying thresholds correctly
- Show custom alert thresholds in the check editor form

## [1.9.11](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.10...v1.9.11) (2022-3-3)

### Bug fixes

- Fix broken dashboard redirect logic

## [1.9.10](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.9...v1.9.10) (2022-2-16)

### Bug fixes

- Use datasource UIDs when creating dashboards instead of names
- Fix a potential infinite routing loop when initializing on prem

## [1.9.9](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.8...v1.9.9) (2022-2-04)

### Features

- Rearranged checklist filters under a central dropdown

## [1.9.8](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.7...v1.9.8) (2022-2-01)

## [1.9.7](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.6...v1.9.7) (2022-1-25)

### Features

- Adds a map to the probe edit page to visualize longitude & latitude

## [1.9.6](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.5...v1.9.6) (2022-1-21)

### Features

- Increase the maximum quantity of labels per check to 10.

## [1.9.5](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.4...v1.9.5) (2022-1-21)

### Bug fixes

- Fix a race condition that prevented values from showing up when navigating to the edit check form

## [1.9.4](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.3...v1.9.4) (2022-1-19)

### Bug fixes

- Update routing to use React router
- Fix a bug in the usage prediction calculation
- Accessibility fixes

### Features

- Include traceroute checks in the Terraform config export

## [1.9.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.9.2...v1.9.3) (2022-1-10)

### Bug fixes

- Gracefully handle inability to connect to API

## [1.9.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.8.1...v1.9.2) (2022-1-06)

### Features

- Added the ability to bulk edit probes for checks

## [1.8.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.8.0...v1.8.1) (2022-1-04)

### Bug Fixes

- Update the README with additional configuration details

## [1.8.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.7.0...v1.8.0) (2022-1-04)

### Features

- Add a `terraform import` command to the terraform config download. This allows users to generate intial TF state.

### Bug Fixes

- Replace worldmap panel plugin with geomap panel in all the dashboards
- Use the updated timeseries panel in the summary dashboard
- Rename the DNS dashboard to align with the other dashboards

## [1.7.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.61...v1.7.0) (2021-12-01)

### Features

- Add the ability to export checks and probes as terraform config from the plugin config page
- Add a button to generate a new API key in the plugin config page

## [1.6.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.5.6...v1.6.0) (2021-11-17)

### Features

- Add traceroute check type

## [1.5.6](https://github.com/grafana/synthetic-monitoring-app/compare/v1.5.5...v1.5.6) (2021-11-15)

### Bug Fixes

- Add data points per minute to usage calculator

## [1.5.5](https://github.com/grafana/synthetic-monitoring-app/compare/v1.5.4...v1.5.5) (2021-10-29)

### Features

- Mark deprecated probes as such in check editor. Prevent adding deprecated probes to checks.

## [1.5.3](https://github.com/grafana/synthetic-monitoring-app/compare/v1.5.2...v1.5.3) (2021-09-20)

### Bug Fixes

- Fix a dashboard config error

## [1.5.2](https://github.com/grafana/synthetic-monitoring-app/compare/v1.3.3...v1.5.2) (2021-09-20)

### Bug Fixes

- make homepage usage breakpoints smaller ([#367](https://github.com/grafana/synthetic-monitoring-app/issues/367)) ([d157abe](https://github.com/grafana/synthetic-monitoring-app/commit/d157abe6fdb53a1aefcfba81cc08270ab9a9e735))

## [1.5.1](https://github.com/grafana/synthetic-monitoring-app/compare/v1.3.3...v1.6.0) (2021-09-14)

### Bug Fixes

- config setup button was routing to a 404 ([#365](https://github.com/grafana/synthetic-monitoring-app/issues/365)) ([a08a9c8](https://github.com/grafana/synthetic-monitoring-app/commit/a08a9c8ac335d83bada5ee23a081be4f3fbee4fd))

## [1.5.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.3.3...v1.5.0) (2021-09-13)

### Features

- add a homepage ([625beb9](https://github.com/grafana/synthetic-monitoring-app/commit/625beb9a1bfad4e504d48791aef6417354195353))

## [1.4.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.3.3...v1.4.0) (2021-09-08)

### Features

- Add beta feature traceroute behind a feature flag ([#245](https://github.com/grafana/synthetic-monitoring-app/issues/245)) ([89ab9b1](https://github.com/grafana/synthetic-monitoring-app/commit/89ab9b1427734f88f8590bb15f59b786f02bed11))

## [1.3.2](https://github.com/grafana/synthetic-monitoring-app/compare/1.3.1...1.3.2) (2021-09-08)

### Bug Fixes

- check type selector should be disabled on edit ([#360](https://github.com/grafana/synthetic-monitoring-app/issues/360)) ([dda165e](https://github.com/grafana/synthetic-monitoring-app/commit/dda165e6187370d2726d4db0e31b8af2fe5bfa36))

## [1.3.0](https://github.com/grafana/synthetic-monitoring-app/compare/v1.2.30...v1.3.0) (2021-08-27)

### Bug Fixes

- go back to circle bild ([7d159fa](https://github.com/grafana/synthetic-monitoring-app/commit/7d159fadf099845dbe09b8bd4e57ea210bb783c7))

### Features

- almost there... skipping docs publish step ([d97521c](https://github.com/grafana/synthetic-monitoring-app/commit/d97521ce6038149f406bcce6406bc9242b11242e))
- gcom token secret ([1c2b5b8](https://github.com/grafana/synthetic-monitoring-app/commit/1c2b5b8473cc1cf719c0c678db1af60829f33ad1))

## [1.2.30] - 2021-08-27

- New start to changelog with updated build process
