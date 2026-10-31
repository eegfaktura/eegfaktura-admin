# Changelog

All notable changes to **eegfaktura-admin (admin frontend)** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and
versioning follows the deployment release tags. Detailed diffs stay in the `git log`;
this changelog highlights the changes relevant for overview and operations.

## [Unreleased]

### Fixed
- **A refused registration shows why** (261015-ca1). When the admin-backend refuses an EEG that exists (code 409), the
  page shows its message („EEG ist bereits registriert (Tenant …, RC-Nummer …). Es wurde nichts geändert.“) until it is
  closed, instead of „Error beim Anlegen des Mitglieds“, and keeps the form for a correction (it used to empty it, in Excel
  mode go on to the next sheet). Needs the admin-backend version that answers 409; before that nothing changes. Deploy
  order: free.
- **A picked date of a metering point no longer depends on the browser's time zone** (261005-ca3). „Aktiv seit“/„Inaktiv seit“
  went out as local midnight in epoch ms and the backend keeps the day of that moment in Europe/Berlin: in a browser
  further east the date came out one day early. They now go out as noon UTC of the picked day, which is that day in the
  backend for every browser zone; in Austria the saved date is the same as before. The format stays epoch ms (the
  entry's `YYYY-MM-DD` would be refused: `adminService.go` parses a number), so there is no contract change and no deploy
  order. A date that was not touched goes back as it came. A partly typed date now blocks saving instead of going out as
  „NaN“, which the backend ignored (for INACTIVE it took today). Unchanged: a stored date is shown in the browser's zone.

## [1.2.3] – 2026-10-31

### Changed
- **Build: Vite + Vitest instead of create-react-app (`react-scripts` 5.0.1, unmaintained).** `npm start` / `npm run build`
  / `npm test` keep their names; the build still writes `build/` (with source maps), so the Dockerfile and the layout of the image
  are unchanged, and the runtime configuration (`/config/keycloak-config.json`, rendered by Caddy from `KEYCLOAK_*`) is
  untouched — no deployment change. The `.env*` variables keep their `REACT_APP_` prefix (now read through
  `import.meta.env`); the dev proxies moved from `src/setupProxy.js` to `vite.config.ts` (plus `/energystore`; port 3000
  is now strict). Tests run on Vitest (jsdom), unchanged in content, with coverage in CI (`@vitest/coverage-v8`). The
  ESLint gate of the CRA build is now `npm run lint` (`.eslintrc.cjs`: the rules of react-scripts' `react-app` config,
  without Flow; any warning fails) and a CI step. Type checks: the app without test types (`tsconfig.json`), the tests
  (`tsconfig.test.json`) and `vite.config.ts` (`tsconfig.node.json`), all in `npm run build`. Dropped: the
  `browserslist` (Vite's default targets: browsers with ES2020 support).
- **Excel upload of the EEG registration with SheetJS 0.20.3 (see Security):**
  - **Real `.xlsx` and `.xls` files: same values as before**, apart from line breaks and `="…"` (below). Column headers
    with a line break are still found (they are compared
    without white space).
  - **HTML saved as `.xls`** is read like a CSV, so the same rule applies to it: `0664123`, `12/3` and `TRUE` now stay as
    written (0.18.5: `664123`, `37228`, `true`).
  - **`.csv`: every cell is now read as the text in the file** (`XLSX.read` with `raw: true`). 0.20.3 alone would have
    turned house numbers into numbers (`12 a` → `0`, `12 / 3` → `37228`, `12:30` → `0.5208…`); these stay text as
    before. Three old errors of the CSV upload go away: `12/3` no longer becomes `37228`, `3-5` no longer `36955`
    (both read as dates), and `0664123` keeps its leading zero. Other values change the same way: `1,5`, `5%`, `1e5`,
    `TRUE` and long digit strings stay as written, where they used to be read as numbers or booleans.
  - **A line break inside a cell now arrives as LF in every format** (`text()` normalises it once). Before, `.xlsx` gave
    CRLF and a quoted CSV cell LF.
  - **Excel's text notation `="0664123"` is unwrapped as before** (`0664123`, also in the RC number column and in the
    column headers, `""` inside gives `"`). `raw: true` alone would keep it literally, so `text()` in `RegistrationContext` removes it, in every
    file format: a text cell of an `.xlsx` that literally holds `="…"` is unwrapped too.
  - **A formula in a CSV, such as `=A1` or `=1+1`, now shows literally.** 0.18.5 dropped such a cell, the field stayed
    empty. This comes with the version upgrade, not with `raw: true`.
  - Left open, unchanged (eegfaktura-dev tracking admin 261031-mm1): a `.csv` in UTF-8 **without** BOM shows umlauts wrongly (`Hauptstraße` → `HauptstraÃe`), as
    in 0.18.5; with a BOM they are correct.

### Fixed
- **EEG registration: the same file can be chosen again** (eegfaktura-dev tracking admin 261031-mm3). After an upload the
  file input kept its value, so choosing the same file a second time, for example after editing it, did nothing.
- **EEG registration: a list with fewer than three rows below the header gets a clear message** (eegfaktura-dev tracking
  admin 261031-mm2). It ended as „Failed to parse Excel file.“, although the file was fine. Now the message says that no
  EEG was found, and a list loaded before stays as it was. The check counts the rows, it does not look at their content.
- **Portal: a failed master-data save is shown instead of hidden** (eegfaktura-dev tracking admin 261005-ca1). The edit
  dialogs for metering points (process state, active/inactive since), participants and the EEG settlement closed before
  the request finished; a failed save gave no message, the metering-point editors silently reset the form. Now the
  dialog waits for the save, closes only when it went through, and otherwise stays open with the error
  („Speichern fehlgeschlagen: <HTTP status>“); the metering-point editors still reset the form, now with that error.
  Every 2xx answer counts as success (before, any 2xx other than 200 passed `undefined` on to the table). A refused
  update reaches the admin web as an error only with admin-backend 261005-ca13 (the backend's refusal answers 400
  there; before, admin-backend answered 200).

### Security
- **Build tooling: react-scripts and its webpack/Jest/Babel tree removed** from `package-lock.json`, and with it the
  Dependabot alerts for body-parser, node-forge, nth-check, postcss, serialize-javascript, svgo,
  webpack-dev-middleware, webpack-dev-server and others from that tree (build and dev-server tooling; none of it was
  part of the shipped bundle). `xlsx` has its own entry below. The test-only `form-data` override follows
  eegfaktura-web: `^3.0.4` → `^4.0.4` (4.0.6).
- **`public/auth-config.js` and `public/config/keycloak.json` removed** (eegfaktura-dev tracking admin 1) — security relevant, details not published.
- **SheetJS (`xlsx`) 0.18.5 → 0.20.3 from the SheetJS CDN** (Dependabot alerts GHSA-4r6h-8v6p-xvw6, fixed in 0.19.3,
  and GHSA-5pgg-2g8v-p4x9, fixed in 0.20.2). SheetJS no longer publishes to npm (latest there is 0.18.5), so the
  package now comes from `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, pinned in `package-lock.json` by URL and
  sha512 integrity. Dependabot does not track this source: updates are made by hand (see README → Dependencies).
  The new workflow `sheetjs-check.yml` reports a failed check on a pull request whose `package.json` or lockfile no
  longer pin URL and integrity (a signal, master has no required checks), and fails its weekly run when SheetJS has a
  newer release. OSV-Scanner keeps reporting xlsx 0.20.3 with
  both GHSA IDs (the advisories have no fixed version because the fix is not on npm); Trivy does not. Open:
  CVE-2026-38358 and CVE-2026-38359 (eegfaktura-dev tracking WEB-261030-mm1).
- **CI: the release workflow pins its actions by commit SHA** (eegfaktura-dev tracking W-261028-mm6). `rolling-release.yml`
  builds and pushes the shipped image, but used floating tags (`@v4`, `@v3`, …); a moved tag ran in the job that holds
  the push credentials. Now every action is pinned to a commit, the same SHAs `pr-checks.yml` and `security-scan.yml` already
  use where the action is the same, otherwise the commit the floating tag pointed to on 2026-10-28.

## [1.2.2] – 2026-10-28

### Security
- Runtime image `caddy:2.8.4` → `caddy:2.11.7` (release 2026-10-03, Docker image tag 2026-10-05). 2.8.4 sat on
  Alpine 3.20 (end of support) and Go 1.22; the prod image scan of 2026-10-28 counted 7 CRITICAL / 89 HIGH,
  the new image 0 CRITICAL / 10 HIGH (Trivy 0.75.0). Caddyfile unchanged; responses (`/`, SPA routes, assets,
  `/config/keycloak-config.json`) are identical apart from the ETag format. New in Caddy 2.11.6: request headers
  are limited to 16 KiB (larger → `431`).

### Fixed
- **CI: the Snyk Code scan fails visibly when it cannot run.** An invalid `SNYK_TOKEN` ended the weekly and
  push scan green without any result (`continue-on-error`); now only „issues found“ keeps the run green (the
  issues go to Code Scanning), an authentication or tool error fails it. The Snyk CLI is pinned to 1.1308.1
  instead of the latest version.

## [1.2.1] – 2026-10-25

### Security
- `react-router-dom` 6.30.4 → 6.30.6 (with `react-router` 6.30.6, `@remix-run/router` 1.23.4): fixes the open redirect
  leading to XSS (GHSA-jjmj-jmhj-qwj2 / CVE-2026-53668, Dependabot #135). Patch release within the semver range,
  published 2026-08-18.
- Vulnerable dependencies updated within their semver ranges (platform#178): the Trivy scan goes from
  46 findings (2 CRITICAL, 44 HIGH) to 12 HIGH, none CRITICAL. `lodash` 4.18.1 (direct dependency, but not
  imported anywhere in `src`, so not in the bundle); the rest comes from the `react-scripts` build, test and
  dev-server toolchain: `proxy-addr`
  2.0.8, `shell-quote` 1.12.0 (`overrides` floor raised to ≥1.11.0), `source-map-js` 1.2.2, `rollup` 2.80.0,
  `@babel/plugin-transform-modules-systemjs` 7.29.8 (with `@babel/traverse` 7.29.10), `minimatch` 3.1.5 / 5.1.9, `http-proxy-middleware`
  2.0.10, `launch-editor` 2.14.2, `cross-spawn` 7.0.6, `picomatch` 2.3.2, `node-forge` 1.4.0,
  `webpack-dev-middleware` 5.3.4, `flatted` 3.4.4, `braces` 3.0.3, `compression` 1.8.2, `semver` 6.3.1,
  `svgo` 2.8.4 and `postcss` 8.5.31. Left open because only a major version fixes them: `svgo` 1.x /
  `nth-check` 1.x, `postcss` 7.x, `serialize-javascript` 4.x/6.x, `webpack-dev-middleware` CVE-2026-76844;
  without any fix: `braces` CVE-2026-93687, `node-forge` CVE-2026-85393. Also open: `xlsx` 0.18.5, the only
  vulnerable package shipped in the bundle (it reads the uploaded Excel files in `ExcelUploader`); its fixed
  versions are only on the SheetJS CDN, not on npm, the decision is pending.

### CI
- `rolling-release.yml`: no image build on a draft pull request — it runs when the pull request is marked ready for review (`ready_for_review`) and on every later push to it; `pr-checks.yml` still checks drafts. Pushes, tags and the deploy dispatch are unchanged.

## [1.2.0] – 2026-10-21

### Added
- **Several logins per community** (platform#166, needs admin-backend with `accounts`). The EEG registration has a
  list „Logins“ under the operator: from the Excel member list it is filled with the main account („Hauptaccount“, or
  the contact if that is empty) and the further accounts 1–3 that have an e-mail; it can be edited, and rows can be
  added or removed. Exactly these get a login with the same rights and a Keycloak mail to set their password; an
  e-mail with an existing, confirmed account only gets the community added. Empty list (also a member list without
  account columns): the operator gets the login, as before. After the registration the message names the result per
  login; a message with a failed login stays until it is closed.
- New page **Registration → EEG Accounts**: choose a community, see its logins (name, e-mail, username, state
  „aktiv“ / „Passwort noch nicht gesetzt“ / „deaktiviert“) and add one (first name, last name, e-mail). Removing a
  login stays in Keycloak.
- CI: `pr-checks.yml` on every pull request: Jest (unit), Jest with coverage and the
  production build (full), and a type check.
- CI: `security-scan.yml` on every pull request, on pushes to the default branch and weekly:
  leaked secrets in the new commits (Gitleaks, Trivy), vulnerable dependencies (Trivy,
  OSV-Scanner) and misconfigurations (Trivy). For now the dependency and misconfiguration
  findings are only reported (`SCAN_FAIL_ON: none`) and do not block; leaked secrets fail.
- CI: every run keeps its scan and test results as artifacts for 30 days (`scan-*`,
  `test-results-<job>`, `known-errors-<job>`) for a CI report collector; the secret scan keeps
  outcomes and counts only.

### Fixed
- **EEG registration from the Excel member list takes the email address** (support report 19.10.2026). The import
  looked for the column „E-Mail“, the list has „EMail“; the admin login of the new EEG (and with it the EEG's email)
  stayed empty. Column headers are now compared without case, spaces, line breaks and hyphens. The same mismatch hid
  the column „Lokal/Regional BEG/GEA“ (line break LF in the file, CRLF in the code): every EEG was created as
  „Local“, now GEA and regional are taken over. Every field is taken as trimmed text: empty cells no longer become „undefined“ or
  break the import or the submit, a trailing space in the region no longer turns GEA into „Local“.
- **CI fails on real build errors** (platform#178). `TSC_COMPILE_ON_ERROR` is gone from `pr-checks.yml` and
  `rolling-release.yml`: with it the build ended with exit 0 on every error, and an image without the app could have
  been pushed. Both workflows now check that `build/index.html` exists. The three type errors (MUI dialog
  `PaperProps` with `component: 'form'`) and the ESLint warnings of the build are fixed, without changing behaviour.
  The CRA sample test `src/App.test.tsx` is replaced by a smoke test (sign-in redirect, page without the role
  `superuser`, portal with sidebar); the job „Known errors“ is removed and „Type check“ blocks. The release build uses
  `npm ci` and Node 20.18.0 like `pr-checks.yml`. The act() warnings in the Ponton test are gone.

## [1.1.4] – 2026-10-17

### Fixed
- The Ponton registration page no longer reports success when the registration failed.
  admin-backend answers `POST /eeg/ponton` with HTTP 200 and puts the real outcome as
  `status`/`message` in the body; the UI now treats a body status outside 200–299 as an error
  and shows the backend's message, with the hint that the registration at Ponton may already
  have happened. The page also displays its success/error message at all (it was set but never
  rendered), keeps the form filled after an error and disables "Finish" while the request
  runs. Requires eegfaktura-admin-backend#25: older admin-backend
  versions report status 500 even on success, so this must not be released before it.

### Removed
- The unused service function `getEegUser` (`GET /eeg/users`, no caller in the UI) and its
  `EegUsers` model; eegfaktura-admin-backend#25 removes the endpoint.
- The Ponton communication type "E-Mail" (`MAIL`) and its SMTP fields in the EEG registration
  and the Ponton registration form. The mail transport is no longer used and
  eegfaktura-admin-backend#25 rejects it with 400. "Kep Server" and (in the EEG registration)
  "ignorieren / bereits konfiguriert" stay; the model still accepts `MAIL`.

## [1.1.3] – 2026-10-04

### Security
- The image no longer runs as root. Caddy listens above port 1024 per `caddy.conf`, so the
  privileges were never needed. A dedicated `app` user (UID/GID 1000) owns Caddy's XDG
  directories `/data` and `/config`; without that it fails on startup while writing its own
  state. The served files under `/var/www` stay root-owned, Caddy only reads them.
- The base image is pinned to `caddy:2.8.4` instead of `caddy:latest`. A floating tag meant
  every build could pull an arbitrary new Caddy version without anyone noticing. Same version
  as eegfaktura-web.

### Added
- CI builds `env/**` branches and deploys the resulting image into the matching feature
  environment (ADR-0008): a push to `env/<name>` pins this service in namespace `env-<name>`
  to that branch's `sha-…` image. Previously only the default branch, tags and `preview/**`
  produced an image at all. The environment itself is still provisioned manually.

## [1.1.2] – 2026-09-09

### Security
- The portal now shows a single, explicit "no access" page to accounts without the `superuser`
  realm role, instead of a fully navigable UI that fails with 403 on every action. The role is
  read from the access token, which already carries `realm_access.roles` — no Keycloak change
  needed.

  To be explicit about what this is: **a display decision, not a security control.** The
  boundary is enforced server-side (admin-backend requires the role on all routes since 1.0.3,
  energystore additionally on the raw-data delete). The token is decoded here, not verified —
  verifying a signature in the browser would secure nothing the server does not decide anyway.
  The point is that someone without the role learns why, in one place, instead of hitting a
  bare 403 on each attempt.

  The page also states that a freshly assigned role needs a new sign-in, since roles are frozen
  into the token when it is issued — the question that follows immediately otherwise.

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
