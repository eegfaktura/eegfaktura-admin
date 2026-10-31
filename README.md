# eegfaktura-admin

> Registration and administration web UI for the eegfaktura suite.

A single-page React application for onboarding and administering renewable energy
communities (EEGs): registering EEGs and participants, managing metering points
and grid-operator assignments, and performing administrative updates to EEG state.
It talks to `eegfaktura-admin-backend` and authenticates via Keycloak (OIDC).
(Container image: `eeg-registration-frontend`.)

Part of the **eegfaktura** suite — an open-source billing and management platform
for Austrian renewable energy communities (*Erneuerbare-Energiegemeinschaften*, EEG).

## Tech stack

- **TypeScript**, **React 18**, built with **Vite**, tests with **Vitest**
- **Material-UI (MUI 5)** + MUI X Data Grid
- **Redux Toolkit** + react-redux
- **Keycloak / OIDC** (`keycloak-js`, `oidc-client-ts`, `react-oidc-context`)
- react-hook-form + yup, react-router 6, `xlsx`
- Served in production by **Caddy**

## Structure

- `src/` — `components/`, `pages/`, `services/` (`EegService`, `PortalService`,
  `AuthService`), `redux/`, `routes/`, `model/`
- Entry point: `src/index.tsx`; runtime Keycloak config is fetched from
  `public/config/keycloak-config.json`

## Build

```bash
npm install
npm run build      # type check, then the production bundle in build/
npm test           # Vitest (watch mode; `npx vitest run` runs once)
npm run lint       # ESLint, fails on any warning (as the CRA build did)
```

## Run

Dev server:

```bash
npm start          # http://localhost:3000
```

`vite.config.ts` (`server.proxy`) proxies `/admin`, `/api` and `/cash` to local backend services.

Docker: the built image serves `build/` via Caddy on port **8080**.

## Configuration

- `REACT_APP_ADMIN_SERVER_URL` — admin backend base path (default `/admin`)
- Runtime OIDC config: `public/config/keycloak-config.json` (authority, realm, client)

Ports: dev **3000**; container **8080**.

## Dependencies

- **eegfaktura-admin-backend** — REST API under `/admin`
- **Keycloak** — OIDC authentication
- **SheetJS (`xlsx`) from the vendor CDN, not npm** — SheetJS stopped publishing to npm after 0.18.5, which has known
  vulnerabilities. `package.json` points to `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (v0.20.3, tagged
  2024-07-18, Apache-2.0); `package-lock.json` pins it with a sha512 `integrity`, which npm checks on every install.
  CI and local installs need to reach `cdn.sheetjs.com`. Only `ExcelUploader` uses it (the Excel member list of the
  EEG registration).
  - **Integrity:** npm writes the `integrity` for the tarball itself. The workflow `sheetjs-check.yml` (job „SheetJS
    pinned with integrity“, every pull request and push) fails when `package.json` or `package-lock.json` no longer pin
    the expected URL and sha512. It is a signal: master has no required checks.
  - **Updates:** Dependabot neither updates this dependency nor reports advisories for it. The same workflow compares
    with `https://cdn.sheetjs.com/xlsx-latest/package/package.json` every Monday (and on demand) and fails with a job
    summary when SheetJS has released something newer. **Known limit:** this cron is the only alarm, and GitHub switches
    off scheduled workflows after 60 days without activity in the repository; then it stays silent until the workflow
    is enabled again.
  - **Scanners:** GitHub's advisories GHSA-4r6h-8v6p-xvw6 (`< 0.19.3`) and GHSA-5pgg-2g8v-p4x9 (`< 0.20.2`) carry no
    fixed version on purpose, because the fixed releases are not on npm (github/advisory-database
    [#6144](https://github.com/github/advisory-database/pull/6144), [#8689](https://github.com/github/advisory-database/pull/8689),
    [#8690](https://github.com/github/advisory-database/pull/8690)). OSV copies these records, so OSV-Scanner keeps
    reporting xlsx 0.20.3 with both IDs. Trivy reads the version ranges and reports nothing. The security-scan gate is
    off today (`SCAN_FAIL_ON: none`); once it is on, it needs a central exception in the synced `security-scan.yml`
    (workspace), for web and admin. CVE-2026-38358 and CVE-2026-38359 (DoS, reported for `≤ 0.18.5`, not in the
    advisory databases yet) are tracked as WEB-261030-mm1 in eegfaktura-dev.
  - **To update:** check the new tag and its CHANGELOG on git.sheetjs.com, run `npm install <new tarball URL>`, change
    `URL` and `INTEGRITY` in `.github/scripts/sheetjs-check.sh` to the values npm wrote to `package-lock.json`, and
    compare them with `sha512-` + base64 of the SHA-512 of the downloaded `.tgz`
    (`openssl dgst -sha512 -binary x.tgz | base64 -w0`). Run `src/components/common/ExcelUploader.test.tsx`.

## License

GNU Affero General Public License v3.0 (AGPL-3.0) — see [`LICENSE`](LICENSE).
