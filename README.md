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

- **TypeScript**, **React 18** (Create React App / `react-scripts`)
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
npm run build      # production bundle in build/
```

## Run

Dev server:

```bash
npm start          # http://localhost:3000
```

`setupProxy.js` proxies `/admin`, `/api` and `/cash` to local backend services.

Docker: the built image serves `build/` via Caddy on port **8080**.

## Configuration

- `REACT_APP_ADMIN_SERVER_URL` — admin backend base path (default `/admin`)
- Runtime OIDC config: `public/config/keycloak-config.json` (authority, realm, client)

Ports: dev **3000**; container **8080**.

## Dependencies

- **eegfaktura-admin-backend** — REST API under `/admin`
- **Keycloak** — OIDC authentication

## License

GNU Affero General Public License v3.0 (AGPL-3.0) — see [`LICENSE`](LICENSE).
