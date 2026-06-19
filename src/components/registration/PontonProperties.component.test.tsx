import React from "react";
import {render, screen, waitForElementToBeRemoved} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Provider} from "react-redux";
import {combineReducers, configureStore} from "@reduxjs/toolkit";
import {FormProvider, useForm} from "react-hook-form";
import appStateSlice from "../../redux/features/appStateSlice";
import eegStateSlice, {setOperators} from "../../redux/features/eegStateSlice";
import PontonPropertiesComponent from "./PontonProperties.component";

// Reproduktion von obpeter/energycash-admin#4:
// "Auf der dritten Seite ... wird ein Validierungsfehler angezeigt, obwohl die
// Netzbetreiber ID ausgefüllt ist." Ursache: Auswahl der Netzbetreiber-ID befüllt
// grid.name per setValue OHNE Neuvalidierung -> der zuvor gesetzte
// required-Fehler "Netzbetreiber-Name fehlt" bleibt sichtbar stehen.

const makeStore = () => {
  const store = configureStore({reducer: combineReducers({appStateSlice, eegStateSlice})});
  store.dispatch(setOperators([{id: "AT003000", name: "Netz Oberösterreich GmbH"}]));
  return store;
};

const Wrapper: React.FC<{children: React.ReactNode}> = ({children}) => {
  const methods = useForm({
    mode: "all",
    defaultValues: {
      online: false,
      grid: {id: "", name: "", area: "LOCAL", allocation: "DYNAMIC"},
      user: {username: "", password: "", confirmPassword: ""},
      pontonInfo: {host: "", port: 0, username: "", password: "", confirmPassword: "", domain: "edanet.at", pontonCommType: "NONE"},
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

const renderComponent = () =>
  render(
    <Provider store={makeStore()}>
      <Wrapper>
        <PontonPropertiesComponent/>
      </Wrapper>
    </Provider>,
  );

test("Auswahl einer Netzbetreiber-ID räumt den required-Fehler des Netzbetreiber-Namens ab", async () => {
  renderComponent();

  // 1. required-Fehler auf dem (leeren) Namensfeld provozieren (onChange-Validierung).
  const nameInput = screen.getByLabelText("Netzbetreiber-Name");
  userEvent.type(nameInput, "x");
  userEvent.clear(nameInput);
  expect(await screen.findByText("Netzbetreiber-Name fehlt")).toBeInTheDocument();

  // 2. Netzbetreiber-ID auswählen -> grid.name wird automatisch befüllt.
  const idInput = screen.getByLabelText("Netzbetreiber-ID");
  userEvent.click(idInput);
  userEvent.type(idInput, "AT003000");
  userEvent.click(await screen.findByRole("option", {name: /AT003000/}));

  // 3. Name ist jetzt gesetzt -> der Validierungsfehler MUSS verschwinden
  // (Revalidierung nach setValue ist async).
  await waitForElementToBeRemoved(() => screen.queryByText("Netzbetreiber-Name fehlt"));
  expect(screen.queryByText("Netzbetreiber-Name fehlt")).not.toBeInTheDocument();
});
