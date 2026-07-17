#!/usr/bin/env bash
# Local/CI adapter from synthetic-monitoring-app to dem-dev's SM E2E lifecycle.
# The implementation below remains as a temporary fallback for the older
# dem-dev revision pinned by the POC workflow.
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEM_ROOT="${DEM_DEV_ROOT:-}"
ARTIFACT_DIR="${DEM_E2E_ARTIFACT_DIR:-${APP_ROOT}/artifacts/dem-dev}"
MANIFEST_PATH="${DEM_SCENARIO_MANIFEST:-${ARTIFACT_DIR}/scenario.json}"
SCENARIO="${DEM_E2E_SCENARIO:-http-latency-spike}"

usage() {
  cat <<'EOF'
Usage: scripts/dem-dev-e2e.sh <command>

Commands:
  configure    Create a CI-oriented dem-dev .env from .env.example
  doctor       Report all missing or conflicting prerequisites
  up           Start dem-dev and return when its resources are healthy
  seed         Backfill the configured scenario and write its manifest
  test         Run the Playwright suite against the running environment
  diagnostics  Capture container state and logs under artifacts/dem-dev
  down         Stop the isolated dem-dev Compose project
  run          Run up -> seed -> test, capturing diagnostics and cleaning up

Required:
  DEM_DEV_ROOT must point to a dem-dev checkout. For configure, SM_API_REPO and
  SM_AGENT_REPO must point to their checkouts. Existing local dem-dev users can
  configure .env themselves and skip configure.
EOF
}

note() {
  printf '%s\n' "$*"
}

delegate_to_dem_dev() {
  local command="$1"
  local lifecycle="${DEM_ROOT}/scripts/sm-e2e.sh"

  [[ -n "${DEM_ROOT}" && -f "${lifecycle}" ]] || return 1

  export DEM_E2E_ARTIFACT_DIR="${ARTIFACT_DIR}"
  export DEM_SCENARIO_MANIFEST="${MANIFEST_PATH}"
  export SM_GRAFANA_PLUGIN="${SM_GRAFANA_PLUGIN:-${APP_ROOT}}"

  case "${command}" in
    run)
      exec bash "${lifecycle}" run -- yarn e2e
      ;;
    configure | doctor | up | seed | diagnostics | down)
      exec bash "${lifecycle}" "${command}"
      ;;
  esac

  return 1
}

env_value() {
  local key="$1"
  local env_file="${DEM_ROOT}/.env"
  local line

  [[ -f "${env_file}" ]] || return 0
  line="$(grep -E "^[[:space:]]*${key}=" "${env_file}" 2>/dev/null | tail -1 || true)"
  [[ -n "${line}" ]] && printf '%s' "${line#*=}"
}

set_env_value() {
  local env_file="$1"
  local key="$2"
  local value="$3"
  local output="${env_file}.tmp.$$"

  awk -v key="${key}" -v value="${value}" '
    BEGIN { replaced = 0 }
    $0 ~ "^[[:space:]]*" key "=" {
      if (!replaced) {
        print key "=" value
        replaced = 1
      }
      next
    }
    { print }
    END {
      if (!replaced) print key "=" value
    }
  ' "${env_file}" >"${output}"
  mv "${output}" "${env_file}"
}

require_dem_root() {
  if [[ -z "${DEM_ROOT}" ]]; then
    note "error: DEM_DEV_ROOT is not set"
    note "Set it to the dem-dev checkout used for this environment."
    return 1
  fi
  if [[ ! -f "${DEM_ROOT}/Tiltfile" || ! -f "${DEM_ROOT}/.env.example" ]]; then
    note "error: DEM_DEV_ROOT=${DEM_ROOT} is not a dem-dev checkout"
    return 1
  fi
}

