import React from 'react';
import {render, screen} from '@testing-library/react';
import {Provider} from "react-redux";
import {store} from "./redux/store";
import App from './App';

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

const renderApp = () => render(<Provider store={store}><App/></Provider>);

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
  expect(screen.getByText("Faktura ADMIN")).toBeInTheDocument();
  expect(screen.queryByText("Kein Zugriff auf das Verwaltungsportal")).not.toBeInTheDocument();
});
