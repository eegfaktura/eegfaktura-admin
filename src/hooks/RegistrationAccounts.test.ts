import {excelAccounts} from "./RegistrationContext";
import {accountSummary} from "../pages/registration/Registration.page";
import {accountState, resultText} from "../pages/registration/RegistrationAccounts.page";

const row = (cells: Record<string, string>) => ({
  "Vorname": "Kontakt", "Nachname": "Person", "EMail": "kontakt@test.local", ...cells,
})

describe("Excel member list: logins (platform#166)", () => {
  it("takes the main account and the further accounts with an e-mail", () => {
    expect(excelAccounts(row({
      "Hauptaccount\nVorname": "Haupt", "Hauptaccount\nNachname": "Account", "Hauptaccount\nE-Mail": " haupt@test.local ",
      "Nebenaccount 1\nVorname": "Neben", "Nebenaccount 1\nNachname": "Eins", "Nebenaccount 1\nE-Mail": "neben1@test.local",
      "Nebenaccount 2\nVorname": "Ohne", "Nebenaccount 2\nNachname": "Mail",
      "Nebenaccount 3\r\nVorname": "Neben", "Nebenaccount 3\r\nNachname": "Drei", "Nebenaccount 3\r\nE-Mail": "neben3@test.local",
    }))).toEqual([
      {firstname: "Haupt", lastname: "Account", email: "haupt@test.local"},
      {firstname: "Neben", lastname: "Eins", email: "neben1@test.local"},
      {firstname: "Neben", lastname: "Drei", email: "neben3@test.local"},
    ])
  })

  it("takes the contact when the main account is empty", () => {
    expect(excelAccounts(row({"Nebenaccount 1\nE-Mail": "neben1@test.local", "Nebenaccount 1\nVorname": "N", "Nebenaccount 1\nNachname": "E"})))
      .toEqual([
        {firstname: "Kontakt", lastname: "Person", email: "kontakt@test.local"},
        {firstname: "N", lastname: "E", email: "neben1@test.local"},
      ])
  })

  it("is empty without any e-mail", () => {
    expect(excelAccounts({"Vorname": "Kontakt"})).toEqual([])
  })
})

describe("registration result per login", () => {
  it("names each login and the reason of a failure", () => {
    expect(accountSummary([
      {email: "a@test.local", status: "created", message: ""},
      {email: "b@test.local", status: "linked", message: ""},
      {email: "c", status: "failed", message: "E-Mail-Adresse ungültig"},
    ])).toBe("Logins: a@test.local: angelegt; b@test.local: bestehender Account, EEG ergänzt; c: fehlgeschlagen (E-Mail-Adresse ungültig)")
    expect(accountSummary([])).toBe("")
  })
})

describe("accounts page texts", () => {
  it("explains the result", () => {
    expect(resultText({email: "a@test.local", status: "linked", message: ""})).toMatch(/schon einen Account/)
    expect(resultText({email: "a@test.local", status: "failed", message: "keycloak down"})).toMatch(/: keycloak down$/)
  })

  it("shows the account state", () => {
    const a = {username: "u", firstname: "A", lastname: "B", email: "a@test.local", enabled: true, passwordPending: false}
    expect(accountState(a)).toBe("aktiv")
    expect(accountState({...a, passwordPending: true})).toBe("Passwort noch nicht gesetzt")
    expect(accountState({...a, enabled: false, passwordPending: true})).toBe("deaktiviert")
  })
})