configure() {
  require_dem_root

  local env_file="${DEM_ROOT}/.env"
  local api_repo="${SM_API_REPO:-}"
  local agent_repo="${SM_AGENT_REPO:-}"
  local gomodcache="${LOCALGOMODCACHE:-}"

  if [[ -z "${api_repo}" || ! -d "${api_repo}" ]]; then
    note "error: SM_API_REPO must point to a synthetic-monitoring-api checkout"
    return 1
  fi
  if [[ -z "${agent_repo}" || ! -d "${agent_repo}" ]]; then
    note "error: SM_AGENT_REPO must point to a synthetic-monitoring-agent checkout"
    return 1
  fi
  if [[ -f "${env_file}" && "${DEM_E2E_FORCE_CONFIGURE:-false}" != "true" ]]; then
    note "error: ${env_file} already exists"
    note "Refusing to replace a developer environment. Set DEM_E2E_FORCE_CONFIGURE=true only for a disposable checkout."
    return 1
  fi
  if [[ -z "${gomodcache}" ]]; then
    gomodcache="$(go env GOMODCACHE)"
  fi

  note "==> Configuring disposable dem-dev runtime"
  cp "${DEM_ROOT}/.env.example" "${env_file}"
  set_env_value "${env_file}" LOCALGOMODCACHE "${gomodcache}"
  set_env_value "${env_file}" SM_ENABLED true
  set_env_value "${env_file}" SM_API_REPO "${api_repo}"
  set_env_value "${env_file}" SM_AGENT_REPO "${agent_repo}"
  set_env_value "${env_file}" SM_GRAFANA_PLUGIN "${APP_ROOT}"
  set_env_value "${env_file}" SM_PROBES_COUNT 0
  set_env_value "${env_file}" SM_ENABLE_LOCAL_OBSERVABILITY true
  set_env_value "${env_file}" SM_ENABLE_ALERTS false
  set_env_value "${env_file}" FEO_ENABLED false
  set_env_value "${env_file}" SIMNET_ENABLED false
  set_env_value "${env_file}" WEBAPPS_K6_TRAFFIC_ENABLED false
  set_env_value "${env_file}" DEM_COMPOSE_PROJECT "${DEM_COMPOSE_PROJECT:-sm-app-e2e}"
  note "    plugin=${APP_ROOT}/dist"
  note "    project=$(env_value DEM_COMPOSE_PROJECT)"
}

