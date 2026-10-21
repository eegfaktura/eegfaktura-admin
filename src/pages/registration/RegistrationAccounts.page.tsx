import React, {FC, useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {
  Alert, Autocomplete, Box, Button, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, TextField
} from "@mui/material";
import FormInputComponent from "../../components/form/FormInput.component";
import {EMAIL_RULE} from "../../components/registration/AccountsEegProperties.component";
import {Api} from "../../services/eeg.service";
import {AccountResult, AccountUser, AccountView, EegMember} from "../../model/eeg.model";

const emptyUser: AccountUser = {firstname: "", lastname: "", email: ""}

export const resultText = (r: AccountResult): string => {
  switch (r.status) {
    case "created":
      return `Account für ${r.email} angelegt. Die Person bekommt eine Mail, um ihr Passwort zu setzen.`
    case "linked":
      return `${r.email} hatte schon einen Account: die EEG wurde dort ergänzt.`
    default:
      return `Account für ${r.email} konnte nicht angelegt werden${r.message ? `: ${r.message}` : "."}`
  }
}

export const accountState = (a: AccountView): string =>
  !a.enabled ? "deaktiviert" : a.passwordPending ? "Passwort noch nicht gesetzt" : "aktiv"

// Further logins of a community (platform#166), all with the same rights as the operator's. Removing a login is
// done in Keycloak.
const RegistrationAccountsPage: FC = () => {
  const [eegs, setEegs] = useState<EegMember[]>([])
  const [eeg, setEeg] = useState<EegMember | null>(null)
  const [accounts, setAccounts] = useState<AccountView[] | undefined>()
  const [loadError, setLoadError] = useState<string | undefined>()
  const [result, setResult] = useState<AccountResult | undefined>()
  const [pending, setPending] = useState(false)

  const {control, handleSubmit, reset} = useForm<AccountUser>({defaultValues: emptyUser, mode: "all"})

  useEffect(() => {
    Api.eegService.getEeg()
      .then(list => setEegs([...(list ?? [])].sort((a, b) => a.tenant.localeCompare(b.tenant))))
      .catch(() => setLoadError("EEGs konnten nicht geladen werden"))
  }, []);

  const loadAccounts = (tenant: string) => {
    setAccounts(undefined)
    setLoadError(undefined)
    Api.eegService.getAccounts(tenant)
      .then(setAccounts)
      .catch(() => {
        setAccounts([])
        setLoadError("Accounts konnten nicht geladen werden")
      })
  }

  useEffect(() => {
    setResult(undefined)
    if (eeg) loadAccounts(eeg.tenant)
  }, [eeg]);

  const onSubmit = (user: AccountUser) => {
    if (!eeg) return
    setPending(true)
    const trimmed = {firstname: user.firstname.trim(), lastname: user.lastname.trim(), email: user.email.trim()}
    Api.eegService.addAccount(eeg.tenant, trimmed)
      .then(r => {
        setResult(r)
        if (r.status !== "failed") {
          reset(emptyUser)
          loadAccounts(eeg.tenant)
        }
      })
      .catch(e => setResult({email: trimmed.email, status: "failed", message: e?.message ?? ""}))
      .finally(() => setPending(false))
  }

  return (
    <Box className={"flex-col-mgap"} style={{padding: "16px"}}>
      <h2>EEG Accounts</h2>
      <Autocomplete
        options={eegs}
        value={eeg}
        onChange={(_, v) => setEeg(v)}
        getOptionLabel={o => `${o.tenant} – ${o.name}`}
        isOptionEqualToValue={(o, v) => o.tenant === v.tenant}
        renderInput={params => <TextField {...params} label="EEG"/>}
      />
      {loadError && <Alert severity="error">{loadError}</Alert>}

      {eeg && (
        <>
          <h4>Accounts mit Zugang zu {eeg.tenant}</h4>
          {accounts === undefined ? <CircularProgress size={24}/> :
            accounts.length === 0 ? <div>Keine Accounts gefunden.</div> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>E-Mail</TableCell>
                    <TableCell>Benutzername</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map(a => (
                    <TableRow key={a.username}>
                      <TableCell>{`${a.firstname} ${a.lastname}`.trim()}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>{a.username}</TableCell>
                      <TableCell>{accountState(a)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

          <h4>Account hinzufügen</h4>
          <div>
            Die Person bekommt dieselben Rechte wie die anderen Accounts der EEG und eine Mail, um ihr Passwort zu
            setzen. Hat die E-Mail-Adresse schon einen Account, wird die EEG dort ergänzt. Entfernen eines Accounts
            geht in Keycloak.
          </div>
          <FormInputComponent name="firstname" label="Vorname" control={control} type="text"
                              rules={{required: "Vorname fehlt"}}/>
          <FormInputComponent name="lastname" label="Nachname" control={control} type="text"
                              rules={{required: "Nachname fehlt"}}/>
          <FormInputComponent name="email" label="E-Mail" control={control} type="text"
                              rules={{required: "E-Mail fehlt", pattern: EMAIL_RULE}}/>
          <Box>
            <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={pending}>
              Account hinzufügen
            </Button>
          </Box>
          {result && (
            <Alert severity={result.status === "failed" ? "error" : "success"}>{resultText(result)}</Alert>
          )}
        </>
      )}
    </Box>
  )
}

export default RegistrationAccountsPage
