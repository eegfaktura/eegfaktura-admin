# Changelog

All notable changes to **eegfaktura-admin (admin frontend)** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and
versioning follows the deployment release tags. Detailed diffs stay in the `git log`;
this changelog highlights the changes relevant for overview and operations.

## [Unreleased]

### Changed
- The raw-data delete tool now explains why a request was rejected instead of showing
  "Anfrage fehlgeschlagen (403)". A 403 here almost always means the account lacks the
  `superuser` realm role, and nothing said so — it cost a round of support questions before
  anyone looked at the server logs. The page now names the requirement up front in the warning
  box, and the error text spells out the fix, including that a freshly assigned role only takes
  effect after signing out and back in (roles are frozen into the token when it is issued).

  Both response shapes are handled: energystore's delete handler answers with
  `{"error": "..."}`, while its auth middleware writes a bare status with no body at all. The
  server detail is appended when present, but each message stands on its own without it.
  401, 400, 404 and 5xx get their own wording for the same reason.

## [1.1.1] – 2026-09-07

### Changed
- Dependency maintenance only: `@remix-run/router`/`react-router-dom`, `brace-expansion`,
  `body-parser`/`express`, `immutable` and `websocket-driver` updated, plus Dependabot now
  watching the `docker` ecosystem. No functional changes to the admin portal.

## [1.1.0] – 2026-07-11

### Added
- Ops page "Energiedaten löschen" (`/rawdata-delete`): delete the raw energy data of a single
  metering point within a time range (energystore v1). Two-step flow — dry-run preview shows the
  affected timesteps + summed kWh, then a double-confirm (retype the metering point) executes the
  irreversible zeroing. Calls **energystore directly** (`POST ${REACT_APP_ENERGY_SERVER_URL}/eeg/v2/
  {ecId}/rawdata/delete`, same-origin via the admin host's `/energystore` route) with the operator
  bearer + `tenant` header — no backend-to-backend hop; energystore enforces the `superuser` role on
  the endpoint. The community field is labelled **Gemeinschafts-ID** (the long `AT…` community id from
  the EEG properties, not the short EC-Nummer) with a helper text. Requires each environment's admin
  ingress to expose `/energystore` → energystore (dev done; prod via gitops).

### Changed
- CI: Preview-Deployments (ADR-0007) — Push auf `preview/**` baut+deployt on-demand in die Dev-Zone (sha-pinned, kein `:latest`), Auto-Reset bei Branch-Delete.

## [1.0.1] – 2026-06-30

### Security
- Pinned vulnerable transitive dependencies via npm `overrides` to clear the
  critical Dependabot alerts: `@babel/traverse` ≥7.23.2, `form-data` ≥3.0.4,
  `shell-quote` ≥1.8.4 (all from the `react-scripts` build/test toolchain) and
  `crypto-js` ≥4.2.0 (via `oidc-client-ts`). No runtime behaviour change.

### Fixed
- Portal manager: the metering point "Aktiv"/"Inaktiv" dates can now be edited
  reliably. The native `type="date"` inputs followed the browser locale for the
  segment order ("month is weird") and frequently dropped the entered value;
  replaced them with a localized MUI DatePicker (`DD.MM.YYYY`) in both the
  process-state dialog and the date-cell editors. (#14)

### Changed
- Added `@mui/x-date-pickers` and a root `LocalizationProvider` (moment adapter,
  `de` locale) so date entry is consistent across the admin web. (#14)

## [1.0.0] – 2026-06-28

First production release built entirely from public source.

### Fixed
- Configuration: `keycloak-config.json` is baked into the image as an env template
  instead of an empty `{}`. (#7)
- Registration: clears the grid-operator name validation error on ID selection. (#5)

### Changed
- Restored source files from source maps so the admin frontend builds from source. (#1)
- CI: push to the registry's development tier with an auto-rollout bridge
  (dispatch-deploy). (#3, #4)
- Added AGPL-3.0 license; README with service overview and tech stack. (#2, #6)