doctor() {
  local failures=()
  local warnings=()
  local command

  if ! require_dem_root; then
    return 1
  fi

  note "==> Checking dem-dev E2E prerequisites"
  for command in docker tilt go curl yarn; do
    if ! command -v "${command}" >/dev/null 2>&1; then
      failures+=("required command not found: ${command}")
    fi
  done
  if [[ ! -f "${DEM_ROOT}/.env" ]]; then
    failures+=("missing ${DEM_ROOT}/.env; configure dem-dev or run yarn e2e:dem:configure for a disposable checkout")
  fi
  if [[ ! -f "${APP_ROOT}/dist/plugin.json" ]]; then
    failures+=("plugin dist is missing; run yarn build or yarn dev first")
  fi

  local plugin_root api_repo agent_repo
  plugin_root="$(env_value SM_GRAFANA_PLUGIN)"
  api_repo="$(env_value SM_API_REPO)"
  agent_repo="$(env_value SM_AGENT_REPO)"

  if [[ "${plugin_root}" != "${APP_ROOT}" ]]; then
    failures+=("SM_GRAFANA_PLUGIN must be ${APP_ROOT} (found ${plugin_root:-<empty>})")
  fi
  if [[ -z "${api_repo}" || ! -d "${api_repo}" ]]; then
    failures+=("SM_API_REPO does not point to an existing checkout")
  fi
  if [[ -z "${agent_repo}" || ! -d "${agent_repo}" ]]; then
    failures+=("SM_AGENT_REPO does not point to an existing checkout; scenario generation currently compiles its collector")
  fi
  if [[ "$(env_value FEO_ENABLED)" != "false" ]]; then
    warnings+=("FEO_ENABLED is not false; unrelated FE O11y resources will lengthen startup")
  fi
  if [[ "$(env_value SIMNET_ENABLED)" != "false" ]]; then
    warnings+=("SIMNET_ENABLED is not false; the historical scenario smoke test does not need simnet")
  fi
  if [[ "$(env_value SM_PROBES_COUNT)" != "0" ]]; then
    warnings+=("SM_PROBES_COUNT is not 0; the app smoke test does not need live agents")
  fi

  if ((${#warnings[@]} > 0)); then
    note "    Warnings:"
    for warning in "${warnings[@]}"; do
      note "      - ${warning}"
    done
  fi
  if ((${#failures[@]} > 0)); then
    note "    Failed:"
    for failure in "${failures[@]}"; do
      note "      - ${failure}"
    done
    return 1
  fi

  note "    dem-dev, plugin dist, API, and scenario dependencies are ready"
}

up() {
  doctor
  mkdir -p "${ARTIFACT_DIR}"
  note "==> Starting dem-dev E2E runtime"
  (
    cd "${DEM_ROOT}"
    tilt ci \
      --timeout "${DEM_E2E_START_TIMEOUT:-20m}" \
      --output-snapshot-on-exit "${ARTIFACT_DIR}/tilt-snapshot.json"
  )
  note "    Grafana is ready at ${GRAFANA_URL:-http://localhost:3000}"
}

seed() {
  require_dem_root
  mkdir -p "${ARTIFACT_DIR}"
  note "==> Seeding dem-dev scenario ${SCENARIO}"
  if [[ "${DEM_E2E_CLEAN:-true}" == "true" ]]; then
    note "    clean=true: this wipes Prometheus and Loki data owned by the selected dem-dev runtime"
  fi
  SM_BACKFILL_SCENARIO="${SCENARIO}" \
    SM_BACKFILL_DURATION_HOURS="${DEM_E2E_DURATION_HOURS:-0.5}" \
    SM_BACKFILL_FREQUENCY_MS="${DEM_E2E_FREQUENCY_MS:-60000}" \
    SM_BACKFILL_CLEAN="${DEM_E2E_CLEAN:-true}" \
    SM_BACKFILL_MANIFEST="${MANIFEST_PATH}" \
    bash "${DEM_ROOT}/dev/composables/sm/scripts/backfill.sh"
  note "    manifest=${MANIFEST_PATH}"
}

test_e2e() {
  local grafana_url="${GRAFANA_URL:-}"
  local grafana_port

  if [[ -z "${grafana_url}" ]]; then
    grafana_port="$(env_value GRAFANA_PORT)"
    grafana_url="http://localhost:${grafana_port:-3000}"
  fi

  note "==> Running manifest-driven Playwright checks"
  note "    grafana=${grafana_url}"
  (
    cd "${APP_ROOT}"
    DEM_SCENARIO_MANIFEST="${MANIFEST_PATH}" GRAFANA_URL="${grafana_url}" yarn e2e "$@"
  )
}

runtime_project() {
  local project
  project="$(env_value DEM_COMPOSE_PROJECT)"
  printf '%s' "${project:-dem}"
}

diagnostics() {
  require_dem_root
  mkdir -p "${ARTIFACT_DIR}/containers"
  local project name
  project="$(runtime_project)"

  note "==> Capturing dem-dev diagnostics for project ${project}"
  docker ps -a \
    --filter "label=com.docker.compose.project=${project}" \
    --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' \
    >"${ARTIFACT_DIR}/containers.txt" 2>&1 || true

  while IFS= read -r name; do
    [[ -n "${name}" ]] || continue
    docker logs "${name}" >"${ARTIFACT_DIR}/containers/${name}.log" 2>&1 || true
  done < <(docker ps -a --filter "label=com.docker.compose.project=${project}" --format '{{.Names}}' 2>/dev/null)
  note "    diagnostics=${ARTIFACT_DIR}"
}

down() {
  require_dem_root
  local project
  project="$(runtime_project)"
  note "==> Stopping dem-dev E2E runtime (${project})"
  DEM_COMPOSE_PROJECT="${project}" bash "${DEM_ROOT}/scripts/down.sh"
}

run_all() {
  local status=0
  local cleanup_status=0

  set +e
  up
  status=$?
  if ((status == 0)); then
    seed
    status=$?
  fi
  if ((status == 0)); then
    test_e2e
    status=$?
  fi
  if ((status != 0)); then
    diagnostics
  fi
  if [[ "${DEM_E2E_KEEP_STACK:-false}" == "true" ]]; then
    note "==> Keeping dem-dev running for inspection (DEM_E2E_KEEP_STACK=true)"
  else
    down
    cleanup_status=$?
  fi
  set -e

  if ((status != 0)); then
    return "${status}"
  fi
  return "${cleanup_status}"
}

command="${1:-}"
if (($# > 0)); then
  shift
fi

# New dem-dev revisions own the runtime lifecycle. Keep the implementation below
# as a compatibility fallback until the app's pinned dem-dev revision contains
# scripts/sm-e2e.sh; then this adapter can collapse to delegation only.
if [[ "${command}" != "test" ]]; then
  delegate_to_dem_dev "${command}" || true
fi

case "${command}" in
  configure) configure ;;
  doctor) doctor ;;
  up) up ;;
  seed) seed ;;
  test) test_e2e "$@" ;;
  diagnostics) diagnostics ;;
  down) down ;;
  run) run_all ;;
  -h | --help | help) usage ;;
  *)
    usage
    [[ -n "${command}" ]] && note "error: unknown command: ${command}"
    exit 2
    ;;
esac
