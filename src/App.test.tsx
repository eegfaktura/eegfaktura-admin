import React from 'react';
import {render, screen} from '@testing-library/react';
import {Provider} from "react-redux";
import {makeStore} from "./redux/store";
import App from './App';
import {Api, EegService} from "./services/eeg.service";

// Smoke test of the app shell: sign-in redirect, the page for accounts without the role
// `superuser`, and the portal layout with the sidebar. Keycloak (react-oidc-context) is mocked.
const mockAuth: Record<string, any> = {};
vi.mock("react-oidc-context", () => ({
  useAuth: () => mockAuth,
  hasAuthParams: () => false,
}));

// Unsigned token with the given realm roles; App only decodes it.
const token = (roles: string[]) =>
  `x.${btoa(JSON.stringify({realm_access: {roles}})).replace(/=+$/, "")}.x`;

const setAuth = (isAuthenticated: boolean, roles: string[] = []) => {
  Object.assign(mockAuth, {
    isAuthenticated,
    isLoading: false,
    activeNavigator: undefined,
    user: isAuthenticated ? {access_token: token(roles)} : undefined,
    signinRedirect: vi.fn(),
    removeUser: vi.fn(),
  });
};

// a fresh store per test: the app state set by one test must not carry over to the next
const renderApp = () => render(<Provider store={makeStore()}><App/></Provider>);

// the portal (start page) loads the communities
const service = Api.eegService;
beforeEach(() => {
  window.history.pushState({}, "", "/");
  Api.eegService = {getEeg: async () => []} as unknown as EegService;
});
afterEach(() => {
  Api.eegService = service;
});

test('redirects to the sign-in when not authenticated', () => {
  setAuth(false);
  renderApp();
  expect(mockAuth.signinRedirect).toHaveBeenCalledTimes(1);
});

test('shows the access-denied page without the role superuser', () => {
  setAuth(true, ["offline_access"]);
  renderApp();
  expect(screen.getByText("Kein Zugriff auf das Verwaltungsportal")).toBeInTheDocument();
  expect(mockAuth.signinRedirect).not.toHaveBeenCalled();
});

test('shows the portal with its sidebar for a superuser', () => {
  setAuth(true, ["superuser"]);
  renderApp();
  expect(screen.getByText("Faktura Admin")).toBeInTheDocument();
  expect(screen.queryByText("Kein Zugriff auf das Verwaltungsportal")).not.toBeInTheDocument();
});

test('opens the portal on the start address', async () => {
  setAuth(true, ["superuser"]);
  renderApp();
  expect(window.location.pathname).toBe("/portal");
  expect(await screen.findByText("Keine Gemeinschaften")).toBeInTheDocument();
  expect(screen.getByRole("link", {name: "Gemeinschaften"})).toBeInTheDocument();
});

test('shows the group "Betrieb" in the menu', () => {
  setAuth(true, ["superuser"]);
  renderApp();
  expect(screen.getByText("Betrieb")).toBeInTheDocument();
  expect(screen.getByRole("link", {name: "Energiedaten löschen"})).toBeInTheDocument();
});
