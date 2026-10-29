import React from "react";
import {act, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {CellEditDialog, editDialog} from "./CellEdit.dialog";
import {EditDialogProvider, openDialog} from "../common/EditDialog.provider";
import {openParticipantDialog, ParticipantCellEditDialog} from "./editor/Participant.editor";
import {EegParticipant} from "../../model/eeg.model";

// A failed master-data save must stay visible (admin 261005-ca1): the edit dialogs close
// only after the save went through and show the error otherwise.

const deferred = () => {
  let resolve: () => void = () => {}
  const promise = new Promise<void>(r => { resolve = r })
  return {promise, resolve}
}

describe("CellEditDialog", () => {
  it("closes only after the save went through", async () => {
    const save = deferred()
    render(<CellEditDialog/>)
    act(() => editDialog(<div>Inhalt</div>, "Update ACTIVESINCE", () => save.promise))

    userEvent.click(screen.getByRole("button", {name: "Subscribe"}))
    // longer than the dialog's exit transition: a closed dialog would be gone by now
    await act(() => new Promise(r => setTimeout(r, 1000)))
    expect(screen.getByText("Update ACTIVESINCE")).toBeInTheDocument()

    await act(async () => save.resolve())
    await waitFor(() => expect(screen.queryByText("Update ACTIVESINCE")).not.toBeInTheDocument())
  })

  it("stays open and shows the error when the save fails", async () => {
    render(<CellEditDialog/>)
    act(() => editDialog(<div>Inhalt</div>, "Update ACTIVESINCE", () => Promise.reject(new Error("400"))))

    userEvent.click(screen.getByRole("button", {name: "Subscribe"}))

    expect(await screen.findByRole("alert")).toHaveTextContent("Speichern fehlgeschlagen: 400")
    expect(screen.getByText("Update ACTIVESINCE")).toBeInTheDocument()
  })

  it("does not show the previous error when it is opened again", async () => {
    render(<CellEditDialog/>)
    act(() => editDialog(<div>Inhalt</div>, "Update ACTIVESINCE", () => Promise.reject(new Error("400"))))
    userEvent.click(screen.getByRole("button", {name: "Subscribe"}))
    await screen.findByRole("alert")

    act(() => editDialog(<div>Inhalt</div>, "Update INACTIVESINCE", () => Promise.resolve()))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("EditDialogProvider", () => {
  it("stays open and shows the error when the save fails, closes when it succeeds", async () => {
    render(<EditDialogProvider/>)
    act(() => openDialog(<div>Inhalt</div>, "Verrechnung", () => Promise.reject(new Error("400"))))

    userEvent.click(screen.getByRole("button", {name: "Subscribe"}))
    expect(await screen.findByRole("alert")).toHaveTextContent("Speichern fehlgeschlagen: 400")
    expect(screen.getByText("Verrechnung")).toBeInTheDocument()

    act(() => openDialog(<div>Inhalt</div>, "Verrechnung", () => Promise.resolve()))
    userEvent.click(screen.getByRole("button", {name: "Subscribe"}))
    await waitFor(() => expect(screen.queryByText("Verrechnung")).not.toBeInTheDocument())
  })
})

describe("ParticipantCellEditDialog", () => {
  const row = {id: "p1", tenant: "TE100002", firstName: "Anna", lastName: "Ott", businessRole: "EEG_PRIVATE"} as EegParticipant

  it("stays open and shows the error when the save fails", async () => {
    const onUpdate = jest.fn().mockRejectedValue(new Error("400"))
    render(<ParticipantCellEditDialog/>)
    act(() => openParticipantDialog(row, onUpdate))

    userEvent.type(screen.getByLabelText("Nachname"), "x")
    userEvent.click(screen.getByRole("button", {name: "Subscribe"}))

    expect(await screen.findByRole("alert")).toHaveTextContent("Speichern fehlgeschlagen: 400")
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Update Mitglied")).toBeInTheDocument()
  })

  it("closes when the save went through", async () => {
    render(<ParticipantCellEditDialog/>)
    act(() => openParticipantDialog(row, () => Promise.resolve()))

    userEvent.type(screen.getByLabelText("Nachname"), "x")
    userEvent.click(screen.getByRole("button", {name: "Subscribe"}))

    await waitFor(() => expect(screen.queryByText("Update Mitglied")).not.toBeInTheDocument())
  })
})
