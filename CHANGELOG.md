# Changelog

All notable changes to **eegfaktura-admin (admin frontend)** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and
versioning follows the deployment release tags. Detailed diffs stay in the `git log`;
this changelog highlights the changes relevant for overview and operations.

## [Unreleased]

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
